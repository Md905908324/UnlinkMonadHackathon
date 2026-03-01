import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Brain, BarChart3 } from "lucide-react";

const steps = [
  { icon: Lock, label: "Encrypting documents with Unlink" },
  { icon: Shield, label: "Generating zero-knowledge proofs" },
  { icon: Brain, label: "Computing risk tier" },
  { icon: BarChart3, label: "Recommending optimal loan terms" },
];

const AIMatching = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => navigate("/borrow/form"), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Spinner */}
        <div className="w-24 h-24 mx-auto mb-10 relative">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow" />
          <div className="absolute inset-3 rounded-full border border-primary/10 pulse-glow" />
          <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
        </div>

        <h2 className="font-heading text-2xl font-bold mb-2">AI is matching your details…</h2>
        <p className="text-muted-foreground text-sm mb-10">This will only take a moment.</p>

        <div className="space-y-3 text-left">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                i <= activeStep
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <step.icon className={`w-5 h-5 shrink-0 ${i <= activeStep ? "text-primary" : ""}`} />
              <span className="text-sm">{step.label}</span>
              {i < activeStep && <span className="ml-auto text-success text-xs">✓</span>}
              {i === activeStep && (
                <span className="ml-auto w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIMatching;
