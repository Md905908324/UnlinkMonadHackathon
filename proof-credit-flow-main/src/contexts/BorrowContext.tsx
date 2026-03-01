import { createContext, useContext, useState, ReactNode } from "react";

export interface BorrowFormData {
  amount: string;
  collateral: string;
  maxApr: number;
  askDuration: string;
  repaymentDuration: string;
}

interface BorrowContextType {
  formData: BorrowFormData | null;
  setFormData: (data: BorrowFormData) => void;
  clearFormData: () => void;
  activeLoanId: string | null;
  setActiveLoanId: (id: string | null) => void;
}

const BorrowContext = createContext<BorrowContextType>({
  formData: null,
  setFormData: () => {},
  clearFormData: () => {},
  activeLoanId: null,
  setActiveLoanId: () => {},
});

export const useBorrowContext = () => useContext(BorrowContext);

export const BorrowProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<BorrowFormData | null>(null);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);

  const clearFormData = () => setFormData(null);

  return (
    <BorrowContext.Provider value={{ formData, setFormData, clearFormData, activeLoanId, setActiveLoanId }}>
      {children}
    </BorrowContext.Provider>
  );
};
