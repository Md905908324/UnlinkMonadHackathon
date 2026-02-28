// server.js
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { processExpiredLoans, checkForDefaults } from './agent/index.js';
import loansRouter from './routes/loans.js';
import creditRouter from './routes/credit.js';

// load .env values at startup
dotenv.config();

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// simple request logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// mount routes
app.use('/api', loansRouter);
app.use('/api', creditRouter);

console.log('[Agent] Starting...');

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
});

// start the cron jobs after server is up
processExpiredLoans();
checkForDefaults();

// error handler
app.use((err, req, res, next) => {
  console.error('[Server] Uncaught error', err);
  res.status(500).json({ error: 'Internal server error' });
});
