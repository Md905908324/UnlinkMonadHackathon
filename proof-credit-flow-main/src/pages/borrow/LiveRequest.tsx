import { useState, useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";

const mockOffers = [
  { id: 1, apr: "7.2%", amount: "$2,000", status: "Accepted" },
  { id: 2, apr: "7.5%", amount: "$1,200", status: "Accepted" },
  { id: 3, apr: "7.8%", amount: "$1,000", status: "Pending" },
];

const LiveRequest = () => {
  const [filled, setFilled] = useState(4200);
  const total = 10000;
  const [autoAccept, setAutoAccept] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFilled((p) => Math.min(p + Math.floor(Math.random() * 500), total));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const pct = (filled / total) * 100;

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Live Borrow Request</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deal Summary */}
          <div className="glow-card p-6 animate-fade-in">
            <h3 className="font-heading font-semibold mb-4">Deal Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>$10,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral</span><span>$5,500</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max APR</span><span>7.5%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>14 days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk Tier</span><span className="badge-low px-2 py-0.5 rounded-full text-xs">Low</span></div>
            </div>
          </div>

          {/* Fill Progress */}
          <div className="glow-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-heading font-semibold mb-4">Fill Progress</h3>
            <div className="text-center mb-4">
              <span className="text-3xl font-heading font-bold text-primary">${filled.toLocaleString()}</span>
              <span className="text-muted-foreground text-lg"> / ${total.toLocaleString()}</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">{pct.toFixed(1)}% filled</p>

            <label className="flex items-center justify-center gap-2 mt-6 text-sm">
              <input type="checkbox" checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} className="accent-primary" />
              Auto-accept best available
            </label>
          </div>

          {/* Offers */}
          <div className="glow-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-heading font-semibold mb-4">Incoming Offers</h3>
            <div className="space-y-3">
              {mockOffers.map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{o.amount}</p>
                    <p className="text-xs text-muted-foreground">APR: {o.apr}</p>
                  </div>
                  <span className={`text-xs flex items-center gap-1 ${o.status === "Accepted" ? "text-success" : "text-warning"}`}>
                    {o.status === "Accepted" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRequest;
