import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Bot, ArrowRight } from "lucide-react";
import { getLoans } from "@/services/api";
import { getLoanClientMeta } from "@/utils/loanMetaStore";

interface Deal {
  id: string;
  amount: number;
  loanDurationLabel: string;
  risk: string;
  timeLeft: string;
  bidCount: number;
}

const formatLoanDuration = (hours?: number): string => {
  const safeHours = Math.max(0, Number(hours) || 0);
  if (safeHours < 24) return `${safeHours}h`;
  const days = Math.round(safeHours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

const riskClass = (r: string) => r === "Low" ? "badge-low" : r === "Medium" ? "badge-medium" : "badge-high";

const calculateRisk = (creditScore?: number): string => {
  if (!creditScore) return "Unknown";
  if (creditScore >= 700) return "Low";
  if (creditScore >= 600) return "Medium";
  return "High";
};

const calculateTimeLeft = (deadline: string): string => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.ceil(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const MarketDeals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aprRange, setAprRange] = useState([5, 12]);
  const [maxDuration, setMaxDuration] = useState(30);
  const [riskPref, setRiskPref] = useState("All");
  const [autoBid, setAutoBid] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const loans = await getLoans();
        
        const formattedDeals: Deal[] = loans.map((loan: any) => ({
          id: loan.id,
          amount: parseInt(loan.amount) || 0,
          loanDurationLabel: formatLoanDuration(loan.duration),
          risk: getLoanClientMeta(loan.id)?.riskTier || calculateRisk(loan.creditScore),
          bidCount: loan._count?.bids || 0,
          timeLeft: calculateTimeLeft(loan.deadline),
        }));

        setDeals(formattedDeals);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Market Deals</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Deals Grid */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Loading deals...
              </div>
            ) : deals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No deals available
              </div>
            ) : (
              deals.map((deal, i) => (
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
                    <div className="flex justify-between"><span>Loan Duration</span><span className="text-foreground">{deal.loanDurationLabel}</span></div>
                    <div className="flex justify-between"><span>Time Left</span><span className="text-foreground">{deal.timeLeft}</span></div>
                    <div className="flex justify-between"><span>Bids Received</span><span className="text-foreground">{deal.bidCount}</span></div>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    View Deal <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))
            )}
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
