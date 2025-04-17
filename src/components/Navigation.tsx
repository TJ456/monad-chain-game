/// <reference types="react-scripts" />

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from 'react-router-dom';
import { currentPlayer } from '@/data/gameData';
import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";

const Navigation: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const provider = new Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request wallet connection
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Validate the network
      const requiredNetwork = import.meta.env.VITE_NETWORK_ID;
      const requiredNetworkName = import.meta.env.VITE_NETWORK_NAME;
      const currentNetwork = await provider.getNetwork();
      
      if (currentNetwork.chainId !== parseInt(requiredNetwork, 16)) {
        // Show network switch dialog
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredNetwork }],
          });
        } catch (switchError: any) {
          // If the chain hasn't been added to MetaMask
          if (switchError.code === 4902) {
            toast({
              title: "Network Not Found",
              description: `Please add the ${requiredNetworkName} network to your wallet.`,
              variant: "destructive",
            });
            return;
          }
          throw switchError;
        }
      }

      // Update state and currentPlayer
      setIsWalletConnected(true);
      currentPlayer.monadAddress = address;

      // Show success toast
      toast({
        title: "Wallet Connected",
        description: `Connected to ${requiredNetworkName}`,
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
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
                >
                  Connect Wallet
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
