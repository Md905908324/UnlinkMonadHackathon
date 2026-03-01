import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  connected: boolean;
  address: string;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [address] = useState("0x7a3b...9f2E");

  const connect = () => setConnected(true);
  const disconnect = () => setConnected(false);

  return (
    <WalletContext.Provider value={{ connected, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
