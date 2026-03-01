import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Send, CheckCircle, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useBorrowContext } from "@/contexts/BorrowContext";
import { useWallet } from "@/contexts/WalletContext";
import { createLoan } from "@/services/api";
import { setLoanClientMeta } from "@/utils/loanMetaStore";

const BorrowConfirmation = () => {
  const navigate = useNavigate();
  const { formData, clearFormData, setActiveLoanId, setActiveLoanMeta } = useBorrowContext();
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

  const durationDays = Math.max(1, Number(formData.repaymentDurationDays) || 1);
  const getAskDurationDays = (label: string): number => {
    const map: Record<string, number> = {
      "6 hours": 0.25,
      "12 hours": 0.5,
      "1 day": 1,
      "3 days": 3,
      "5 days": 5,
      "7 days": 7,
      "1 week": 7,
      "Until Clear": 7,
    };
    return map[label] ?? 7;
  };
  const askDurationDays = getAskDurationDays(formData.askDuration);
  const normalizedAskDuration = `${askDurationDays} day${askDurationDays !== 1 ? "s" : ""}`;
  const riskBadgeClass =
    formData.riskTier === "Low"
      ? "badge-low"
      : formData.riskTier === "High"
      ? "badge-high"
      : "badge-medium";

  const summary = {
    amount: `$${Number(formData.amount).toLocaleString()} USDC`,
    collateral: `$${Number(formData.collateral).toLocaleString()} USDC`,
    maxApr: `${formData.maxApr}%`,
    askDuration: normalizedAskDuration,
    timeUntilRepayment: `${durationDays} day${durationDays !== 1 ? "s" : ""}`,
    risk: formData.riskTier,
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
      setLoanClientMeta(response.id, { riskTier: formData.riskTier });
      setActiveLoanMeta({
        askDuration: formData.askDuration,
        repaymentDurationDays: durationDays,
        riskTier: formData.riskTier,
      });

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
        <button onClick={() => navigate(-1)} className="glow-button-outline text-sm px-3 py-1.5 mb-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
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
                {key === "risk" ? <span className={`${riskBadgeClass} px-2 py-0.5 rounded-full text-xs`}>{val}</span> : val}
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
