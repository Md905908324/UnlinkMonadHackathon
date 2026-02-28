// agent/index.js
const { createUnlink } = require('@unlink-xyz/node');
const cron = require('node-cron');
const { prisma } = require('../server');

// initialize the agent once and reuse
let agent;
async function getAgent() {
  if (agent) return agent;
  agent = await createUnlink({
    mnemonic: process.env.AGENT_MNEMONIC,
    chain: 'monad-testnet',
  });
  return agent;
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
    for (const bid of bids) {
      await (await getAgent()).send([{
        token: process.env.USDC_ADDRESS,
        recipient: bid.lenderUnlink,
        amount: bid.amount
      }]);
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
    await agentInstance.send([{ token: process.env.USDC_ADDRESS, recipient: loan.borrowerUnlink, amount: loan.amount }]);

    for (const bid of unmatched) {
      const refundAmount = bid.refundAmount ?? bid.amount;
      await agentInstance.send([{ token: process.env.USDC_ADDRESS, recipient: bid.lenderUnlink, amount: refundAmount }]);
    }

    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'MATCHED' } });
    for (const bid of matched) {
      await prisma.bid.update({ where: { id: bid.id }, data: { status: 'MATCHED' } });
    }
    for (const bid of unmatched) {
      await prisma.bid.update({ where: { id: bid.id }, data: { status: 'REFUNDED' } });
    }

    console.log(`[Agent] Loan ${loan.id} matched at ${(weightedRate * 100).toFixed(2)}% APR`);
  } catch (err) {
    console.error(`[Agent] Failed to process loan ${loan.id}:`, err);
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
    await agentInstance.send([{ token: process.env.USDC_ADDRESS, recipient: bid.lenderUnlink, amount: share }]);
  }
  console.log(`[Agent] Default on ${loan.id} — collateral distributed to lenders`);
}

// schedule cron jobs
cron.schedule('* * * * *', processExpiredLoans);
cron.schedule('*/5 * * * *', checkForDefaults);

module.exports = { processExpiredLoans, checkForDefaults };
