import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Shield, Loader2, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getLenderPositions, cancelLoan, removeLoan, cancelBid, removeBid } from "@/services/api";
import { getLoanClientMeta } from "@/utils/loanMetaStore";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface LoanDetail {
  id: string;
  amount: string;
  collateral: string;
  maxRate: number;
  deadline: string;
  duration: number;
  creditScore?: number;
  status: string;
  bids: any[];
  _count?: { bids: number };
}

interface LenderPosition {
  id: string;
  amount: string;
  rate: number;
  status: string;
  loan: {
    id: string;
    onChainId: string;
    status: string;
    amount?: string;
    collateral?: string;
    maxRate?: number;
    deadline?: string;
    duration?: number;
    creditScore?: number;
  };
}

type CancelTarget =
  | { kind: "loan"; id: string }
  | { kind: "bid"; id: string }
  | null;

const Dashboard = () => {
  const [view, setView] = useState<"borrower" | "lender">("borrower");
  const { connected, address } = useWallet();
  const [borrowerLoans, setBorrowerLoans] = useState<LoanDetail[]>([]);
  const [lenderPositions, setLenderPositions] = useState<LenderPosition[]>([]);
  const [openLoanId, setOpenLoanId] = useState<string | null>(null);
  const [openLenderBidId, setOpenLenderBidId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBorrowerLoans = async () => {
    if (!connected || !address || view !== "borrower") {
      setBorrowerLoans([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/loans/borrower/${address}`);
      if (!res.ok) throw new Error("Failed to fetch loans");
      const data = await res.json();
      setBorrowerLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const fetchLenderPositions = async () => {
    if (!connected || !address || view !== "lender") {
      setLenderPositions([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getLenderPositions(address);
      setLenderPositions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lender positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowerLoans();
  }, [connected, address, view]);

  useEffect(() => {
    fetchLenderPositions();
  }, [connected, address, view]);

  useEffect(() => {
    setCancelTarget(null);
  }, [view]);

  const handleCancelLoan = async (loanId: string) => {
    if (!address) return;
    try {
      setActionBusyKey(`loan:${loanId}`);
      await cancelLoan(loanId, address);
      await fetchBorrowerLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel loan");
    } finally {
      setActionBusyKey(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    if (cancelTarget.kind === "loan") {
      await handleCancelLoan(cancelTarget.id);
    } else {
      await handleCancelBid(cancelTarget.id);
    }
    setCancelTarget(null);
  };

  const handleRemoveLoan = async (loanId: string) => {
    if (!address) return;
    try {
      setActionBusyKey(`loan-remove:${loanId}`);
      await removeLoan(loanId, address);
      if (openLoanId === loanId) setOpenLoanId(null);
      await fetchBorrowerLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove loan");
    } finally {
      setActionBusyKey(null);
    }
  };

  const handleCancelBid = async (bidId: string) => {
    if (!address) return;
    try {
      setActionBusyKey(`bid-cancel:${bidId}`);
      await cancelBid(bidId, address);
      await fetchLenderPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel bid");
    } finally {
      setActionBusyKey(null);
    }
  };

  const handleRemoveBid = async (bidId: string) => {
    if (!address) return;
    try {
      setActionBusyKey(`bid-remove:${bidId}`);
      await removeBid(bidId, address);
      await fetchLenderPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove bid");
    } finally {
      setActionBusyKey(null);
    }
  };

  // Calculate totals for borrower view
  const activeBorrowerLoans = borrowerLoans.filter((loan) => loan.status === "OPEN");
  const totalOutstanding = activeBorrowerLoans.reduce((sum, loan) => sum + (parseInt(loan.amount) || 0), 0);
  const totalCollateral = borrowerLoans.reduce((sum, loan) => sum + (parseInt(loan.collateral) || 0), 0);
  const avgRate = borrowerLoans.length > 0 ? (borrowerLoans.reduce((sum, loan) => sum + (loan.maxRate || 0), 0) / borrowerLoans.length).toFixed(1) : "0";
  const activeLenderPositions = lenderPositions.filter((p) => p.status === "PENDING" || p.status === "MATCHED");
  const lenderLockedCapital = activeLenderPositions.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
  const lenderEarnedInterest = lenderPositions
    .filter((p) => p.status === "MATCHED")
    .reduce((sum, p) => sum + ((parseInt(p.amount) || 0) * (p.rate || 0)), 0);
  const selectedBorrowerLoan = borrowerLoans.find((loan) => loan.id === openLoanId) || null;
  const selectedLenderBid = lenderPositions.find((position) => position.id === openLenderBidId) || null;
  const showBorrowerCancelModal = view === "borrower" && cancelTarget?.kind === "loan";
  const showLenderCancelModal = view === "lender" && cancelTarget?.kind === "bid";

  const fallbackRiskTier = (creditScore?: number) => {
    const score = creditScore ?? 600;
    if (score >= 700) return "Low";
    if (score >= 600) return "Medium";
    return "High";
  };

  const formatLoanDuration = (hours?: number) => {
    const safeHours = Math.max(0, Number(hours) || 0);
    if (!safeHours) return "N/A";
    if (safeHours < 24) return `${safeHours}h`;
    const days = Math.round(safeHours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setView("borrower")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "borrower" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Borrower
            </button>
            <button
              onClick={() => setView("lender")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "lender" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Lender
            </button>
          </div>
        </div>

        {view === "borrower" ? (
          <div className="space-y-6 animate-fade-in">
            {!connected || !address ? (
              <div className="glow-card p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-muted-foreground">Connect your wallet to view borrower positions</p>
              </div>
            ) : loading ? (
              <div className="glow-card p-6 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin" />
              </div>
            ) : error ? (
              <div className="glow-card p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : borrowerLoans.length === 0 ? (
              <div className="glow-card p-6 text-center">
                <p className="text-muted-foreground">No active loan requests yet</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon={DollarSign} label="Outstanding Balance" value={`$${totalOutstanding.toLocaleString()}`} />
                  <StatCard icon={Clock} label="Active Requests" value={activeBorrowerLoans.length.toString()} />
                  <StatCard icon={Activity} label="Avg Max Rate" value={`${avgRate}%`} accent />
                </div>

                <div className="glow-card p-6">
                  <h3 className="font-heading font-semibold mb-4">Your Loan Requests</h3>
                  <div className="space-y-3">
                    {borrowerLoans.map((loan) => {
                      const bidCount = loan._count?.bids || loan.bids?.length || 0;
                      const timeLeft = new Date(loan.deadline).getTime() - Date.now();
                      const hoursLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60)));
                      return (
                        <div key={loan.id} className="bg-secondary rounded-xl px-4 py-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-muted-foreground">{loan.id.slice(0, 8)}</span>
                            <span className={`text-xs px-2 py-1 rounded ${loan.status === 'OPEN' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {loan.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>${parseInt(loan.amount).toLocaleString()}</span>
                            <span className="text-muted-foreground">{loan.maxRate}% APR</span>
                            <span className="text-muted-foreground">{bidCount} bid{bidCount !== 1 ? 's' : ''}</span>
                            <span className="text-muted-foreground">{hoursLeft}h left</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              className="glow-button-outline text-xs px-3 py-1.5"
                              onClick={() => setOpenLoanId(loan.id)}
                            >
                              Open
                            </button>
                            {loan.status === "OPEN" && (
                              <button
                                className="glow-button-outline text-xs px-3 py-1.5 text-destructive"
                                onClick={() => setCancelTarget({ kind: "loan", id: loan.id })}
                                disabled={actionBusyKey === `loan:${loan.id}`}
                              >
                                {actionBusyKey === `loan:${loan.id}` ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                            {loan.status === "CANCELLED" && (
                              <button
                                className="glow-button-outline text-xs px-3 py-1.5"
                                onClick={() => handleRemoveLoan(loan.id)}
                                disabled={actionBusyKey === `loan-remove:${loan.id}`}
                              >
                                {actionBusyKey === `loan-remove:${loan.id}` ? "Removing..." : "Remove"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {selectedBorrowerLoan && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setOpenLoanId(null)}>
                <div className="glow-card glow-card-active p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold">Loan Details</h3>
                    <button className="glow-button-outline text-xs px-2 py-1" onClick={() => setOpenLoanId(null)}>Close</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan ID</span><span className="font-mono">{selectedBorrowerLoan.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount Requested</span><span>${parseInt(selectedBorrowerLoan.amount || "0").toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Collateral</span><span>${parseInt(selectedBorrowerLoan.collateral || "0").toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Max APR</span><span>{selectedBorrowerLoan.maxRate}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan Duration</span><span>{formatLoanDuration(selectedBorrowerLoan.duration)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span>{getLoanClientMeta(selectedBorrowerLoan.id)?.riskTier || fallbackRiskTier(selectedBorrowerLoan.creditScore)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{selectedBorrowerLoan.status}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span>{new Date(selectedBorrowerLoan.deadline).toLocaleString()}</span></div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 justify-end">
                    {selectedBorrowerLoan.status === "OPEN" && (
                      <button
                        className="glow-button-outline text-xs px-3 py-1.5 text-destructive"
                        onClick={() => setCancelTarget({ kind: "loan", id: selectedBorrowerLoan.id })}
                        disabled={actionBusyKey === `loan:${selectedBorrowerLoan.id}`}
                      >
                        {actionBusyKey === `loan:${selectedBorrowerLoan.id}` ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {selectedBorrowerLoan.status === "CANCELLED" && (
                      <button
                        className="glow-button-outline text-xs px-3 py-1.5"
                        onClick={() => handleRemoveLoan(selectedBorrowerLoan.id)}
                        disabled={actionBusyKey === `loan-remove:${selectedBorrowerLoan.id}`}
                      >
                        {actionBusyKey === `loan-remove:${selectedBorrowerLoan.id}` ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {!connected || !address ? (
              <div className="glow-card p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-muted-foreground">Connect your wallet to view lender positions</p>
              </div>
            ) : loading ? (
              <div className="glow-card p-6 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin" />
              </div>
            ) : error ? (
              <div className="glow-card p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : lenderPositions.length === 0 ? (
              <div className="glow-card p-6 text-center">
                <p className="text-muted-foreground">No lender bids for this wallet yet</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon={Shield} label="Active Positions" value={activeLenderPositions.length.toString()} />
                  <StatCard icon={DollarSign} label="Locked Capital" value={`$${lenderLockedCapital.toLocaleString()}`} />
                  <StatCard icon={TrendingUp} label="Est. Interest" value={`$${lenderEarnedInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} accent />
                </div>

                <div className="glow-card p-6">
                  <h3 className="font-heading font-semibold mb-4">Your Lender Positions</h3>
                  <div className="space-y-3">
                    {lenderPositions.map((position) => (
                      <div key={position.id} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3 text-sm gap-3">
                        <span className="font-mono text-muted-foreground">#{position.loan?.onChainId || position.loan?.id?.slice(0, 6) || "N/A"}</span>
                        <span>${(parseInt(position.amount) || 0).toLocaleString()}</span>
                        <span className="text-muted-foreground">{position.rate}%</span>
                        <span className={`text-xs ${position.status === "MATCHED" ? "text-success" : "text-muted-foreground"}`}>
                          {position.status}
                        </span>
                        <button
                          className="glow-button-outline text-xs px-2 py-1"
                          onClick={() => setOpenLenderBidId(position.id)}
                        >
                          Open
                        </button>
                        {position.status === "PENDING" && (
                          <button
                            className="glow-button-outline text-xs px-2 py-1 text-destructive"
                            onClick={() => setCancelTarget({ kind: "bid", id: position.id })}
                            disabled={actionBusyKey === `bid-cancel:${position.id}`}
                          >
                            {actionBusyKey === `bid-cancel:${position.id}` ? "..." : "Cancel"}
                          </button>
                        )}
                        {position.status === "CANCELLED" && (
                          <button
                            className="glow-button-outline text-xs px-2 py-1"
                            onClick={() => handleRemoveBid(position.id)}
                            disabled={actionBusyKey === `bid-remove:${position.id}`}
                          >
                            {actionBusyKey === `bid-remove:${position.id}` ? "..." : "Remove"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedLenderBid && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setOpenLenderBidId(null)}>
                <div className="glow-card glow-card-active p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold">Bid Details</h3>
                    <button className="glow-button-outline text-xs px-2 py-1" onClick={() => setOpenLenderBidId(null)}>Close</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Bid ID</span><span className="font-mono">{selectedLenderBid.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan</span><span className="font-mono">#{selectedLenderBid.loan?.onChainId || selectedLenderBid.loan?.id?.slice(0, 6) || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>${parseInt(selectedLenderBid.amount || "0").toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">APR</span><span>{selectedLenderBid.rate}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{selectedLenderBid.status}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span>{getLoanClientMeta(selectedLenderBid.loan?.id || "")?.riskTier || fallbackRiskTier(selectedLenderBid.loan?.creditScore)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan Duration</span><span>{formatLoanDuration(selectedLenderBid.loan?.duration)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span>{selectedLenderBid.loan?.deadline ? new Date(selectedLenderBid.loan.deadline).toLocaleString() : "N/A"}</span></div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 justify-end">
                    {selectedLenderBid.status === "PENDING" && (
                      <button
                        className="glow-button-outline text-xs px-3 py-1.5 text-destructive"
                        onClick={() => setCancelTarget({ kind: "bid", id: selectedLenderBid.id })}
                        disabled={actionBusyKey === `bid-cancel:${selectedLenderBid.id}`}
                      >
                        {actionBusyKey === `bid-cancel:${selectedLenderBid.id}` ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {selectedLenderBid.status === "CANCELLED" && (
                      <button
                        className="glow-button-outline text-xs px-3 py-1.5"
                        onClick={() => handleRemoveBid(selectedLenderBid.id)}
                        disabled={actionBusyKey === `bid-remove:${selectedLenderBid.id}`}
                      >
                        {actionBusyKey === `bid-remove:${selectedLenderBid.id}` ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {showBorrowerCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
            <div className="glow-card glow-card-active p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading text-lg font-semibold mb-2">Confirm Cancellation</h3>
              <p className="text-sm text-muted-foreground mb-5">
                You are cancelling this loan request. Are you sure?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button className="glow-button-outline text-xs px-3 py-1.5" onClick={() => setCancelTarget(null)}>
                  No
                </button>
                <button className="glow-button-outline text-xs px-3 py-1.5 text-destructive" onClick={confirmCancel}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showLenderCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
            <div className="glow-card glow-card-active p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading text-lg font-semibold mb-2">Confirm Cancellation</h3>
              <p className="text-sm text-muted-foreground mb-5">
                You are cancelling this bid. Are you sure?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button className="glow-button-outline text-xs px-3 py-1.5" onClick={() => setCancelTarget(null)}>
                  No
                </button>
                <button className="glow-button-outline text-xs px-3 py-1.5 text-destructive" onClick={confirmCancel}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-10">
          Executed on Monad • Private state powered by Unlink
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className="glow-card p-5">
    <Icon className={`w-5 h-5 mb-2 ${accent ? "text-success" : "text-primary"}`} />
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-heading text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default Dashboard;
