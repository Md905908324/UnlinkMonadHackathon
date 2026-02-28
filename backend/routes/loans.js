// routes/loans.js
import express from 'express';
import { prisma } from '../server.js';
import { getAgentAddress } from '../agent/index.js';

const router = express.Router();

// POST /api/loans — borrower creates request
router.post('/loans', async (req, res) => {
  const { borrowerUnlink, amount, duration, maxRate, onChainId } = req.body;

  // Verify they have a credit profile
  const profile = await prisma.creditProfile.findUnique({
    where: { unlinkAddress: borrowerUnlink }
  });
  if (!profile) return res.status(400).json({ error: 'Complete onboarding first' });

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24); // 24hr bidding window

  const loan = await prisma.loan.create({
    data: {
      onChainId,
      borrowerUnlink,
      creditScore: profile.creditScore,
      amount: BigInt(amount),
      duration,
      deadline,
      maxRate,
    }
  });

  res.json(loan);
});

// GET /api/loans — lender marketplace
router.get('/loans', async (req, res) => {
  const loans = await prisma.loan.findMany({
    where: { status: 'OPEN' },
    select: {
      id: true,
      onChainId: true,
      creditScore: true,      // ✅ visible to lenders
      amount: true,           // ✅ visible
      duration: true,         // ✅ visible
      deadline: true,         // ✅ visible
      maxRate: true,          // ✅ visible
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(loans);
});

// GET /api/loans/:id — single loan detail + bid count
router.get('/loans/:id', async (req, res) => {
  const loan = await prisma.loan.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { bids: true } } }
  });
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.json(loan);
});

// POST /api/loans/:id/bids — lender submits bid
router.post('/loans/:id/bids', async (req, res) => {
  const { lenderUnlink, amount, rate } = req.body;

  const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.status !== 'OPEN') return res.status(400).json({ error: 'Loan no longer accepting bids' });
  if (rate > loan.maxRate) return res.status(400).json({ error: 'Rate exceeds borrower cap' });
  if (new Date() > loan.deadline) return res.status(400).json({ error: 'Bidding window closed' });

  // Check for duplicate bid from same lender
  const existing = await prisma.bid.findFirst({
    where: { loanId: loan.id, lenderUnlink }
  });
  if (existing) return res.status(400).json({ error: 'Already bid on this loan' });

  const bid = await prisma.bid.create({
    data: { loanId: loan.id, lenderUnlink, amount: BigInt(amount), rate, paid: false }
  });

  // Provide payment instructions (agent escrow address) for lender to send funds.
  const agentAddr = await getAgentAddress();

  res.json({ bid, paymentInfo: { agentUnlinkAddress: agentAddr, note: 'Send funds to the agent escrow address before deadline' } });
});

// GET /api/loans/:id/bids — borrower sees bids on their loan (auth required)
router.get('/loans/:id/bids', async (req, res) => {
  // NOTE: in this simple setup we don't authenticate; trust the borrowerUnlink in query
  const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const bids = await prisma.bid.findMany({
    where: { loanId: loan.id }
  });
  res.json(bids);
});

// admin trigger route (demo only)
router.post('/admin/trigger/:id', async (req, res) => {
  await prisma.loan.update({
    where: { id: req.params.id },
    data: { deadline: new Date(Date.now() - 1000) }
  });
  const { processExpiredLoans } = await import('../agent/index.js');
  await processExpiredLoans();
  res.json({ triggered: true });
});

// GET /api/agent/address — returns agent's unlink address for deposits
router.get('/agent/address', async (req, res) => {
  const addr = await getAgentAddress();
  if (!addr) return res.status(500).json({ error: 'Agent address not available' });
  res.json({ address: addr });
});

export default router;
