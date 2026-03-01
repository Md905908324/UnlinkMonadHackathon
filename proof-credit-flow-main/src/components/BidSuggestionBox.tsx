import { Sparkles } from "lucide-react";

interface Props {
  suggestedAPR: number;
  riskTier: string;
  durationLabel: string;
  onApply: () => void;
}

const BidSuggestionBox = ({ suggestedAPR, riskTier, durationLabel, onApply }: Props) => (
  <div className="glow-card glow-card-active p-5">
    <div className="flex items-center gap-2 mb-2">
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="font-heading text-sm font-semibold">AI Suggested Bid</span>
    </div>
    <p className="text-sm mb-1">
      <span className="text-muted-foreground">Suggested APR:</span>{" "}
      <span className="font-semibold">{suggestedAPR.toFixed(1)}%</span>
    </p>
    <p className="text-xs text-muted-foreground mb-3">
      {riskTier} Risk + {durationLabel} Duration
    </p>
    <button onClick={onApply} className="glow-button-outline text-xs px-3 py-1.5">
      Apply Suggested Bid
    </button>
  </div>
);

export default BidSuggestionBox;
