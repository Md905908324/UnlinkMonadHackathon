import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, LogOut, Shield } from "lucide-react";

const Navbar = () => {
  const { connected, address, connect, disconnect } = useWallet();
  const location = useLocation();

  const navLinks = [
    { to: "/borrow/verify", label: "Borrow" },
    { to: "/lend/market", label: "Lend" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path.split("/").slice(0, 2).join("/"));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          <span className="font-heading text-xl font-bold tracking-tight">ProofCredit</span>
        </Link>

        {connected && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div>
          {connected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-primary font-mono">{address}</span>
              </div>
              <button onClick={disconnect} className="glow-button-outline text-sm px-4 py-2 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <Link to="/login" className="glow-button text-sm flex items-center gap-2 px-4 py-2">
              <Wallet className="w-4 h-4" />
              Enter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
