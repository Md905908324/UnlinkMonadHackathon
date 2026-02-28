// routes/credit.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../server');

// POST /api/credit — mock KYC onboarding
router.post('/credit', async (req, res) => {
  const { unlinkAddress, walletAddress, declaredIncome } = req.body;

  const baseScore = 600;
  const incomeBonus = Math.min(Math.floor(declaredIncome / 1000), 150);
  const randomVariance = Math.floor(Math.random() * 50);
  const creditScore = baseScore + incomeBonus + randomVariance;

  const profile = await prisma.creditProfile.upsert({
    where: { unlinkAddress },
    create: { unlinkAddress, walletAddress, creditScore, declaredIncome },
    update: { creditScore, declaredIncome }
  });

  res.json({ creditScore: profile.creditScore });
});

// GET /api/credit/:address — fetch existing credit profile
router.get('/credit/:address', async (req, res) => {
  const profile = await prisma.creditProfile.findUnique({
    where: { unlinkAddress: req.params.address }
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

module.exports = router;