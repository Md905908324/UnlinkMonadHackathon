import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Bot, ArrowRight } from "lucide-react";

const mockDeals = [
  { id: "1", amount: 10000, collateralRatio: 55, duration: 14, risk: "Low", filled: 42, timeLeft: "12h 30m" },
  { id: "2", amount: 25000, collateralRatio: 40, duration: 30, risk: "Medium", filled: 18, timeLeft: "2d 4h" },
  { id: "3", amount: 5000, collateralRatio: 70, duration: 7, risk: "Low", filled: 80, timeLeft: "3h 15m" },
  { id: "4", amount: 15000, collateralRatio: 35, duration: 14, risk: "High", filled: 10, timeLeft: "1d 8h" },
  { id: "5", amount: 8000, collateralRatio: 60, duration: 30, risk: "Medium", filled: 55, timeLeft: "5d" },
  { id: "6", amount: 50000, collateralRatio: 50, duration: 14, risk: "Low", filled: 30, timeLeft: "18h" },
];

const riskClass = (r: string) => r === "Low" ? "badge-low" : r === "Medium" ? "badge-medium" : "badge-high";

const MarketDeals = () => {
  const navigate = useNavigate();
  const [aprRange, setAprRange] = useState([5, 12]);
  const [maxDuration, setMaxDuration] = useState(30);
  const [riskPref, setRiskPref] = useState("All");
  const [autoBid, setAutoBid] = useState(false);

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Market Deals</h1>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Deals Grid */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockDeals.map((deal, i) => (
              <button
                key={deal.id}
                onClick={() => navigate(`/lend/deal/${deal.id}`)}
                className="glow-card p-5 text-left group opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-lg font-bold">${deal.amount.toLocaleString()}</span>
                  <span className={`${riskClass(deal.risk)} text-xs px-2 py-0.5 rounded-full`}>{deal.risk}</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Collateral Ratio</span><span className="text-foreground">{deal.collateralRatio}%</span></div>
                  <div className="flex justify-between"><span>Duration</span><span className="text-foreground">{deal.duration}d</span></div>
                  <div className="flex justify-between"><span>Time Left</span><span className="text-foreground">{deal.timeLeft}</span></div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="progress-fill h-full" style={{ width: `${deal.filled}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{deal.filled}% filled</p>
                </div>
                <div className="flex items-center gap-1 text-primary text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Deal <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          {/* AI Agent Panel */}
          <div className="glow-card p-6 h-fit lg:sticky lg:top-24 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-6">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-semibold">AI Lending Agent</h3>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <label className="text-muted-foreground mb-1 block">Target APR Range</label>
                <div className="flex gap-2">
                  <input type="number" value={aprRange[0]} onChange={(e) => setAprRange([+e.target.value, aprRange[1]])} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground" />
                  <span className="self-center text-muted-foreground">–</span>
                  <input type="number" value={aprRange[1]} onChange={(e) => setAprRange([aprRange[0], +e.target.value])} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground" />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block">Max Duration</label>
                <select value={maxDuration} onChange={(e) => setMaxDuration(+e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground">
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block">Risk Preference</label>
                <select value={riskPref} onChange={(e) => setRiskPref(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground">
                  <option>All</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <button className="glow-button-outline w-full flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Suggest Bid
              </button>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={autoBid} onChange={(e) => setAutoBid(e.target.checked)} className="accent-primary" />
                Auto-Bid Mode
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDeals;
