import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import WorkflowSelect from "@/pages/WorkflowSelect";
import CreditVerification from "@/pages/borrow/CreditVerification";
import AIMatching from "@/pages/borrow/AIMatching";
import BorrowForm from "@/pages/borrow/BorrowForm";
import BorrowConfirmation from "@/pages/borrow/BorrowConfirmation";
import LiveRequest from "@/pages/borrow/LiveRequest";
import MarketDeals from "@/pages/lend/MarketDeals";
import DealDetail from "@/pages/lend/DealDetail";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select" element={<WorkflowSelect />} />
            <Route path="/borrow/verify" element={<CreditVerification />} />
            <Route path="/borrow/matching" element={<AIMatching />} />
            <Route path="/borrow/form" element={<BorrowForm />} />
            <Route path="/borrow/confirm" element={<BorrowConfirmation />} />
            <Route path="/borrow/live" element={<LiveRequest />} />
            <Route path="/lend/market" element={<MarketDeals />} />
            <Route path="/lend/deal/:id" element={<DealDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
