# Unlink Monad Hackathon

This repository contains the backend and frontend for the Unlink loan bidding demo.

This project is forked from the original hackathon repository. I contributed to the frontend development, helped connect the frontend and backend, and made additional patches and refinements to improve the application's functionality, usability, and overall quality.

## Backend

The backend is a minimal Node/Express service that:

* Stores loans, bids and credit profiles in SQLite (via Prisma)
* Runs a cron-based AI agent that matches bids and handles defaults
* Mocks a credit score API for onboarding
* Uses an `@unlink-xyz/node` agent wallet to send USDC tokens

### Getting started

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # then fill in AGENT_MNEMONIC, USDC_ADDRESS, etc.
   ```

3. **Generate Prisma client & migrate**
   ```bash
   npx prisma generate
   npm run prisma:migrate
   ```

   This will create `dev.db` in `backend/` and apply the schema defined in `schema.prisma`.

4. **Start the server**
   ```bash
   npm run dev    # requires nodemon, or use `npm start` for production
   ```

   The API listens on `http://localhost:3001` by default.

5. **Fund agent wallet**
   Request testnet tokens for the `AGENT_MNEMONIC` address and send USDC to it. The agent never holds funds long—it immediately forwards them during processing.

### API endpoints
See the `routes/` directory for full implementations. Some useful routes:

* `POST /api/credit` – create or refresh a credit profile
* `GET /api/loans` – lender marketplace
* `POST /api/loans` – borrower creates a loan request
* `POST /api/loans/:id/bids` – submit lender bid
* `POST /api/admin/trigger/:id` – force-expire a loan (demo only)

### Agent logic
Check `agent/index.js` for the matching and default-handling routines. The cron jobs fire every minute and every 5 minutes.

---

The `frontend/` folder contains the React UI.
