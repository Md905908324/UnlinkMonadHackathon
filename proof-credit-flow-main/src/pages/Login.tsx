import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Shield, KeyRound, ArrowRight, AlertCircle } from "lucide-react";

const Login = () => {
  const { connect } = useWallet();
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError("Please enter a valid 12 or 24-word mnemonic phrase.");
      return;
    }
    setError("");
    connect();
    setTimeout(() => navigate("/select"), 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
            Connect to <span className="text-primary">ProofCredit</span>
          </h1>
          <p className="text-muted-foreground">
            Import your wallet using a mnemonic phrase.
          </p>
        </div>

        <div className="glow-card p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Mnemonic Phrase
            </label>
            <textarea
              value={mnemonic}
              onChange={(e) => {
                setMnemonic(e.target.value);
                setError("");
              }}
              placeholder="Enter your 12 or 24-word seed phrase separated by spaces…"
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!mnemonic.trim()}
            className="glow-button w-full text-sm px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import Wallet
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Your phrase is used locally and never stored or transmitted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
