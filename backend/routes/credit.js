// routes/credit.js
import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// POST /api/credit — mock KYC onboarding
router.post('/credit', async (req, res) => {
  try {
    const { unlinkAddress, walletAddress, declaredIncome } = req.body;
    console.log('[Credit] onboarding', { unlinkAddress, walletAddress, declaredIncome });

    const baseScore = 600;
    const incomeBonus = Math.min(Math.floor(declaredIncome / 1000), 150);
    const randomVariance = Math.floor(Math.random() * 50);
    const creditScore = baseScore + incomeBonus + randomVariance;

    const profile = await prisma.creditProfile.upsert({
      where: { unlinkAddress },
      create: { unlinkAddress, walletAddress, creditScore, declaredIncome },
      update: { creditScore, declaredIncome }
    });

    console.log('[Credit] created/updated profile', profile.id);
    res.json({ creditScore: profile.creditScore });
  } catch (err) {
    console.error('[Credit] error', err);
    res.status(500).json({ error: 'Failed to create credit profile' });
  }
});

// GET /api/credit/:address — fetch existing credit profile
router.get('/credit/:address', async (req, res) => {
  try {
    console.log('[Credit] fetch', req.params.address);
    const profile = await prisma.creditProfile.findUnique({ where: { unlinkAddress: req.params.address } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error('[Credit] error', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;