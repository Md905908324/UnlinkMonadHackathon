import { createContext, useContext, useState, ReactNode } from "react";

export interface BorrowFormData {
  amount: string;
  collateral: string;
  maxApr: number;
  askDuration: string;
  repaymentDurationDays: number;
  riskTier: "Low" | "Medium" | "High";
}

export interface ActiveLoanMeta {
  askDuration: string;
  repaymentDurationDays: number;
  riskTier: "Low" | "Medium" | "High";
}

interface BorrowContextType {
  formData: BorrowFormData | null;
  setFormData: (data: BorrowFormData) => void;
  clearFormData: () => void;
  activeLoanId: string | null;
  setActiveLoanId: (id: string | null) => void;
  activeLoanMeta: ActiveLoanMeta | null;
  setActiveLoanMeta: (meta: ActiveLoanMeta | null) => void;
}

const BorrowContext = createContext<BorrowContextType>({
  formData: null,
  setFormData: () => {},
  clearFormData: () => {},
  activeLoanId: null,
  setActiveLoanId: () => {},
  activeLoanMeta: null,
  setActiveLoanMeta: () => {},
});

export const useBorrowContext = () => useContext(BorrowContext);

export const BorrowProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<BorrowFormData | null>(null);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [activeLoanMeta, setActiveLoanMeta] = useState<ActiveLoanMeta | null>(null);

  const clearFormData = () => setFormData(null);

  return (
    <BorrowContext.Provider value={{ formData, setFormData, clearFormData, activeLoanId, setActiveLoanId, activeLoanMeta, setActiveLoanMeta }}>
      {children}
    </BorrowContext.Provider>
  );
};
