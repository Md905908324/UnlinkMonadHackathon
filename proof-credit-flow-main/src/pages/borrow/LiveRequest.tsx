import { useState, useEffect } from "react";
import { Lock, Timer, ShieldCheck } from "lucide-react";
import { useBorrowContext } from "@/contexts/BorrowContext";
import { getLoan, getBids } from "@/services/api";

interface LoanDetail {
  id: string;
  borrowerUnlink: string;
  amount: string;
  collateral: string;
  maxRate: number;
  deadline: string;
  creditScore?: number;
  createdAt: string;
  duration?: number;
  status?: string;
  _count?: { bids: number };
}

const LiveRequest = () => {
  const { activeLoanId, activeLoanMeta } = useBorrowContext();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [bidCount, setBidCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeLoanId) return;

    const fetchLoan = async () => {
      try {
        const loanData = await getLoan(activeLoanId);
        setLoan(loanData);
        setLoading(false);

        // Poll for bid count
        const bidsData = await getBids(activeLoanId);
        setBidCount(bidsData?.length || 0);
      } catch (err) {
        console.error("Failed to fetch loan", err);
        setLoading(false);
      }
    };

    fetchLoan();
  }, [activeLoanId]);

  useEffect(() => {
    if (!loan) return;

    const deadline = new Date(loan.deadline);

    const updateCountdown = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Deadline reached - executing...");
        return;
      }

      const hours = Math.ceil(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    // Poll for new bids every 3 seconds
    const bidTimer = setInterval(async () => {
      try {
        const bidsData = await getBids(activeLoanId);
        setBidCount(bidsData?.length || 0);
      } catch (err) {
        console.error("Failed to fetch bids", err);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(bidTimer);
    };
  }, [loan, activeLoanId]);

  if (!activeLoanId) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-12 flex items-center justify-center">
        <p className="text-muted-foreground">No active loan – please create one first.</p>
      </div>
    );
  }

  if (loading || !loan) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-12 flex items-center justify-center">
        <p className="text-muted-foreground">Loading loan details…</p>
      </div>
    );
  }

  // Compute risk tier from credit score
  const getRiskTier = (creditScore: number) => {
    if (creditScore >= 700) return "Low";
    if (creditScore >= 600) return "Medium";
    return "High";
  };

  const getRiskBadgeClass = (creditScore: number) => {
    if (creditScore >= 700) return "badge-low";
    if (creditScore >= 600) return "badge-medium";
    return "badge-high";
  };

  const fallbackRiskTier = getRiskTier(loan.creditScore ?? 600);
  const fallbackRiskBadge = getRiskBadgeClass(loan.creditScore ?? 600);
  const riskTier = activeLoanMeta?.riskTier ?? fallbackRiskTier;
  const riskBadgeClass = activeLoanMeta?.riskTier === "Low" ? "badge-low" : activeLoanMeta?.riskTier === "Medium" ? "badge-medium" : activeLoanMeta?.riskTier === "High" ? "badge-high" : fallbackRiskBadge;
  const askDurationLabel = activeLoanMeta?.askDuration ?? `${Math.round((loan.duration ?? 0))} hours`;
  const repaymentDays = activeLoanMeta?.repaymentDurationDays ?? 30;
  const repaymentDue = new Date(new Date(loan.createdAt).getTime() + repaymentDays * 24 * 60 * 60 * 1000);
  const repaymentDiffMs = repaymentDue.getTime() - Date.now();
  const repaymentDaysLeft = Math.max(0, Math.ceil(repaymentDiffMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Sealed Auction Posted</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deal Summary */}
          <div className="glow-card p-6 animate-fade-in">
            <h3 className="font-heading font-semibold mb-4">Loan Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>${parseInt(loan.amount).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral</span><span>${parseInt(loan.collateral || "0").toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max APR</span><span>{loan.maxRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ask Duration</span><span>{askDurationLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time Until Repayment</span><span>{repaymentDaysLeft} day{repaymentDaysLeft !== 1 ? "s" : ""}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span className={`${riskBadgeClass} px-2 py-0.5 rounded-full text-xs`}>{riskTier}</span></div>
            </div>
          </div>

          {/* Auction Countdown */}
          <div className="glow-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              Auction Deadline
            </h3>
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm mb-2">Time until execution:</p>
              <span className="text-4xl font-heading font-bold text-primary font-mono">{timeLeft}</span>
            </div>
            <div className="bg-secondary/50 rounded-lg px-4 py-3 text-xs text-muted-foreground border border-border">
              <p className="font-medium text-foreground mb-1">Sealed Auction</p>
              <p>All bids are encrypted and hidden until the deadline. Execution happens automatically at the deadline using Unlink's privacy layer.</p>
            </div>
          </div>

          {/* Sealed Bids Status */}
          <div className="glow-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Private Bids
            </h3>
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm mb-2">Bids received:</p>
              <span className="text-4xl font-heading font-bold text-primary">{bidCount}</span>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p>Bid amounts hidden until deadline</p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p>Interest rates encrypted via Unlink</p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p>Agent will match best rates at deadline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="glow-card p-6 mt-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="font-heading font-semibold mb-3">How a Sealed Auction Works</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Your loan request is posted with a maximum APR you're willing to pay.</li>
            <li>Lenders submit bids privately—amounts and rates are encrypted via Unlink.</li>
            <li>When the deadline arrives, the agent automatically matches the lowest-rate bids at the best rates available.</li>
            <li>You pay the final matched APR, which is typically lower than your maximum.</li>
            <li>No real-time bid visible = no opportunity for bidders to game the auction.</li>
          </ol>
        </div>
      </div>
    </div>
  );

};

export default LiveRequest;
