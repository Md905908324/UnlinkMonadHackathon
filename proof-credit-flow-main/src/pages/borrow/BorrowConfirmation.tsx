import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Send, CheckCircle, Loader2 } from "lucide-react";

const BorrowConfirmation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=review, 1=locking, 2=listing, 3=done

  const summary = {
    amount: "$10,000 USDC",
    collateral: "$5,500 USDC",
    maxApr: "7.5%",
    duration: "14 days",
    mode: "Until Fully Filled",
    risk: "Low",
  };

  const handleLock = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1500);
  };

  const handleList = () => {
    setStep(3);
    setTimeout(() => navigate("/borrow/live"), 1200);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Confirm Your Request</h1>

        <div className="glow-card p-6 mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="flex justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-sm font-medium">
                {key === "risk" ? <span className="badge-low px-2 py-0.5 rounded-full text-xs">{val}</span> : val}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <button
            disabled={step > 0}
            onClick={handleLock}
            className={`glow-button w-full flex items-center justify-center gap-2 ${step >= 2 ? "opacity-50" : ""}`}
          >
            {step >= 2 ? <CheckCircle className="w-4 h-4" /> : step === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {step >= 2 ? "Collateral Locked" : step === 1 ? "Signing with Monad…" : "Lock Collateral"}
          </button>
          <button
            disabled={step < 2 || step > 2}
            onClick={handleList}
            className={`glow-button w-full flex items-center justify-center gap-2 ${step < 2 ? "opacity-30 cursor-not-allowed" : step > 2 ? "opacity-50" : ""}`}
          >
            {step === 3 ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {step === 3 ? "Request Listed!" : "List Request"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Executed on Monad • Private state powered by Unlink
        </p>
      </div>
    </div>
  );
};

export default BorrowConfirmation;
