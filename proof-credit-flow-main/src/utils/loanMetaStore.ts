export type RiskTier = "Low" | "Medium" | "High";

export interface LoanClientMeta {
  riskTier?: RiskTier;
}

const STORAGE_KEY = "proofcredit.loan-meta";

function readStore(): Record<string, LoanClientMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LoanClientMeta>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, LoanClientMeta>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function setLoanClientMeta(loanId: string, meta: LoanClientMeta) {
  if (!loanId) return;
  const store = readStore();
  store[loanId] = { ...(store[loanId] || {}), ...meta };
  writeStore(store);
}

export function getLoanClientMeta(loanId: string): LoanClientMeta | null {
  if (!loanId) return null;
  const store = readStore();
  return store[loanId] || null;
}
