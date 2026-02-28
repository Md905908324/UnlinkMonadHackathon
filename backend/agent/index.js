// agent/index.js
import { initUnlink, waitForConfirmation, createSqliteStorage, TimeoutError, TransactionFailedError } from '@unlink-xyz/node';
import cron from 'node-cron';
import { prisma } from '../server.js';

let agent = null;
let cronsStarted = false;

async function initAgent() {
  if (agent) return agent;

  const storagePath = process.env.AGENT_DB_PATH || './backend/data/agent.db';
  const storage = createSqliteStorage({ path: storagePath });

  agent = await initUnlink({
    chain: 'monad-testnet',
    storage,
    setup: false,
    sync: true,
  });

  // If mnemonic provided, import and create first account
  if (process.env.AGENT_MNEMONIC) {
    try {
      const exists = await agent.seed.exists();
      if (!exists) {
        await agent.seed.create();
      }
      await agent.seed.importMnemonic(process.env.AGENT_MNEMONIC);
      await agent.accounts.create();
      await agent.sync();
      console.log('[Agent] mnemonic imported and account created');
    } catch (e) {
      console.warn('[Agent] seed import/create warning', e?.message ?? e);
    }
  } else {
    // ensure there's at least one account
    const list = await agent.accounts.list();
    if (!list || list.length === 0) {
      await agent.accounts.create();
    }
  }

  return agent;
}

async function getAgent() {
  if (!agent) return initAgent();
  return agent;
}

async function getAgentAddress() {
  const a = await getAgent();
  try {
    const active = await a.accounts.getActive();
    return active?.address ?? null;
  } catch (e) {
    try {
      const acc = await a.accounts.get(0);
      return acc?.address ?? null;
    } catch (_) {
      return null;
    }
  }
}

// Record a lender's payment by waiting for confirmation of their relayId.
// Call this from your webhook or after the lender initiates the transfer.
async function recordPayment(bidId, relayId, timeout = 300_000) {
  const a = await getAgent();
  console.log('[Agent] recordPayment', { bidId, relayId });
  try {
    const status = await waitForConfirmation(a, relayId, { timeout });
    if (status.state === 'succeeded' || status.state === 'submitted') {
      // mark bid paid
      const bid = await prisma.bid.update({ where: { id: bidId }, data: { paid: true, paymentRelay: relayId, paidAmount: (await prisma.bid.findUnique({ where: { id: bidId } })).amount } });
      console.log('[Agent] bid marked paid', bidId);
      return bid;
    } else {
      throw new Error('Relay did not succeed: ' + status.state);
    }
  } catch (err) {
    console.error('[Agent] recordPayment error', err);
    throw err;
  }
}

// Main matching process: processes loans whose deadline passed.
async function processExpiredLoans() {
  console.log('[Agent] Checking for expired loans...');
  const expiredLoans = await prisma.loan.findMany({
    where: { status: 'OPEN', deadline: { lte: new Date() } },
    include: { bids: { where: { status: 'PENDING', paid: true }, orderBy: { rate: 'asc' } } }
  });

  for (const loan of expiredLoans) {
    console.log('[Agent] Processing loan', loan.id);
    try {
      await executeLoanMatch(loan);
    } catch (e) {
      console.error('[Agent] executeLoanMatch error', e);
    }
  }
}

async function executeLoanMatch(loan) {
  console.log('[Agent] executeLoanMatch start', loan.id);
  const loanAmount = BigInt(loan.amount);
  const bids = loan.bids || [];

  let filled = 0n;
  const matched = [];
  const unmatched = [];

  for (const b of bids) {
    const amt = BigInt(b.amount);
    if (b.rate > loan.maxRate) { unmatched.push(b); continue; }
    if (filled >= loanAmount) { unmatched.push(b); continue; }
    const remaining = loanAmount - filled;
    if (amt <= remaining) { matched.push({ ...b, acceptedAmount: amt }); filled += amt; }
    else { matched.push({ ...b, acceptedAmount: remaining }); unmatched.push({ ...b, refundAmount: amt - remaining }); filled += remaining; }
  }

  console.log('[Agent] match result', { loanId: loan.id, filled: String(filled), loanAmount: String(loanAmount), matched: matched.length, unmatched: unmatched.length });

  if (filled < loanAmount) {
    console.log('[Agent] underfunded — cancelling loan', loan.id);
    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'DEFAULTED' } });
    const a = await getAgent();
    for (const b of bids) {
      // refund paid lenders
      try {
        const refund = BigInt(b.amount);
        console.log('[Agent] refunding', b.id, refund.toString());
        const result = await a.send({ transfers: [{ token: process.env.USDC_ADDRESS, recipient: b.lenderUnlink, amount: refund }] });
        await waitForConfirmation(a, result.relayId);
      } catch (err) { console.error('[Agent] refund error', err); }
      await prisma.bid.update({ where: { id: b.id }, data: { status: 'REFUNDED' } });
    }
    return;
  }

  // everything funded — perform transfers
  const a = await getAgent();
  try {
    // send total loan to borrower
    console.log('[Agent] disbursing loan to borrower', loan.borrowerUnlink, String(loanAmount));
    const disb = await a.send({ transfers: [{ token: process.env.USDC_ADDRESS, recipient: loan.borrowerUnlink, amount: loanAmount }] });
    await waitForConfirmation(a, disb.relayId);

    // refund unmatched lenders
    for (const u of unmatched) {
      const refundAmt = BigInt(u.refundAmount ?? u.amount);
      try {
        console.log('[Agent] refunding unmatched', u.id, String(refundAmt));
        const r = await a.send({ transfers: [{ token: process.env.USDC_ADDRESS, recipient: u.lenderUnlink, amount: refundAmt }] });
        await waitForConfirmation(a, r.relayId);
      } catch (err) { console.error('[Agent] refund unmatched error', err); }
    }

    // update DB statuses
    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'MATCHED' } });
    for (const m of matched) {
      await prisma.bid.update({ where: { id: m.id }, data: { status: 'MATCHED', paid: true, paidAmount: String(m.acceptedAmount), paymentRelay: disb.relayId } });
    }
    for (const u of unmatched) {
      await prisma.bid.update({ where: { id: u.id }, data: { status: 'REFUNDED' } });
    }
    console.log('[Agent] loan matched', loan.id);
  } catch (err) {
    console.error('[Agent] executeLoanMatch error during transfers', err);
  }
}

async function checkForDefaults() {
  console.log('[Agent] Checking for defaults...');
  const activeLoans = await prisma.loan.findMany({ where: { status: 'MATCHED' } });
  for (const loan of activeLoans) {
    const repaymentDue = new Date(loan.createdAt);
    repaymentDue.setDate(repaymentDue.getDate() + loan.duration);
    if (new Date() > repaymentDue) {
      console.log('[Agent] default detected', loan.id);
      await handleDefault(loan);
    }
  }
}

async function handleDefault(loan) {
  await prisma.loan.update({ where: { id: loan.id }, data: { status: 'DEFAULTED' } });
  const matchedBids = await prisma.bid.findMany({ where: { loanId: loan.id, status: 'MATCHED' } });
  const totalLent = matchedBids.reduce((sum, b) => sum + BigInt(b.paidAmount ?? b.amount), 0n);
  const a = await getAgent();
  for (const bid of matchedBids) {
    const lent = BigInt(bid.paidAmount ?? bid.amount);
    const share = (lent * BigInt(loan.amount)) / totalLent;
    try {
      console.log('[Agent] default recovery send', bid.lenderUnlink, String(share));
      const r = await a.send({ transfers: [{ token: process.env.USDC_ADDRESS, recipient: bid.lenderUnlink, amount: share }] });
      await waitForConfirmation(a, r.relayId);
    } catch (err) { console.error('[Agent] default distribution error', err); }
  }
}

function startCrons() {
  if (cronsStarted) return;
  cron.schedule('* * * * *', processExpiredLoans);
  cron.schedule('*/5 * * * *', checkForDefaults);
  cronsStarted = true;
  console.log('[Agent] crons scheduled');
}

export { initAgent, getAgent, getAgentAddress, recordPayment, processExpiredLoans, checkForDefaults, startCrons };
