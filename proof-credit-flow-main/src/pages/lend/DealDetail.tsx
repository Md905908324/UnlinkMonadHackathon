import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Lock, Loader2 } from "lucide-react";
import BidSuggestionBox from "@/components/BidSuggestionBox";
import { DURATION_PRESETS, computeSuggestedBidAPR } from "@/hooks/useRiskScore";

const DealDetail = () => {
  const { id } = useParams();
  const [bidAmount, setBidAmount] = useState("2000");
  const [aprOffer, setAprOffer] = useState("7.4");
  const [bidExpiry, setBidExpiry] = useState("2m");
  const [bidDuration, setBidDuration] = useState("7 days");
  const [partialFill, setPartialFill] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Simulated borrower risk score for this deal
  const borrowerRiskScore = 72; // Medium
  const borrowerTier = "Medium";

  const durationDays = DURATION_PRESETS.find((p) => p.label === bidDuration)?.days ?? 7;
  const suggestedAPR = useMemo(() => computeSuggestedBidAPR(borrowerRiskScore, durationDays), [durationDays]);

  const handleSubmit = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setConfirmed(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Deal #{id}</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Deal Details */}
          <div className="glow-card p-6 animate-fade-in">
            <h3 className="font-heading font-semibold mb-4">Deal Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Requested</span><span>$10,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral</span><span>$5,500 (55%)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>7 days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fill Progress</span><span>42%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span className="badge-medium px-2 py-0.5 rounded-full text-xs">{borrowerTier}</span></div>
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

            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mt-6">
              <div className="progress-fill h-full" style={{ width: "42%" }} />
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
                    {DURATION_PRESETS.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Bid Expiry</label>
                  <select value={bidExpiry} onChange={(e) => setBidExpiry(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                    <option value="30s">30 seconds</option>
                    <option value="2m">2 minutes</option>
                    <option value="10m">10 minutes</option>
                    <option value="clear">Until Clear</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={partialFill} onChange={(e) => setPartialFill(e.target.checked)} className="accent-primary" />
                  Allow Partial Fill
                </label>
              </div>
            </div>

            {/* AI Suggestion */}
            <BidSuggestionBox
              suggestedAPR={suggestedAPR}
              riskTier={borrowerTier}
              durationLabel={bidDuration}
              onApply={() => setAprOffer(suggestedAPR.toFixed(1))}
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
