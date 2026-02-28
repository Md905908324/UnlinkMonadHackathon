// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// load .env values at startup
dotenv.config();

const { processExpiredLoans, checkForDefaults } = require('./agent');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// mount routes
app.use('/api', require('./routes/loans'));
app.use('/api', require('./routes/credit'));

// expose prisma for other modules if needed
module.exports.prisma = prisma;

console.log('[Agent] Starting...');

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
});

// start the cron jobs after server is up
processExpiredLoans();
checkForDefaults();
