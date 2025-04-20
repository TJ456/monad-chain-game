import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./contexts/PlayerContext";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Marketplace from "./pages/Marketplace";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Tournament from "./pages/Tournament";
import NFTFeatures from "./pages/NFTFeatures";
import NotFound from "./pages/NotFound";
import Footer from "./components/ui/footer";
import Navbar from "./components/ui/navbar";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <Routes>
              <Route path="/" element={
                <>
                  <Index />
                  <div className="footer-spacer h-40"></div>
                  <Footer />
                </>
              } />
              <Route path="/game" element={<Game />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/tournament" element={<Tournament />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/nft-features" element={<NFTFeatures />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
