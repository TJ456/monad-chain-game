
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from 'react-router-dom';
import { currentPlayer } from '@/data/gameData';

const Navigation: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const handleConnectWallet = () => {
    setIsWalletConnected(true);
    toast({
      title: "Wallet Connected",
      description: `Connected to ${currentPlayer.monadAddress}`,
    });
  };

  return (
    <nav className="fixed top-0 w-full z-50 glassmorphism">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <div className="h-8 w-8 rounded-full bg-mondo-purple animate-pulse-ring"></div>
            <Link to="/" className="text-2xl font-bold text-white">
              MONDO<span className="text-mondo-blue">Chain</span>Games
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/game" className="text-white hover:text-mondo-blue transition-colors">
              Play Game
            </Link>
            <Link to="/marketplace" className="text-white hover:text-mondo-blue transition-colors">
              Marketplace
            </Link>
            <Link to="/leaderboard" className="text-white hover:text-mondo-blue transition-colors">
              Leaderboard
            </Link>
            <div className="h-4 w-px bg-gray-600"></div>
            <div className="flex items-center space-x-2">
              <div className="text-mondo-cyan font-medium">
                {currentPlayer.monad} MONDO
              </div>
              {isWalletConnected ? (
                <Button 
                  variant="outline" 
                  className="border-mondo-blue text-mondo-blue hover:bg-mondo-blue/20"
                  onClick={() => navigate("/profile")}
                >
                  {currentPlayer.monadAddress?.substring(0, 6)}...{currentPlayer.monadAddress?.substring(currentPlayer.monadAddress.length - 4)}
                </Button>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-mondo-purple to-mondo-blue text-white"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <Button variant="ghost" className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
