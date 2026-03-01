import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle, ArrowRight } from "lucide-react";

interface UploadField {
  id: string;
  label: string;
  desc: string;
  optional?: boolean;
  file: File | null;
}

const CreditVerification = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<UploadField[]>([
    { id: "paystub", label: "Paystub or Employment Letter", desc: "Verify your income source", file: null },
    { id: "bank", label: "Bank Statement or Payroll Screenshot", desc: "Verify income stability", file: null },
    { id: "compliance", label: "Compliance Credential", desc: "Optional KYC/AML credential", optional: true, file: null },
  ]);

  const handleFile = (id: string, file: File | null) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, file } : u)));
  };

  const requiredFilled = uploads.filter((u) => !u.optional).every((u) => u.file);

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold mb-2">Private Credit Verification</h1>
          <p className="text-muted-foreground">Upload your documents for encrypted, zero-knowledge verification.</p>
        </div>

        <div className="space-y-4">
          {uploads.map((u, i) => (
            <label
              key={u.id}
              className={`glow-card p-6 flex items-center gap-4 cursor-pointer opacity-0 animate-fade-in ${u.file ? "glow-card-active" : ""}`}
              style={{ animationDelay: `${i * 100 + 200}ms` }}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFile(u.id, e.target.files?.[0] || null)}
              />
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                {u.file ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <Upload className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{u.label}</span>
                  {u.optional && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">Optional</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {u.file ? u.file.name : u.desc}
                </p>
              </div>
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            </label>
          ))}
        </div>

        <button
          disabled={!requiredFilled}
          onClick={() => navigate("/borrow/matching")}
          className="glow-button w-full mt-8 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit for Private Verification
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CreditVerification;
