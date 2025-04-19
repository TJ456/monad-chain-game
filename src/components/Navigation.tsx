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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Navigation: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [monadBalance, setMonadBalance] = useState<number | null>(null);

  const handleRemoveNetwork = async () => {
    try {
      await monadGameService.tryRemoveMonadNetwork();
    } catch (error) {
      console.error('Error removing network:', error);
      toast({
        title: "Network Removal Failed",
        description: "Failed to remove the Monad network from MetaMask. Please try removing it manually.",
        variant: "destructive",
      });
    }
  };

  const handleManualNetworkConfig = () => {
    const config = monadGameService.getMonadNetworkConfig();

    // Create a formatted message with network details
    const message = (
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-semibold">Add MONAD network to MetaMask manually with these settings:</p>
          <div className="grid grid-cols-2 gap-1 mt-2">
            <span className="font-medium">Network Name:</span>
            <span>{config.chainName}</span>

            <span className="font-medium">RPC URL:</span>
            <span>{config.rpcUrls[0]}</span>

            <span className="font-medium">Chain ID:</span>
            <span>{parseInt(config.chainId, 16)} (hex: {config.chainId})</span>

            <span className="font-medium">Currency Symbol:</span>
            <span>{config.nativeCurrency.symbol}</span>

            <span className="font-medium">Block Explorer:</span>
            <span>{config.blockExplorerUrls[0]}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-amber-400 mb-2">If you're having issues, try removing the network first:</p>
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-xs"
            onClick={handleRemoveNetwork}
          >
            Remove Monad Network
          </Button>
        </div>
      </div>
    );

    toast({
      title: "Manual Network Configuration",
      description: message,
      variant: "default",
      duration: 20000, // Show for 20 seconds
    });
  };

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

      // Get the actual MONAD balance
      try {
        const balance = await monadGameService.getMonadBalance();
        setMonadBalance(balance);
        currentPlayer.monad = balance;
        console.log('Updated MONAD balance after connection:', balance);
      } catch (err) {
        console.error('Failed to get MONAD balance after connection:', err);
      }

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Monad Mainnet",
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
      } else if (error.message?.includes('network') || error.message?.includes('chain') || error.message?.includes('Network')) {
        // Show network error with manual configuration option
        toast({
          title: "Network Configuration Error",
          description: (
            <div className="flex flex-col space-y-2">
              <p>{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleManualNetworkConfig()}
                className="mt-2"
              >
                Configure Manually
              </Button>
            </div>
          ),
          variant: "destructive",
        });
      } else if (error.message?.includes('add') || error.message?.includes('already exists')) {
        toast({
          title: "Network Configuration Error",
          description: (
            <div className="flex flex-col space-y-2">
              <p>Failed to add Monad network. Please try adding it manually.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleManualNetworkConfig()}
                className="mt-2"
              >
                Configure Manually
              </Button>
            </div>
          ),
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

  // Check for existing wallet connection and add network change listener
  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      try {
        if (window.ethereum && window.ethereum.request) {
          // Check if we're already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];

          if (accounts && accounts.length > 0) {
            console.log('Wallet already connected:', accounts[0]);
            setIsWalletConnected(true);
            currentPlayer.monadAddress = accounts[0];

            // Try to get the actual MONAD balance
            try {
              await monadGameService.connectWallet();
              const balance = await monadGameService.getMonadBalance();
              setMonadBalance(balance);
              currentPlayer.monad = balance;
              console.log('Updated MONAD balance in Navigation:', balance);
            } catch (err) {
              console.error('Failed to get MONAD balance in Navigation:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      const handleChainChanged = () => {
        // Reload the page when the chain changes
        window.location.reload();
      };

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setIsWalletConnected(false);
          currentPlayer.monadAddress = null;
          setMonadBalance(null);
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected.",
            variant: "destructive",
          });
        } else {
          // Account changed
          setIsWalletConnected(true);
          currentPlayer.monadAddress = accounts[0];

          // Get the new account's MONAD balance
          try {
            const balance = await monadGameService.getMonadBalance();
            setMonadBalance(balance);
            currentPlayer.monad = balance;
            console.log('Updated MONAD balance after account change:', balance);
          } catch (err) {
            console.error('Failed to get MONAD balance after account change:', err);
          }
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
        <div className="w-full flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">
              MONAD<span className="text-monad-blue">Chain</span><span className="text-monad-cyan">Games</span>
            </span>
          </Link>
          <div className="flex justify-between items-center">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/game" className={`nav-link text-white hover:text-monad-blue transition-colors ${location.pathname === "/game" ? "active font-medium text-monad-cyan" : ""}`}>
                Play Game
              </Link>
              <Link to="/tournament" className={`nav-link text-white hover:text-monad-blue transition-colors ${location.pathname === "/tournament" ? "active font-medium text-monad-cyan" : ""}`}>
                Tournaments
              </Link>
              <Link to="/marketplace" className={`nav-link text-white hover:text-monad-blue transition-colors ${location.pathname === "/marketplace" ? "active font-medium text-monad-cyan" : ""}`}>
                Marketplace
              </Link>
              <Link to="/leaderboard" className={`nav-link text-white hover:text-monad-blue transition-colors ${location.pathname === "/leaderboard" ? "active font-medium text-monad-cyan" : ""}`}>
                Leaderboard
              </Link>
              <div className="h-4 w-px bg-gray-600"></div>

              {/* Wallet Connection Section */}
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-monad-cyan font-medium flex items-center">
                        {monadBalance !== null ? monadBalance.toFixed(4) : currentPlayer.monad} MONAD
                        <div className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live balance from MONAD blockchain</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isWalletConnected ? (
                  <Button
                    variant="outline"
                    className="border-monad-blue text-monad-blue hover:bg-monad-blue/20 transition-all duration-300 ease-in-out transform hover:scale-105"
                    onClick={() => navigate("/profile")}
                  >
                    {currentPlayer.monadAddress?.substring(0, 6)}...
                    {currentPlayer.monadAddress?.substring(currentPlayer.monadAddress.length - 4)}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-gradient-to-r from-monad-purple to-monad-blue text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-glow"
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Connecting
                        </span>
                      ) : (
                        "Connect Wallet"
                      )}
                    </Button>
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-monad-blue hover:bg-monad-blue/10 transition-all duration-300 ease-in-out"
                        onClick={handleManualNetworkConfig}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                      </Button>
                      <div className="absolute right-0 mt-2 w-48 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out pointer-events-none group-hover:pointer-events-auto z-50">
                        <div className="bg-black/90 border border-monad-blue/30 rounded-md shadow-lg p-2 text-xs text-white">
                          <p>Network Setup Guide</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              {!isWalletConnected && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-monad-purple to-monad-blue text-white text-xs transition-all duration-300 ease-in-out"
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connect
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-monad-blue hover:bg-monad-blue/10 transition-all duration-300 ease-in-out h-8 w-8"
                    onClick={handleManualNetworkConfig}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                className="text-white transition-all duration-300 ease-in-out hover:bg-white/10 hover:rotate-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 ease-in-out"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
