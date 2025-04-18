/// <reference types="react-scripts" />

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: (...args: any[]) => void) => void;
      removeListener?: (event: string, listener: (...args: any[]) => void) => void;
    };
  }
}

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from 'react-router-dom';
import { currentPlayer } from '@/data/gameData';
import { monadGameService } from '@/services/MonadGameService';

const Navigation: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    if (isConnecting) return;

    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      
      // Use the MonadGameService to handle wallet connection
      const address = await monadGameService.connectWallet();
      
      setIsWalletConnected(true);
      currentPlayer.monadAddress = address;

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Monad Testnet",
        variant: "default",
      });

    } catch (error: any) {
      console.error("Wallet connection error:", error);

      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "You rejected the connection request. Please try again.",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        toast({
          title: "Connection Pending",
          description: "A connection request is already pending. Please check MetaMask.",
          variant: "destructive",
        });
      } else if (error.message?.includes('network')) {
        toast({
          title: "Network Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.message?.includes('add')) {
        toast({
          title: "Network Configuration Error",
          description: "Failed to add Monad network. Please try adding it manually or check your connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Monad network. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Add network change listener
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        // Reload the page when the chain changes
        window.location.reload();
      };

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setIsWalletConnected(false);
          currentPlayer.monadAddress = null;
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected.",
            variant: "destructive",
          });
        } else {
          // Account changed
          currentPlayer.monadAddress = accounts[0];
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 glassmorphism">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-1">
            <div className="h-8 w-8 rounded-full bg-mondo-purple animate-pulse-ring"></div>
            <Link to="/" className="text-2xl font-bold text-white">
              MONDO<span className="text-mondo-blue">Chain</span>Games
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/game" className="text-white hover:text-mondo-blue transition-colors">
              Play Game
            </Link>
            <Link to="/tournament" className="text-white hover:text-mondo-blue transition-colors">
              Tournaments
            </Link>
            <Link to="/marketplace" className="text-white hover:text-mondo-blue transition-colors">
              Marketplace
            </Link>
            <Link to="/leaderboard" className="text-white hover:text-mondo-blue transition-colors">
              Leaderboard
            </Link>
            <div className="h-4 w-px bg-gray-600"></div>

            {/* Wallet Connection Section */}
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
                  {currentPlayer.monadAddress?.substring(0, 6)}...
                  {currentPlayer.monadAddress?.substring(currentPlayer.monadAddress.length - 4)}
                </Button>
              ) : (
                <Button
                  className="bg-gradient-to-r from-mondo-purple to-mondo-blue text-white"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
