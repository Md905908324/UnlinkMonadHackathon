# Unlink Monad Hackathon — Patch Log

Date: 2026-03-01
PLEASE RECHECK TO ENSURE ALL FUNCTIONALITY, REQUIREMENTS, AND CRITERIAS ARE MET

## Scope
This log summarizes all bugs, patches, and updates completed across:
- `backend/`
- `proof-credit-flow-main/`
- selected integration/UI flows between borrower, lender, and dashboard views.

---

## 1) Wallet & Account Sync

### Bug
Different mnemonics were not creating distinct user sessions; dashboard/account identity looked shared.

### Patch
- Refactored wallet session handling to use derived wallet address instead of a hardcoded address.
- Persisted connected wallet session in local storage.
- Connected login flow to pass the derived address into context.
- Dashboard data fetches now key off active connected address and reset on disconnect/switch.

### Files
- `proof-credit-flow-main/src/contexts/WalletContext.tsx`
- `proof-credit-flow-main/src/pages/Login.tsx`
- `proof-credit-flow-main/src/pages/Dashboard.tsx`

---

## 2) Lender Dashboard Data Integration

### Bug
Lender dashboard section used static/mock positions.

### Patch
- Added lender positions endpoint.
- Added frontend API integration and dynamic lender dashboard rendering.
- Stats now computed from real wallet-scoped positions.

### Files
- `backend/routes/loans.js`
- `proof-credit-flow-main/src/services/api.ts`
- `proof-credit-flow-main/src/pages/Dashboard.tsx`

---

## 3) Risk/Scoring Engine & Recommendations

### Bug
Repayability/composite behavior was not dynamic enough and terms did not adjust robustly with inputs.

### Patch
- Upgraded formulas to use amount, collateral, income/debt, repayment duration, and profile factors.
- Added overextension penalty to sharply lower repayability when borrowing exceeds affordability.
- Updated recommendation outputs for APR range, suggested amount, and suggested repayment time.
- Added max-loan cap logic tied to income and duration.
- Added guardrails for negative values and duration cap.

### Files
- `proof-credit-flow-main/src/hooks/useRiskScore.ts`
- `proof-credit-flow-main/src/pages/borrow/BorrowForm.tsx`
- `proof-credit-flow-main/src/components/RecommendedTermsCard.tsx`

---

## 4) Borrow Form UX/Validation Updates

### Patch set
- Defaults adjusted over time per requirements:
  - amount defaults to 50% of monthly income
  - collateral default finalized to 0
  - repayment default finalized to 30 days
- Repayment input changed from preset label to numeric days.
- Duration bounded to max 365 days.
- Negative values reset/clamped to non-negative.
- Label update: `Length Until Repayment` → `Time Until Repayment`.
- APR warning badges:
  - red when too low
  - yellow when too high
  - green when in acceptable range
  with hover messages.

### Files
- `proof-credit-flow-main/src/pages/borrow/BorrowForm.tsx`

---

## 5) Confirm & Live Flow Consistency

### Bugs
- Risk tier not carrying correctly from form to confirmation/live.
- Confirm/Live displayed inconsistent detail fields.
- Auction countdown showed off-by-one style hour display (e.g., 167/166 instead of 168/167).

### Patch
- Added carry-over metadata in context for risk tier and timing fields.
- Added local persisted loan meta store and used it in lender/dashboard views for risk carry-over.
- Confirm page now shows borrower-consistent fields and correct risk badge color mapping.
- Added back arrow button to Confirm page.
- Live/market/dashboard time-left calculations standardized to ceil-based hour rounding.

### Files
- `proof-credit-flow-main/src/contexts/BorrowContext.tsx`
- `proof-credit-flow-main/src/pages/borrow/BorrowConfirmation.tsx`
- `proof-credit-flow-main/src/pages/borrow/LiveRequest.tsx`
- `proof-credit-flow-main/src/utils/loanMetaStore.ts`
- `proof-credit-flow-main/src/pages/lend/MarketDeals.tsx`
- `proof-credit-flow-main/src/pages/Dashboard.tsx`

---

## 6) Lender Deal Detail Improvements

### Patch
- Deal details aligned closer to borrower detail semantics:
  - Amount Requested (USDC)
  - Collateral Deposit (USDC)
  - Max APR Willing to Pay
  - Loan Duration
  - Time Left
  - Risk Tier
- Duration labels normalized; 7 days / 1 week equivalence handled consistently.
- Default bid amount now set to requested amount.
- APR default uses formula with floor.
- Bid expiry options aligned to borrower-style duration presets and capped by deal duration.
- Added AI suggested APR range (low/high) with buttons:
  - Apply Suggested Low Bid
  - Apply Suggested High Bid
- Risk tier badge color explicitly maps low=green, high=red.
- Fixed `Time Until Repayment` to use raw `loan.duration` (hours) consistently, instead of derived/fallback labels.
- Ensured duration is carried into lender dashboard bid details by including `loan.duration` in lender positions payload.
- Removed `Ask Duration` from lending detail views and standardized labels to `Loan Duration`.

### Files
- `proof-credit-flow-main/src/pages/lend/DealDetail.tsx`
- `proof-credit-flow-main/src/components/BidSuggestionBox.tsx`

---

## 7) Dashboard Loan/Bid Actions + Popups

### Borrower side
- Added Open loan details popup (modal).
- Added Cancel confirmation popup (Yes/No).
- Added Remove action for cancelled loans.
- Active/outstanding metrics refresh after actions.
- Added `Loan Duration` to borrower loan details modal.

### Lender side
- Added Open bid details popup (modal).
- Renamed lender bid details `Time Until Repayment` display to `Loan Duration` and bound it to `loan.duration`.
- Added Cancel confirmation popup (Yes/No).
- Added Remove action for cancelled bids.
- Data/stats refresh after actions.

### Files
- `proof-credit-flow-main/src/pages/Dashboard.tsx`
- `proof-credit-flow-main/src/services/api.ts`

---

## 8) Backend Action Endpoints Added

### Patch
Added/updated routes to support dashboard actions:
- `GET /api/loans/lender/:address`
- `POST /api/loans/:id/cancel`
- `DELETE /api/loans/:id` (remove cancelled loan)
- `POST /api/bids/:id/cancel`
- `DELETE /api/bids/:id` (remove cancelled/refunded bid)

### Files
- `backend/routes/loans.js`

---

## 9) Build/Validation Status

Throughout patching:
- Frontend TypeScript diagnostics checked repeatedly.
- `vite build` passed after each major change set.
- Existing non-blocking warnings remain (CSS `@import` order warning and chunk-size warnings).

---

## Notes
- This log captures implemented patches and behavior changes requested during iterative QA.
- If needed, this can be split into release notes by version/tag and grouped into backend/frontend migration checklists.

---

## 10) Completeness Addendum (Expanded File Coverage)

### Backend config/deps touched
- `backend/package.json`
- `backend/package-lock.json`

### Backend routes touched
- `backend/routes/loans.js`

### Frontend app files touched
- `proof-credit-flow-main/src/services/api.ts`
- `proof-credit-flow-main/src/contexts/WalletContext.tsx`
- `proof-credit-flow-main/src/pages/Login.tsx`
- `proof-credit-flow-main/src/pages/Dashboard.tsx`
- `proof-credit-flow-main/src/hooks/useRiskScore.ts`
- `proof-credit-flow-main/src/pages/borrow/BorrowForm.tsx`
- `proof-credit-flow-main/src/contexts/BorrowContext.tsx`
- `proof-credit-flow-main/src/pages/borrow/BorrowConfirmation.tsx`
- `proof-credit-flow-main/src/pages/borrow/LiveRequest.tsx`
- `proof-credit-flow-main/src/pages/lend/DealDetail.tsx`
- `proof-credit-flow-main/src/pages/lend/MarketDeals.tsx`
- `proof-credit-flow-main/src/components/BidSuggestionBox.tsx`
- `proof-credit-flow-main/src/components/RecommendedTermsCard.tsx`
- `proof-credit-flow-main/src/utils/loanMetaStore.ts` (new)

### Patch log artifact
- `mding_patches.md` (this file)

---

## 11) Generated/Environment Artifacts (Not Product Logic)

The repo also contains many modified/generated files from local runs. These are not feature logic patches but may appear in `git status`:

- Vite dependency cache files under:
  - `frontend/node_modules/.vite/deps/*`
  - `proof-credit-flow-main/node_modules/.vite/deps/*`
- Build outputs under:
  - `proof-credit-flow-main/dist/*`
- Runtime SQLite sidecars:
  - `backend/backend/data/agent.db-shm`
  - `backend/backend/data/agent.db-wal`

These were intentionally excluded from feature summaries unless explicitly needed for reproducibility/debugging.