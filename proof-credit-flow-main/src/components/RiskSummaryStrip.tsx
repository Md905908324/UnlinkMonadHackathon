import type { RiskScores } from "@/hooks/useRiskScore";

const tierColor = (tier: RiskScores["tier"]) =>
  tier === "Low" ? "text-success" : tier === "Medium" ? "text-warning" : "text-destructive";

const tierBg = (tier: RiskScores["tier"]) =>
  tier === "Low" ? "badge-low" : tier === "Medium" ? "badge-medium" : "badge-high";

const ringColor = (tier: RiskScores["tier"]) =>
  tier === "Low" ? "stroke-success" : tier === "Medium" ? "stroke-warning" : "stroke-destructive";

function ScoreRing({ score, tier }: { score: number; tier: RiskScores["tier"] }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-secondary" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          className={`${ringColor(tier)} transition-all duration-700 ease-out`}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
        <span className={`text-2xl font-bold ${tierColor(tier)}`}>{Math.round(score)}</span>
      </div>
      <span className={`${tierBg(tier)} text-xs font-semibold px-3 py-1 rounded-full`}>{tier} Risk</span>
    </div>
  );
}

function ProgressBar({ label, value, tier }: { label: string; value: number; tier: RiskScores["tier"] }) {
  const barColor = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  scores: RiskScores;
}

const RiskSummaryStrip = ({ scores }: Props) => (
  <div className="glow-card glow-card-active p-6 animate-fade-in">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <ScoreRing score={scores.overall} tier={scores.tier} />
      </div>
      <div className="flex-1 w-full space-y-3">
        <ProgressBar label="Repayability" value={scores.repayability} tier={scores.tier} />
        <ProgressBar label="Income Stability" value={scores.incomeStability} tier={scores.tier} />
        <ProgressBar label="Credit History" value={scores.creditHistory} tier={scores.tier} />
      </div>
    </div>
  </div>
);

export default RiskSummaryStrip;
