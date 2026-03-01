import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Shield, Loader2, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface LoanDetail {
  id: string;
  amount: string;
  collateral: string;
  maxRate: number;
  deadline: string;
  duration: number;
  status: string;
  bids: any[];
  _count?: { bids: number };
}

const Dashboard = () => {
  const [view, setView] = useState<"borrower" | "lender">("borrower");
  const { address } = useWallet();
  const [borrowerLoans, setBorrowerLoans] = useState<LoanDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || view !== "borrower") return;

    const fetchBorrowerLoans = async () => {
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

    fetchBorrowerLoans();
  }, [address, view]);

  // Calculate totals for borrower view
  const totalOutstanding = borrowerLoans.reduce((sum, loan) => sum + (parseInt(loan.amount) || 0), 0);
  const totalCollateral = borrowerLoans.reduce((sum, loan) => sum + (parseInt(loan.collateral) || 0), 0);
  const avgRate = borrowerLoans.length > 0 ? (borrowerLoans.reduce((sum, loan) => sum + (loan.maxRate || 0), 0) / borrowerLoans.length).toFixed(1) : "0";

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
            {!address ? (
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
                  <StatCard icon={Clock} label="Active Requests" value={borrowerLoans.length.toString()} />
                  <StatCard icon={Activity} label="Avg Max Rate" value={`${avgRate}%`} accent />
                </div>

                <div className="glow-card p-6">
                  <h3 className="font-heading font-semibold mb-4">Your Loan Requests</h3>
                  <div className="space-y-3">
                    {borrowerLoans.map((loan) => {
                      const bidCount = loan._count?.bids || loan.bids?.length || 0;
                      const timeLeft = new Date(loan.deadline).getTime() - Date.now();
                      const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard icon={Shield} label="Active Positions" value="3" />
              <StatCard icon={DollarSign} label="Locked Capital" value="$12,400" />
              <StatCard icon={TrendingUp} label="Earned Interest" value="$342" accent />
            </div>

            <div className="glow-card p-6">
              <h3 className="font-heading font-semibold mb-4">Active Positions</h3>
              <div className="space-y-3">
                {[
                  { deal: "#1", amount: "$2,000", apr: "7.2%", status: "Active", returns: "$14.40" },
                  { deal: "#3", amount: "$4,400", apr: "6.8%", status: "Active", returns: "$29.92" },
                  { deal: "#6", amount: "$6,000", apr: "8.1%", status: "Active", returns: "$48.60" },
                ].map((p) => (
                  <div key={p.deal} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3 text-sm">
                    <span className="font-mono text-muted-foreground">{p.deal}</span>
                    <span>{p.amount}</span>
                    <span className="text-muted-foreground">{p.apr}</span>
                    <span className="text-success text-xs">+{p.returns}</span>
                  </div>
                ))}
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
