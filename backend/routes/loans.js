// routes/loans.js
import express from 'express';
import { prisma } from '../server.js';
import { getAgentAddress } from '../agent/index.js';

const router = express.Router();

// simple router logger for loans
router.use((req, res, next) => {
  console.log(`[Loans] ${req.method} ${req.path}`);
  next();
});

// POST /api/loans — borrower creates request
router.post('/loans', async (req, res) => {
  try {
    const { borrowerUnlink, amount, collateral, durationHours, maxRate, onChainId } = req.body;
    console.log('[Loans] create loan request', { borrowerUnlink, amount, collateral, durationHours, maxRate, onChainId });

    // Verify they have a credit profile
    const profile = await prisma.creditProfile.findUnique({ where: { unlinkAddress: borrowerUnlink } });
    console.log('[Loans] profile lookup result', profile ? 'found' : 'NOT FOUND', borrowerUnlink);
    if (!profile) return res.status(400).json({ error: 'Complete onboarding first' });

    // Validate durationHours
    const durationHoursNum = Number(durationHours);
    if (!durationHoursNum || durationHoursNum <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // use durationHours as the bidding window on the marketplace
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + durationHoursNum);
    console.log('[Loans] deadline set to', deadline.toISOString());

    const loan = await prisma.loan.create({
      data: {
        onChainId,
        borrowerUnlink,
        creditScore: profile.creditScore,
        amount: String(amount),
        collateral: String(collateral),
        duration: durationHoursNum,
        deadline,
        maxRate,
      }
    });

    console.log('[Loans] created', loan.id);
    res.json(loan);
  } catch (err) {
    console.error('[Loans] create error', err.message || err);
    res.status(400).json({ error: err.message || 'Failed to create loan' });
  }
});

// GET /api/loans — lender marketplace
router.get('/loans', async (req, res) => {
  try {
    console.log('[Loans] listing open loans');
    const loans = await prisma.loan.findMany({
      where: { status: 'OPEN' },
      select: {
        id: true,
        onChainId: true,
        creditScore: true,
        amount: true,
        collateral: true,
        duration: true,
        deadline: true,
        maxRate: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (err) {
    console.error('[Loans] list error', err);
    res.status(500).json({ error: 'Failed to list loans' });
  }
});

// GET /api/loans/borrower/:address — get all loans for a borrower (MUST come before /:id)
router.get('/loans/borrower/:address', async (req, res) => {
  try {
    console.log('[Loans] fetching loans for borrower', req.params.address);
    const loans = await prisma.loan.findMany({
      where: { borrowerUnlink: req.params.address },
      include: { _count: { select: { bids: true } }, bids: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (err) {
    console.error('[Loans] fetch borrower loans error', err);
    res.status(500).json({ error: 'Failed to fetch borrower loans' });
  }
});

// GET /api/loans/lender/:address — get all bids/positions for a lender (MUST come before /:id)
router.get('/loans/lender/:address', async (req, res) => {
  try {
    console.log('[Loans] fetching lender positions for', req.params.address);
    const bids = await prisma.bid.findMany({
      where: { lenderUnlink: req.params.address },
      include: {
        loan: {
          select: {
            id: true,
            onChainId: true,
            borrowerUnlink: true,
            deadline: true,
            duration: true,
            status: true,
            maxRate: true,
            amount: true,
            collateral: true,
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(bids);
  } catch (err) {
    console.error('[Loans] fetch lender positions error', err);
    res.status(500).json({ error: 'Failed to fetch lender positions' });
  }
});

// POST /api/loans/:id/cancel — borrower cancels an open loan request
router.post('/loans/:id/cancel', async (req, res) => {
  try {
    const { borrowerUnlink } = req.body;
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (borrowerUnlink && loan.borrowerUnlink !== borrowerUnlink) {
      return res.status(403).json({ error: 'Not authorized to cancel this loan' });
    }
    if (loan.status !== 'OPEN') {
      return res.status(400).json({ error: 'Only OPEN loans can be cancelled' });
    }

    await prisma.$transaction([
      prisma.loan.update({ where: { id: loan.id }, data: { status: 'CANCELLED' } }),
      prisma.bid.updateMany({
        where: { loanId: loan.id, status: 'PENDING' },
        data: { status: 'CANCELLED' }
      })
    ]);

    res.json({ cancelled: true, loanId: loan.id });
  } catch (err) {
    console.error('[Loans] cancel loan error', err);
    res.status(500).json({ error: 'Failed to cancel loan' });
  }
});

// DELETE /api/loans/:id — borrower removes a cancelled loan request
router.delete('/loans/:id', async (req, res) => {
  try {
    const { borrowerUnlink } = req.body || {};
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (borrowerUnlink && loan.borrowerUnlink !== borrowerUnlink) {
      return res.status(403).json({ error: 'Not authorized to remove this loan' });
    }
    if (loan.status !== 'CANCELLED') {
      return res.status(400).json({ error: 'Only CANCELLED loans can be removed' });
    }

    await prisma.$transaction([
      prisma.bid.deleteMany({ where: { loanId: loan.id } }),
      prisma.loan.delete({ where: { id: loan.id } })
    ]);

    res.json({ removed: true, loanId: loan.id });
  } catch (err) {
    console.error('[Loans] remove loan error', err);
    res.status(500).json({ error: 'Failed to remove loan' });
  }
});

// POST /api/bids/:id/cancel — lender cancels a pending bid
router.post('/bids/:id/cancel', async (req, res) => {
  try {
    const { lenderUnlink } = req.body;
    const bid = await prisma.bid.findUnique({ where: { id: req.params.id } });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (lenderUnlink && bid.lenderUnlink !== lenderUnlink) {
      return res.status(403).json({ error: 'Not authorized to cancel this bid' });
    }
    if (bid.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING bids can be cancelled' });
    }

    const updated = await prisma.bid.update({
      where: { id: bid.id },
      data: { status: 'CANCELLED' }
    });
    res.json(updated);
  } catch (err) {
    console.error('[Loans] cancel bid error', err);
    res.status(500).json({ error: 'Failed to cancel bid' });
  }
});

// DELETE /api/bids/:id — remove cancelled/refunded bid from lender dashboard
router.delete('/bids/:id', async (req, res) => {
  try {
    const { lenderUnlink } = req.body || {};
    const bid = await prisma.bid.findUnique({ where: { id: req.params.id } });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (lenderUnlink && bid.lenderUnlink !== lenderUnlink) {
      return res.status(403).json({ error: 'Not authorized to remove this bid' });
    }
    if (bid.status !== 'CANCELLED' && bid.status !== 'REFUNDED') {
      return res.status(400).json({ error: 'Only CANCELLED or REFUNDED bids can be removed' });
    }

    await prisma.bid.delete({ where: { id: bid.id } });
    res.json({ removed: true, bidId: bid.id });
  } catch (err) {
    console.error('[Loans] remove bid error', err);
    res.status(500).json({ error: 'Failed to remove bid' });
  }
});

// GET /api/loans/:id — single loan detail + bid count
router.get('/loans/:id', async (req, res) => {
  try {
    console.log('[Loans] fetch loan', req.params.id);
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id }, include: { _count: { select: { bids: true } } } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    console.error('[Loans] get error', err);
    res.status(500).json({ error: 'Failed to fetch loan' });
  }
});

// POST /api/loans/:id/bids — lender submits bid
router.post('/loans/:id/bids', async (req, res) => {
  try {
    const { lenderUnlink, amount, rate } = req.body;
    console.log('[Loans] submit bid', { loanId: req.params.id, lenderUnlink, amount, rate });

    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status !== 'OPEN') return res.status(400).json({ error: 'Loan no longer accepting bids' });
    if (rate > loan.maxRate) return res.status(400).json({ error: 'Rate exceeds borrower cap' });
    if (new Date() > loan.deadline) return res.status(400).json({ error: 'Bidding window closed' });

    // Check for duplicate bid from same lender
    const existing = await prisma.bid.findFirst({ where: { loanId: loan.id, lenderUnlink } });
    if (existing) return res.status(400).json({ error: 'Already bid on this loan' });

    const bid = await prisma.bid.create({ data: { loanId: loan.id, lenderUnlink, amount: String(amount), rate, paid: false } });

    // Provide payment instructions (agent escrow address) for lender to send funds.
    const agentAddr = await getAgentAddress();
    console.log('[Loans] created bid', bid.id, 'agentAddr=', agentAddr);

    res.json({ bid, paymentInfo: { agentUnlinkAddress: agentAddr, note: 'Send funds to the agent escrow address before deadline' } });
  } catch (err) {
    console.error('[Loans] bid error', err);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

// GET /api/loans/:id/bids — borrower sees bids on their loan (auth required)
router.get('/loans/:id/bids', async (req, res) => {
  try {
    console.log('[Loans] fetch bids for', req.params.id);
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const bids = await prisma.bid.findMany({ where: { loanId: loan.id } });
    res.json(bids);
  } catch (err) {
    console.error('[Loans] fetch bids error', err);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
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
