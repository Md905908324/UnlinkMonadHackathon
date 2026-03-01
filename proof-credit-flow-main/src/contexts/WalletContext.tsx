import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  connected: boolean;
  address: string;
  connect: (address?: string) => void;
  disconnect: () => void;
}

const WALLET_SESSION_KEY = "proofcredit.wallet.session";

function loadWalletSession() {
  if (typeof window === "undefined") {
    return { connected: false, address: "" };
  }

  try {
    const raw = window.localStorage.getItem(WALLET_SESSION_KEY);
    if (!raw) return { connected: false, address: "" };

    const parsed = JSON.parse(raw) as { connected?: boolean; address?: string };
    return {
      connected: Boolean(parsed.connected && parsed.address),
      address: parsed.address || "",
    };
  } catch {
    return { connected: false, address: "" };
  }
}

function saveWalletSession(connected: boolean, address: string) {
  if (typeof window === "undefined") return;

  if (!connected || !address) {
    window.localStorage.removeItem(WALLET_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(
    WALLET_SESSION_KEY,
    JSON.stringify({ connected: true, address })
  );
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const initialSession = loadWalletSession();
  const [connected, setConnected] = useState(initialSession.connected);
  const [address, setAddress] = useState(initialSession.address);

  const connect = (nextAddress?: string) => {
    const normalizedAddress = (nextAddress || "").trim();
    if (!normalizedAddress) return;

    setAddress(normalizedAddress);
    setConnected(true);
    saveWalletSession(true, normalizedAddress);
  };

  const disconnect = () => {
    setConnected(false);
    setAddress("");
    saveWalletSession(false, "");
  };

  return (
    <WalletContext.Provider value={{ connected, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
