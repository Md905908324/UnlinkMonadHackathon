import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

const WorkflowSelect = () => {
  const navigate = useNavigate();

  const workflows = [
    {
      title: "BORROW",
      desc: "Raise capital using private credit verification.",
      icon: TrendingDown,
      path: "/borrow/verify",
      gradient: "from-blue-600/20 to-blue-800/10",
    },
    {
      title: "LEND",
      desc: "Deploy capital into verified private deals.",
      icon: TrendingUp,
      path: "/lend/market",
      gradient: "from-emerald-600/20 to-emerald-800/10",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-heading text-4xl font-bold mb-3">Choose Your Role</h1>
          <p className="text-muted-foreground">Select how you want to participate in the marketplace.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {workflows.map((w, i) => (
            <button
              key={w.title}
              onClick={() => navigate(w.path)}
              className={`glow-card p-8 text-left group opacity-0 animate-fade-in bg-gradient-to-br ${w.gradient}`}
              style={{ animationDelay: `${i * 150 + 200}ms` }}
            >
              <w.icon className="w-10 h-10 text-primary mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-2">{w.title}</h2>
              <p className="text-muted-foreground mb-6">{w.desc}</p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowSelect;
