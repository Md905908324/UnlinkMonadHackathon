import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Eye, ArrowRight, HelpCircle, AlertCircle } from "lucide-react";
import RiskSummaryStrip from "@/components/RiskSummaryStrip";
import RecommendedTermsCard from "@/components/RecommendedTermsCard";
import { useRiskScore, computeRecommendations, DURATION_PRESETS, computeMaxLoanCap } from "@/hooks/useRiskScore";
import { useBorrowContext } from "@/contexts/BorrowContext";

type AprIndicator = "red" | "yellow" | "green";

const BorrowForm = () => {
  const navigate = useNavigate();
  const { setFormData } = useBorrowContext();

  // Fixed credit profile (read-only, verified via ZK)
  const creditScore = "700";
  const monthlyIncome = "5000";
  const monthlyDebtPayments = "500";
  const employmentTenure = "24";
  const incomeVolatility = "8";
  const pastDefaults = "0";

  const monthlyIncomeNum = Number(monthlyIncome) || 0;
  const [amount, setAmount] = useState(String(Math.round(monthlyIncomeNum * 0.5)));
  const [collateral, setCollateral] = useState("0");
  const [maxApr, setMaxApr] = useState(8);
  const [askDuration, setAskDuration] = useState("7 days");
  const [repaymentDays, setRepaymentDays] = useState(30);
  const [showProofModal, setShowProofModal] = useState(false);

  const normalizedRepaymentDays = Math.min(365, Math.max(0, Number(repaymentDays) || 0));
  const normalizedAmount = Math.max(0, Number(amount) || 0);
  const normalizedCollateral = Math.max(0, Number(collateral) || 0);

  const scores = useRiskScore({
    creditScore: Number(creditScore) || 300,
    monthlyIncome: monthlyIncomeNum,
    monthlyDebtPayments: Number(monthlyDebtPayments) || 0,
    employmentTenure: Number(employmentTenure) || 0,
    incomeVolatility: Number(incomeVolatility) || 0,
    pastDefaults: Number(pastDefaults) || 0,
    loanAmount: normalizedAmount,
    collateralAmount: normalizedCollateral,
    durationDays: Math.max(1, normalizedRepaymentDays),
  });

  const recommendations = computeRecommendations({
    overallScore: scores.overall,
    repayability: scores.repayability,
    monthlyIncome: monthlyIncomeNum,
    monthlyDebtPayments: Number(monthlyDebtPayments) || 0,
    loanAmount: normalizedAmount,
    collateralAmount: normalizedCollateral,
    durationDays: normalizedRepaymentDays,
  });
  const proofBadges = ["Income Verified", "Stability Verified", "Tenure Verified"];
  const recommendedAPR = recommendations.recommendedAPR;
  const aprDelta = maxApr - recommendedAPR;
  const aprIndicator: AprIndicator = aprDelta <= -1 ? "red" : aprDelta >= 5 ? "yellow" : "green";
  const aprIndicatorTitle = aprIndicator === "red"
    ? `Might be too low (${Math.abs(aprDelta).toFixed(1)}% below AI recommended APR ${recommendedAPR.toFixed(1)}%)`
    : aprIndicator === "yellow"
    ? `Might be too high (${aprDelta.toFixed(1)}% above AI recommended APR ${recommendedAPR.toFixed(1)}%)`
    : `Within AI-recommended range (target ${recommendedAPR.toFixed(1)}%)`;

  const maxLoanCap = computeMaxLoanCap(monthlyIncomeNum, normalizedRepaymentDays);
  const exceedsBorrowCap = normalizedAmount > maxLoanCap;
  const exceedTitle = `Exceeds repayability cap: max suggested is $${Math.round(maxLoanCap).toLocaleString()} for ${normalizedRepaymentDays} day${normalizedRepaymentDays !== 1 ? "s" : ""}`;

  const handleAmountChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setAmount("0");
      return;
    }
    setAmount(String(Math.max(0, Math.round(parsed))));
  };

  const handleCollateralChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setCollateral("0");
      return;
    }
    setCollateral(String(Math.max(0, Math.round(parsed))));
  };

  const handleRepaymentDaysChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setRepaymentDays(0);
      return;
    }
    const sanitized = Math.max(0, Math.round(parsed));
    setRepaymentDays(Math.min(365, sanitized));
  };

  const handleNavigateToConfirm = () => {
    setFormData({
      amount,
      collateral,
      maxApr,
      askDuration,
      repaymentDurationDays: normalizedRepaymentDays,
      riskTier: scores.tier,
    });
    navigate("/borrow/confirm");
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Risk Summary Strip */}
        <RiskSummaryStrip scores={scores} />

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
            <FormField label="Amount Requested (USDC)" value={amount} onChange={handleAmountChange} type="number" />
            <FormField label="Collateral Deposit (USDC)" value={collateral} onChange={handleCollateralChange} type="number" />
          </div>

          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <span>Repayability cap for current duration:</span>
            <span className="font-semibold text-foreground">${Math.round(maxLoanCap).toLocaleString()}</span>
            {exceedsBorrowCap && (
              <span className="inline-flex items-center text-destructive" title={exceedTitle}>
                <AlertCircle className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Max APR Willing to Pay: <span className="text-primary font-semibold">{maxApr}%</span>
              {aprIndicator === "red" && (
                <span className="ml-2 inline-flex items-center text-destructive" title={aprIndicatorTitle}>
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
              {aprIndicator === "yellow" && (
                <span className="ml-2 inline-flex items-center text-warning" title={aprIndicatorTitle}>
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
              {aprIndicator === "green" && (
                <span className="ml-2 inline-flex items-center text-success" title={aprIndicatorTitle}>
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
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
              <label className="text-sm text-muted-foreground mb-1 block">Time Until Repayment</label>
              <input
                type="number"
                min={0}
                max={365}
                step={1}
                value={repaymentDays}
                onChange={(e) => handleRepaymentDaysChange(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>
        </div>



        {/* Recommended Terms */}
        <RecommendedTermsCard
          aprRange={recommendations.aprRange}
          suggestedMaxLoan={recommendations.suggestedMaxLoan}
          suggestedRepaymentDays={recommendations.suggestedRepaymentDays}
          riskTier={scores.tier}
          recommendedAPR={recommendations.recommendedAPR}
          onApplyAPR={(apr) => setMaxApr(Number(apr.toFixed(1)))}
          onApplyAmount={(amt) => setAmount(String(Math.max(0, Math.round(amt))))}
          onApplyDuration={(days) => setRepaymentDays(Math.min(365, Math.max(0, Math.round(days))))}
        />

        <button onClick={handleNavigateToConfirm} className="glow-button w-full flex items-center justify-center gap-2">
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
