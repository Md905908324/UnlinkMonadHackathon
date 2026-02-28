// agent/index.js
import { initUnlink, waitForConfirmation, TimeoutError, TransactionFailedError } from '@unlink-xyz/node';
import cron from 'node-cron';
import { prisma } from '../server.js';

// initialize the agent once and reuse
let agent;
async function getAgent() {
  if (agent) return agent;
  
  agent = await initUnlink({
    chain: 'monad-testnet',
    setup: false,
    sync: false,
  });
  
  // Import the mnemonic if AGENT_MNEMONIC is provided
  if (process.env.AGENT_MNEMONIC) {
    await agent.seed.importMnemonic(process.env.AGENT_MNEMONIC);
    await agent.accounts.create();
    await agent.sync();
  }
  
  return agent;
}

async function getAgentAddress() {
  const a = await getAgent();
  try {
    const active = await a.accounts.getActive();
    return active?.address ?? active?.publicKey ?? null;
  } catch (e) {
    // best-effort: fallback to accounts.get(0)
    try {
      const acc = await a.accounts.get(0);
      return acc?.address ?? null;
    } catch (_) {
      return null;
    }
  }
}

async function processExpiredLoans() {
  console.log('[Agent] Checking for expired loans...');

  const expiredLoans = await prisma.loan.findMany({
    where: {
      status: 'OPEN',
      deadline: { lte: new Date() }
    },
    include: {
      bids: {
        where: { status: 'PENDING' },
        orderBy: { rate: 'asc' }
      }
    }
  });

  for (const loan of expiredLoans) {
    console.log(`[Agent] Processing loan ${loan.id}`);
    await executeLoanMatch(loan);
  }
}

async function executeLoanMatch(loan) {
  const { bids } = loan;

  const matched = [];
  const unmatched = [];
  let filled = 0n;

  for (const bid of bids) {
    if (bid.rate > loan.maxRate) {
      unmatched.push(bid);
      continue;
    }
    if (filled >= loan.amount) {
      unmatched.push(bid);
      continue;
    }

    const remaining = loan.amount - filled;
    if (bid.amount <= remaining) {
      matched.push({ ...bid, acceptedAmount: bid.amount });
      filled += bid.amount;
    } else {
      matched.push({ ...bid, acceptedAmount: remaining });
      unmatched.push({ ...bid, refundAmount: bid.amount - remaining });
      filled += remaining;
    }
  }

  if (filled < loan.amount) {
    console.log(`[Agent] Loan ${loan.id} underfunded — cancelling`);
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'DEFAULTED' }
    });
    const agentInstance = await getAgent();
    for (const bid of bids) {
      try {
        const result = await agentInstance.send({
          transfers: [{
            token: process.env.USDC_ADDRESS,
            recipient: bid.lenderUnlink,
            amount: bid.amount
          }]
        });
        await waitForConfirmation(agentInstance, result.relayId);
      } catch (err) {
        console.error(`[Agent] Failed to refund bid ${bid.id}:`, err);
      }
      await prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'REFUNDED' }
      });
    }
    return;
  }

  const weightedRate = matched.reduce((sum, bid) => {
    return sum + (Number(bid.acceptedAmount) / Number(loan.amount)) * bid.rate;
  }, 0);

  try {
    const agentInstance = await getAgent();
    
    // 1. Send loan amount to borrower
    const borrowerResult = await agentInstance.send({
      transfers: [{
        token: process.env.USDC_ADDRESS,
        recipient: loan.borrowerUnlink,
        amount: loan.amount
      }]
    });
    await waitForConfirmation(agentInstance, borrowerResult.relayId);

    // 2. Refund unmatched lenders
    for (const bid of unmatched) {
      const refundAmount = bid.refundAmount ?? bid.amount;
      try {
        const result = await agentInstance.send({
          transfers: [{
            token: process.env.USDC_ADDRESS,
            recipient: bid.lenderUnlink,
            amount: refundAmount
          }]
        });
        await waitForConfirmation(agentInstance, result.relayId);
      } catch (err) {
        console.error(`[Agent] Failed to refund bidder ${bid.lenderUnlink}:`, err);
      }
    }

    // 3. Update database
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'MATCHED' }
    });

    for (const bid of matched) {
      await prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'MATCHED' }
      });
    }

    for (const bid of unmatched) {
      await prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'REFUNDED' }
      });
    }

    const weightedRate = matched.reduce((sum, bid) => {
      return sum + (Number(bid.acceptedAmount) / Number(loan.amount)) * bid.rate;
    }, 0);

    console.log(`[Agent] Loan ${loan.id} matched at ${(weightedRate * 100).toFixed(2)}% APR`);
  } catch (err) {
    if (err instanceof TimeoutError) {
      console.error(`[Agent] Timeout processing loan ${loan.id}:`, err.txId);
    } else if (err instanceof TransactionFailedError) {
      console.error(`[Agent] Transaction failed for loan ${loan.id} - state: ${err.state}, reason: ${err.reason}`);
    } else {
      console.error(`[Agent] Failed to process loan ${loan.id}:`, err);
    }
  }
}

async function checkForDefaults() {
  const activeLoans = await prisma.loan.findMany({ where: { status: 'MATCHED' } });
  for (const loan of activeLoans) {
    const repaymentDue = new Date(loan.createdAt);
    repaymentDue.setDate(repaymentDue.getDate() + loan.duration);
    if (new Date() > repaymentDue) {
      console.log(`[Agent] Default detected on loan ${loan.id}`);
      await handleDefault(loan);
    }
  }
}

async function handleDefault(loan) {
  await prisma.loan.update({ where: { id: loan.id }, data: { status: 'DEFAULTED' } });
  const matchedBids = await prisma.bid.findMany({ where: { loanId: loan.id, status: 'MATCHED' } });
  const totalLent = matchedBids.reduce((sum, b) => sum + b.amount, 0n);
  const agentInstance = await getAgent();
  
  for (const bid of matchedBids) {
    const share = (bid.amount * loan.amount) / totalLent;
    try {
      const result = await agentInstance.send({
        transfers: [{
          token: process.env.USDC_ADDRESS,
          recipient: bid.lenderUnlink,
          amount: share
        }]
      });
      await waitForConfirmation(agentInstance, result.relayId);
    } catch (err) {
      console.error(`[Agent] Failed to distribute collateral to ${bid.lenderUnlink}:`, err);
    }
  }
  console.log(`[Agent] Default on ${loan.id} — collateral distributed to lenders`);
}

// schedule cron jobs
cron.schedule('* * * * *', processExpiredLoans);
cron.schedule('*/5 * * * *', checkForDefaults);

export { processExpiredLoans, checkForDefaults, getAgentAddress };
