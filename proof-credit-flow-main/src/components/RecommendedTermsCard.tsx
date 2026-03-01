import { Sparkles } from "lucide-react";

interface Props {
  aprRange: [number, number];
  suggestedMaxLoan: number;
  suggestedDuration: string;
  riskTier: "Low" | "Medium" | "High";
  onApplyAPR: (apr: number) => void;
  onApplyAmount: (amount: number) => void;
  onApplyDuration: (duration: string) => void;
  recommendedAPR: number;
}

const RecommendedTermsCard = ({
  aprRange, suggestedMaxLoan, suggestedDuration, riskTier,
  onApplyAPR, onApplyAmount, onApplyDuration, recommendedAPR,
}: Props) => (
  <div className="glow-card glow-card-active p-6">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-5 h-5 text-primary" />
      <h3 className="font-heading font-semibold">AI Recommended Terms</h3>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
      <div>
        <p className="text-muted-foreground text-xs">APR Range</p>
        <p className="font-semibold">{aprRange[0].toFixed(1)}% – {aprRange[1].toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Max Loan</p>
        <p className="font-semibold">${Math.round(suggestedMaxLoan).toLocaleString()}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Duration</p>
        <p className="font-semibold">{suggestedDuration}</p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-4">
      Based on your {riskTier.toLowerCase()} risk profile, verified income stability, and credit history.
    </p>
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onApplyAPR(recommendedAPR)} className="glow-button-outline text-xs px-3 py-1.5">
        Apply Suggested APR
      </button>
      <button onClick={() => onApplyAmount(suggestedMaxLoan)} className="glow-button-outline text-xs px-3 py-1.5">
        Apply Suggested Amount
      </button>
      <button onClick={() => onApplyDuration(suggestedDuration)} className="glow-button-outline text-xs px-3 py-1.5">
        Apply Suggested Duration
      </button>
    </div>
  </div>
);

export default RecommendedTermsCard;
