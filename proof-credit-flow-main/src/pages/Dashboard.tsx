import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Shield } from "lucide-react";

const Dashboard = () => {
  const [view, setView] = useState<"borrower" | "lender">("borrower");

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setView("borrower")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "borrower" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Borrower
            </button>
            <button
              onClick={() => setView("lender")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === "lender" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Lender
            </button>
          </div>
        </div>

        {view === "borrower" ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard icon={DollarSign} label="Outstanding Balance" value="$7,800" />
              <StatCard icon={Clock} label="Next Payment" value="In 6 days" />
              <StatCard icon={Activity} label="Health Score" value="92%" accent />
            </div>

            <div className="glow-card p-6">
              <h3 className="font-heading font-semibold mb-4">Active Loan</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Original Amount</span><span>$10,000</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span>$7,800</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">APR</span><span>7.2%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Maturity</span><span>14 days</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Collateral Locked</span><span>$5,500</span></div>
              </div>
              <div className="mt-4">
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="progress-fill h-full" style={{ width: "22%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">22% repaid</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard icon={Shield} label="Active Positions" value="3" />
              <StatCard icon={DollarSign} label="Locked Capital" value="$12,400" />
              <StatCard icon={TrendingUp} label="Earned Interest" value="$342" accent />
            </div>

            <div className="glow-card p-6">
              <h3 className="font-heading font-semibold mb-4">Active Positions</h3>
              <div className="space-y-3">
                {[
                  { deal: "#1", amount: "$2,000", apr: "7.2%", status: "Active", returns: "$14.40" },
                  { deal: "#3", amount: "$4,400", apr: "6.8%", status: "Active", returns: "$29.92" },
                  { deal: "#6", amount: "$6,000", apr: "8.1%", status: "Active", returns: "$48.60" },
                ].map((p) => (
                  <div key={p.deal} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3 text-sm">
                    <span className="font-mono text-muted-foreground">{p.deal}</span>
                    <span>{p.amount}</span>
                    <span className="text-muted-foreground">{p.apr}</span>
                    <span className="text-success text-xs">+{p.returns}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-10">
          Executed on Monad • Private state powered by Unlink
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className="glow-card p-5">
    <Icon className={`w-5 h-5 mb-2 ${accent ? "text-success" : "text-primary"}`} />
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-heading text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default Dashboard;
