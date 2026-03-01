import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Eye, ArrowRight, HelpCircle } from "lucide-react";
import RiskSummaryStrip from "@/components/RiskSummaryStrip";
import RecommendedTermsCard from "@/components/RecommendedTermsCard";
import { useRiskScore, computeRecommendations, DURATION_PRESETS } from "@/hooks/useRiskScore";

const BorrowForm = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("10000");
  const [collateral, setCollateral] = useState("5000");
  const [maxApr, setMaxApr] = useState(8);
  const [askDuration, setAskDuration] = useState("7 days");
  const [repaymentDuration, setRepaymentDuration] = useState("7 days");
  const [requestMode, setRequestMode] = useState<"until_filled" | "deadline">("until_filled");
  const [allowPartial, setAllowPartial] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);

  // Fixed credit profile (read-only, verified via ZK)
  const creditScore = "700";
  const monthlyIncome = "5000";
  const monthlyDebtPayments = "500";
  const employmentTenure = "24";
  const incomeVolatility = "8";
  const pastDefaults = "0";

  const repaymentDays = DURATION_PRESETS.find((p) => p.label === repaymentDuration)?.days ?? 7;

  const scores = useRiskScore({
    creditScore: Number(creditScore) || 300,
    monthlyIncome: Number(monthlyIncome) || 0,
    monthlyDebtPayments: Number(monthlyDebtPayments) || 0,
    employmentTenure: Number(employmentTenure) || 0,
    incomeVolatility: Number(incomeVolatility) || 0,
    pastDefaults: Number(pastDefaults) || 0,
    loanAmount: Number(amount) || 0,
    durationDays: repaymentDays,
  });

  const recommendations = computeRecommendations(scores.overall, Number(monthlyIncome) || 0, scores.repayability);
  const proofBadges = ["Income Verified", "Stability Verified", "Tenure Verified"];

  const isUntilClear = repaymentDuration === "Until Clear";

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Risk Summary Strip */}
        <RiskSummaryStrip scores={scores} />
        {isUntilClear && (
          <p className="text-xs text-muted-foreground text-center -mt-3">* Assumed 7d for risk estimate</p>
        )}

        {/* Risk Banner */}
        <div className="glow-card glow-card-active p-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Risk Tier</p>
              <span className={`${scores.tier === "Low" ? "badge-low" : scores.tier === "Medium" ? "badge-medium" : "badge-high"} text-sm font-semibold px-3 py-1 rounded-full`}>
                {scores.tier}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {proofBadges.map((b) => (
                <span key={b} className="flex items-center gap-1 text-xs bg-secondary px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3 text-success" />{b}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setShowProofModal(true)} className="mt-4 text-sm text-primary flex items-center gap-1 hover:underline">
            <Eye className="w-4 h-4" /> View what lenders see
          </button>
        </div>

        {/* Credit Profile (read-only, verified via ZK) */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-heading text-2xl font-bold">Your Credit Profile</h2>
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Based on your verified documents
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Credit Score", value: creditScore },
              { label: "Monthly Income (Net)", value: `$${monthlyIncome}` },
              { label: "Monthly Debt Payments", value: `$${monthlyDebtPayments}` },
              { label: "Employment Tenure", value: `${employmentTenure} months` },
              { label: "Income Volatility", value: `${incomeVolatility}%` },
              { label: "Past Defaults", value: pastDefaults },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Details */}
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="font-heading text-2xl font-bold mb-4">Loan Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Amount Requested (USDC)" value={amount} onChange={setAmount} type="number" />
            <FormField label="Collateral Deposit (USDC)" value={collateral} onChange={setCollateral} type="number" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Max APR Willing to Pay: <span className="text-primary font-semibold">{maxApr}%</span>
            </label>
            <input type="range" min={1} max={30} step={0.1} value={maxApr} onChange={(e) => setMaxApr(parseFloat(e.target.value))} className="w-full accent-primary" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ask Duration (listing active for)</label>
              <select value={askDuration} onChange={(e) => setAskDuration(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition">
                {DURATION_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Length Until Repayment</label>
              <select value={repaymentDuration} onChange={(e) => setRepaymentDuration(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition">
                {DURATION_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Request Mode */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Request Mode</p>
          <div className="space-y-3">
            <label className={`glow-card p-4 flex items-start gap-3 cursor-pointer ${requestMode === "until_filled" ? "glow-card-active" : ""}`}>
              <input type="radio" name="mode" checked={requestMode === "until_filled"} onChange={() => setRequestMode("until_filled")} className="mt-1 accent-primary" />
              <div>
                <p className="font-medium text-sm">Until Fully Filled</p>
                <p className="text-xs text-muted-foreground">Keep listing until full amount is matched.</p>
              </div>
            </label>
            <label className={`glow-card p-4 flex items-start gap-3 cursor-pointer ${requestMode === "deadline" ? "glow-card-active" : ""}`}>
              <input type="radio" name="mode" checked={requestMode === "deadline"} onChange={() => setRequestMode("deadline")} className="mt-1 accent-primary" />
              <div>
                <p className="font-medium text-sm">By Deadline</p>
                <p className="text-xs text-muted-foreground">Set a deadline. Cancel if not fully filled.</p>
              </div>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowPartial} onChange={(e) => setAllowPartial(e.target.checked)} className="accent-primary" />
          Allow Partial Fills
        </label>

        {/* Recommended Terms */}
        <RecommendedTermsCard
          aprRange={recommendations.aprRange}
          suggestedMaxLoan={recommendations.suggestedMaxLoan}
          suggestedDuration={recommendations.suggestedDuration}
          riskTier={scores.tier}
          recommendedAPR={recommendations.recommendedAPR}
          onApplyAPR={(apr) => setMaxApr(Number(apr.toFixed(1)))}
          onApplyAmount={(amt) => setAmount(String(Math.round(amt)))}
          onApplyDuration={(dur) => {
            const match = DURATION_PRESETS.find((p) => p.label === dur);
            if (match) setRepaymentDuration(match.label);
          }}
        />

        <button onClick={() => navigate("/borrow/confirm")} className="glow-button w-full flex items-center justify-center gap-2">
          Preview & List Request
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Proof Modal */}
        {showProofModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowProofModal(false)}>
            <div className="glow-card glow-card-active p-8 max-w-md w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading text-xl font-bold mb-4">What Lenders See</h3>
              <p className="text-sm text-muted-foreground mb-4">Lenders only see verified proof badges and your risk tier — never your raw documents.</p>
              <div className="space-y-2 mb-6">
                <span className={`${scores.tier === "Low" ? "badge-low" : scores.tier === "Medium" ? "badge-medium" : "badge-high"} text-sm font-semibold px-3 py-1 rounded-full inline-block`}>
                  Risk: {scores.tier}
                </span>
                {proofBadges.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success" />{b}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowProofModal(false)} className="glow-button-outline w-full text-sm">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function FormField({ label, value, onChange, type, readOnly }: { label: string; value: string; onChange: (v: string) => void; type: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} className={`w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition ${readOnly ? "opacity-70 cursor-not-allowed" : ""}`} />
    </div>
  );
}

export default BorrowForm;
