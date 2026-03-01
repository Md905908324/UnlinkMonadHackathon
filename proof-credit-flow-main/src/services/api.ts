const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CreditProfile {
  unlinkAddress: string;
  declaredIncome: number;
}

interface LoanRequest {
  borrowerUnlink: string;
  onChainId: string;
  amount: string;
  collateral: string;
  durationHours: number;
  maxRate: number;
}

interface BidRequest {
  lenderUnlink: string;
  amount: string;
  rate: number;
}

interface Loan {
  id: string;
  borrowerUnlink: string;
  amount: string;
  collateral: string;
  maxRate: number;
  deadline: string;
  status?: string;
  creditScore?: number;
  _count?: { bids: number };
}

interface Bid {
  id: string;
  loanId: string;
  lenderUnlink: string;
  amount: string;
  rate: number;
  isPaid?: boolean;
}

// Credit Profile
export async function createCreditProfile(profile: CreditProfile) {
  const res = await fetch(`${API_URL}/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to create credit profile');
  return res.json();
}

export async function getCreditProfile(address: string) {
  const res = await fetch(`${API_URL}/credit/${address}`);
  if (!res.ok) throw new Error('Failed to fetch credit profile');
  return res.json();
}

// Loans
export async function getLoans(): Promise<Loan[]> {
  const res = await fetch(`${API_URL}/loans`);
  if (!res.ok) throw new Error('Failed to fetch loans');
  // endpoint already selects _count.bids so type above covers it
  return res.json();
}

export async function getLoan(id: string): Promise<Loan> {
  const res = await fetch(`${API_URL}/loans/${id}`);
  if (!res.ok) throw new Error('Failed to fetch loan');
  return res.json();
}

export async function createLoan(loan: LoanRequest) {
  const res = await fetch(`${API_URL}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loan),
  });
  if (!res.ok) throw new Error('Failed to create loan');
  return res.json();
}

// Bids
export async function getBids(loanId: string): Promise<Bid[]> {
  const res = await fetch(`${API_URL}/loans/${loanId}/bids`);
  if (!res.ok) throw new Error('Failed to fetch bids');
  return res.json();
}

export async function submitBid(loanId: string, bid: BidRequest) {
  const res = await fetch(`${API_URL}/loans/${loanId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bid),
  });
  if (!res.ok) throw new Error('Failed to submit bid');
  return res.json();
}

// Agent
export async function getAgentAddress() {
  const res = await fetch(`${API_URL}/agent/address`);
  if (!res.ok) throw new Error('Failed to fetch agent address');
  return res.json();
}

// Admin (demo only)
export async function triggerLoanExpiry(loanId: string) {
  const res = await fetch(`${API_URL}/admin/trigger/${loanId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger loan expiry');
  return res.json();
}
