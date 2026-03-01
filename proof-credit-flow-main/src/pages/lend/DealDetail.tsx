import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Lock, Loader2, AlertCircle } from "lucide-react";
import { getLoan, getBids, submitBid } from "@/services/api";
import { useWallet } from "@/contexts/WalletContext";
import BidSuggestionBox from "@/components/BidSuggestionBox";
import { DURATION_PRESETS, computeSuggestedBidAPR } from "@/hooks/useRiskScore";
import { getLoanClientMeta } from "@/utils/loanMetaStore";

interface Loan {
  id: string;
  borrowerUnlink: string;
  amount: string;
  collateral: string;
  maxRate: number;
  deadline: string;
  duration?: number;
  creditScore?: number;
  status?: string;
  _count?: { bids: number };
}

function durationLabelFromDays(days: number): string {
  const safe = Math.max(0, Number(days) || 0);
  if (safe < 1) {
    const hours = Math.round(safe * 24);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  const wholeDays = Math.round(safe);
  return `${wholeDays} day${wholeDays !== 1 ? "s" : ""}`;
}

function durationLabelFromHours(hours?: number): string {
  const safeHours = Math.max(0, Number(hours) || 0);
  if (safeHours < 24) return `${safeHours}h`;
  const days = Math.round(safeHours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

const DealDetail = () => {
  const { id } = useParams();
  const { address } = useWallet();
  const [bidAmount, setBidAmount] = useState("0");
  const [aprOffer, setAprOffer] = useState("6.0");
  const [bidExpiry, setBidExpiry] = useState("1 day");
  const [bidDuration, setBidDuration] = useState("7 days");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Loan data
  const [loan, setLoan] = useState<Loan | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load loan and bids on mount
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const loanData = await getLoan(id);
        setLoan(loanData);
        
        const bidData = await getBids(id);
        setBids(bidData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deal");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const maxDealDays = Math.max(1, ((loan?.duration ?? 24) / 24));
  const allowedDurationOptions = DURATION_PRESETS
    .filter((preset) => preset.days <= maxDealDays)
    .filter((preset, index, list) => list.findIndex((x) => x.days === preset.days) === index)
    .map((preset) => ({ ...preset, label: durationLabelFromDays(preset.days) }));
  const durationOptions = allowedDurationOptions.length > 0 ? allowedDurationOptions : [{ label: "1 day", days: 1 }];

  const durationDays = DURATION_PRESETS.find((p) => p.label === bidDuration)?.days ?? 7;

  // Derive risk tier from borrower's credit score
  const getRiskTier = (creditScore?: number) => {
    if (!creditScore) return "Unknown";
    if (creditScore >= 700) return "Low";
    if (creditScore >= 600) return "Medium";
    return "High";
  };

  const getRiskBadgeClass = (creditScore?: number) => {
    if (!creditScore) return "";
    if (creditScore >= 700) return "badge-low";
    if (creditScore >= 600) return "badge-medium";
    return "badge-high";
  };

  const borrowerRiskScore = loan?.creditScore || 600;
  const carriedRiskTier = loan?.id ? getLoanClientMeta(loan.id)?.riskTier : null;
  const borrowerTier = carriedRiskTier || getRiskTier(borrowerRiskScore);
  const borrowerTierClass = borrowerTier === "Low" ? "badge-low" : borrowerTier === "High" ? "badge-high" : "badge-medium";
  const suggestedAPR = computeSuggestedBidAPR(borrowerRiskScore, durationDays);
  const suggestedLowAPR = Math.max(5, Number((suggestedAPR - 0.8).toFixed(1)));
  const suggestedHighAPR = Math.min(30, Number((suggestedAPR + 0.8).toFixed(1)));

  useEffect(() => {
    if (!loan) return;
    const filtered = DURATION_PRESETS
      .filter((preset) => preset.days <= Math.max(1, (loan.duration ?? 24) / 24))
      .filter((preset, index, list) => list.findIndex((x) => x.days === preset.days) === index)
      .map((preset) => ({ ...preset, label: durationLabelFromDays(preset.days) }));
    const options = filtered.length > 0 ? filtered : [{ label: "1 day", days: 1 }];
    const maxOption = options[options.length - 1];
    setBidDuration(maxOption.label);
    setBidExpiry(maxOption.label);
    setBidAmount(String(loan.amount));
  }, [loan?.id]);

  useEffect(() => {
    if (!loan) return;
    const formulaApr = Math.max(6, Number(computeSuggestedBidAPR(borrowerRiskScore, durationDays).toFixed(1)));
    setAprOffer(formulaApr.toFixed(1));
  }, [loan?.id, borrowerRiskScore, durationDays]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-12 flex items-center justify-center">
        <p className="text-muted-foreground">Loading deal...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-12 flex items-center justify-center">
        <p className="text-muted-foreground">Deal not found</p>
      </div>
    );
  }

  const loanDurationHours = Math.max(0, Number(loan.duration) || 0);
  const loanDurationLabel = durationLabelFromHours(loanDurationHours);

  const handleSubmit = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }
    
    try {
      setConfirming(true);
      setError(null);
      
      const bidRequest = {
        lenderUnlink: address,
        amount: bidAmount,
        rate: parseFloat(aprOffer),
      };
      
      await submitBid(id!, bidRequest);
      
      setConfirming(false);
      setConfirmed(true);
    } catch (err) {
      setConfirming(false);
      setError(err instanceof Error ? err.message : "Failed to submit bid");
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Deal #{id}</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-500 font-medium">Error</p>
              <p className="text-xs text-red-500/80">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Deal Details */}
          <div className="glow-card p-6 animate-fade-in">
            <h3 className="font-heading font-semibold mb-4">Deal Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Requested (USDC)</span><span>${Number(loan.amount).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral Deposit (USDC)</span><span>${parseInt(loan.collateral || "0").toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max APR Willing to Pay</span><span>{loan.maxRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loan Duration</span><span>{loanDurationLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time Left</span><span>{Math.max(0, Math.ceil((new Date(loan.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)))}h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span className={`${borrowerTierClass} px-2 py-0.5 rounded-full text-xs`}>{borrowerTier}</span></div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Proof Badges</p>
              <div className="flex flex-wrap gap-2">
                {["Income Verified", "Stability Verified", "Tenure Verified"].map((b) => (
                  <span key={b} className="flex items-center gap-1 text-xs bg-secondary px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3 text-success" />{b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bid Ticket */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="glow-card p-6">
              <h3 className="font-heading font-semibold mb-4">Place Your Bid</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Amount to Lend (USDC)</label>
                  <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">APR Offer (%)</label>
                  <input type="number" step="0.1" value={aprOffer} onChange={(e) => setAprOffer(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Bid Duration</label>
                  <select value={bidDuration} onChange={(e) => setBidDuration(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                    {durationOptions.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Bid Expiry</label>
                  <select value={bidExpiry} onChange={(e) => setBidExpiry(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                    {durationOptions.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            <BidSuggestionBox
              suggestedAPR={suggestedAPR}
              suggestedLowAPR={suggestedLowAPR}
              suggestedHighAPR={suggestedHighAPR}
              riskTier={borrowerTier}
              durationLabel={bidDuration}
              onApplyLow={() => setAprOffer(suggestedLowAPR.toFixed(1))}
              onApplyHigh={() => setAprOffer(suggestedHighAPR.toFixed(1))}
            />

            {confirmed ? (
              <div className="glow-card glow-card-active p-6 text-center">
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="font-heading font-semibold mb-1">Bid Live (Sealed)</p>
                <p className="text-sm text-muted-foreground">Funds on hold. Awaiting clearing.</p>
              </div>
            ) : (
              <button onClick={handleSubmit} disabled={confirming} className="glow-button w-full flex items-center justify-center gap-2">
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {confirming ? "Signing with Monad…" : "Submit Sealed Bid"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
