# Quick Start Guide - Testing the Integration

## Prerequisites
- Node.js 18+
- Two terminal windows
- Test mnemonic (can use any valid 12-word phrase like `test test test test test test test test test test test junk`)

## 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
[Agent] Initializing...
[Agent] Initialized successfully
[Agent] crons scheduled
[Server] Running on port 3001
```

If you get database errors, the SQLite DB might need initialization. The Prisma schema should auto-create tables on first run.

## 2. Start Frontend

```bash
cd proof-credit-flow-main
npm install
npm run dev
```

Expected output:
```
VITE v5.x.x built in XXXms

➜  Local:   http://localhost:8080/
```

## 3. Test Borrower Flow

1. Open http://localhost:8080 in browser
2. Click "Get Started" or navigate to http://localhost:8080/login
3. Paste a test mnemonic: `test test test test test test test test test test test junk`
4. Click "Import Wallet"
5. Check browser console for errors
6. Should redirect to Workflow Select
7. Click "I want to borrow"
8. Follow the flow: Verify → Matching → Form → Confirm → Live

**Expected API calls:**
- `POST /api/credit` - Create credit profile
- `POST /api/loans` - Create loan request

## 4. Test Lender Flow

1. In a different browser tab, go to http://localhost:8080/lend/market
2. Should see list of loans loaded from `GET /api/loans`
3. Click on a loan card to go to deal detail
4. Enter bid amount and APR
5. Click "Submit Sealed Bid"

**Expected API calls:**
- `GET /api/loans` - Fetch all open loans
- `GET /api/loans/:id` - Fetch specific loan
- `GET /api/loans/:id/bids` - Fetch bids for that loan
- `POST /api/loans/:id/bids` - Submit bid

## 5. Monitor Backend

In backend terminal, you should see:
```
[Request] GET /api/loans
[Request] POST /api/loans
[Request] GET /api/loans/:id
[Request] GET /api/loans/:id/bids
[Request] POST /api/loans/:id/bids
```

## Troubleshooting

### "Failed to fetch" errors
- Check backend is running on port 3001
- Check browser console for CORS errors
- Check network tab to see actual response

### "Mnemonic invalid" on login
- Use exactly 12 or 24 space-separated words
- Check for leading/trailing spaces

### Loan doesn't appear in market
- Wait a moment for API response
- Refresh the page
- Check backend logs for errors

### Bid submission fails
- Check that wallet is connected (should show address)
- Verify bid amount is positive and less than loan amount
- Check backend logs for validation errors

## Database Reset

If you want to start fresh:

```bash
# Backend
rm backend/data/prisma.db
rm backend/data/agent.db
npm run dev  # Creates fresh DB

# Frontend
# Just close and restart - uses no local storage yet
```

## Debug Tips

### Check Backend Database
```bash
# In backend directory
npx prisma studio
# Opens http://localhost:5555 to browse DB
```

### Check API Directly
```bash
# Get all loans
curl http://localhost:3001/api/loans

# Get specific loan
curl http://localhost:3001/api/loans/1

# Create test loan (requires POST)
curl -X POST http://localhost:3001/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerUnlink": "test",
    "onChainId": "test",
    "amount": "1000",
    "durationHours": 168,
    "maxRate": 8
  }'
```

### Frontend DevTools
- Open browser DevTools (F12)
- Network tab to see API calls
- Console tab to see JS errors
- React DevTools to inspect component state

## Next Steps After Testing

If everything works:
1. Add authentication (wallet signature verification)
2. Implement sealed auction UI (hide bids until deadline)
3. Wire up payment flow to actually lock funds
4. Add error recovery and retries
5. Deploy to test environment

If issues:
1. Check INTEGRATION_SUMMARY.md Known Limitations section
2. Review specific file modifications
3. Check backend logs for validation errors
4. Verify data formats match between frontend/backend
