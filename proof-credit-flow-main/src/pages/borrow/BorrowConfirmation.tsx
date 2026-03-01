import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useBorrowContext } from "@/contexts/BorrowContext";
import { useWallet } from "@/contexts/WalletContext";
import { createLoan } from "@/services/api";
import { DURATION_PRESETS } from "@/hooks/useRiskScore";

const BorrowConfirmation = () => {
  const navigate = useNavigate();
  const { formData, clearFormData, setActiveLoanId } = useBorrowContext();
  const { address } = useWallet();
  const [step, setStep] = useState(0); // 0=review, 1=locking, 2=listing, 3=done
  const [error, setError] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (!formData) {
      // Redirect back to form if no data
      navigate("/borrow/form");
    }
  }, [formData, navigate]);

  if (!formData) return null;

  // Calculate summary from stored form data
  const getDurationDays = (label: string): number => {
    const preset = DURATION_PRESETS.find((p) => p.label === label);
    return preset?.days ?? 7;
  };

  const durationDays = getDurationDays(formData.repaymentDuration);
  const askDurationDays = getDurationDays(formData.askDuration);

  const summary = {
    amount: `$${Number(formData.amount).toLocaleString()} USDC`,
    collateral: `$${Number(formData.collateral).toLocaleString()} USDC`,
    maxApr: `${formData.maxApr}%`,
    duration: `${durationDays} days`,
    risk: "Medium", // This would come from credit profile
  };

  const handleLock = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1500);
  };

  const handleList = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError(null);
      setStep(3);

      const loanRequest = {
        borrowerUnlink: address,
        onChainId: address,
        amount: formData.amount,
        collateral: formData.collateral,
        durationHours: askDurationDays * 24,
        maxRate: formData.maxApr,
      };

      const response = await createLoan(loanRequest);
      setLoanId(response.id);
      setActiveLoanId(response.id);

      setTimeout(() => {
        clearFormData();
        navigate("/borrow/live");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list request");
      setStep(2); // Reset to listing step so user can retry
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8 animate-fade-in">Confirm Your Request</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-500 font-medium">Error</p>
              <p className="text-xs text-red-500/80">{error}</p>
            </div>
          </div>
        )}

        <div className="glow-card p-6 mb-8 animate-fade-in">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="flex justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-sm font-medium">
                {key === "risk" ? <span className="badge-medium px-2 py-0.5 rounded-full text-xs">{val}</span> : val}
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
