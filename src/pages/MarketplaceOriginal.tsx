// Copy the original Marketplace component here with fixed property access
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card as CardComponent, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GameCard from '@/components/GameCard';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MarketListing, Player } from '@/types/game';
import { monadGameService } from '@/services/MonadGameService';

interface MarketplaceProps {
  listings: MarketListing[];
  currentPlayer: Player & { tokens: number };
}

const MarketplaceOriginal: React.FC<MarketplaceProps> = ({ listings, currentPlayer }) => {
  const [activeListing, setActiveListing] = useState<MarketListing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleBuy = async () => {
    if (!activeListing) return;

    if (currentPlayer.tokens < activeListing.price) {
      toast.error("Insufficient MONAD tokens", {
        description: `You need ${activeListing.price} MONAD tokens to purchase this card.`
      });
      return;
    }

    // Connect wallet if not already connected
    try {
      await monadGameService.connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error("Wallet connection failed", {
        description: "Please make sure your wallet is installed and unlocked."
      });
      return;
    }

    toast.loading("Processing purchase on MONAD blockchain...", {
      id: "purchase",
      duration: 10000, // Longer duration for real blockchain transactions
    });

    try {
      // Execute the actual blockchain transaction
      const { txHash, blockNumber } = await monadGameService.purchaseCard(
        activeListing.id,
        activeListing.price
      );

      // Update player's MONAD balance
      const newBalance = currentPlayer.tokens - activeListing.price;

      // In the wrapper component, tokens maps to monad, so we need to update that property
      if ('monad' in currentPlayer) {
        // @ts-ignore - We know this exists from the wrapper
        currentPlayer.monad = newBalance;
      }

      // Add the card to the player's inventory
      // @ts-ignore - We know cards exists on the Player type
      if (Array.isArray(currentPlayer.cards)) {
        // Create a copy of the card with a unique ID to avoid duplicates
        const purchasedCard = {
          ...activeListing.card,
          id: `${activeListing.card.id}-purchased-${Date.now()}`,
          monadId: `${activeListing.card.monadId}-${txHash.substring(0, 8)}`
        };

        // @ts-ignore - We know cards exists on the Player type
        currentPlayer.cards.push(purchasedCard);

        // Add transaction to player's history if it exists
        if (Array.isArray(currentPlayer.transactionHistory)) {
          currentPlayer.transactionHistory.push({
            txHash,
            type: 'TRADE',
            timestamp: Date.now(),
            details: `Purchased ${activeListing.card.name} for ${activeListing.price} MONAD`
          });
        }

        // Save to localStorage for persistence
        try {
          localStorage.setItem('playerCards', JSON.stringify(currentPlayer.cards));
          localStorage.setItem('playerMonad', newBalance.toString());
        } catch (error) {
          console.error('Failed to save purchase to localStorage:', error);
        }
      }

      // Get the explorer URL for the transaction
      const explorerUrl = monadGameService.getExplorerUrl(txHash);

      // Show a more detailed success message
      toast.success("Card purchased successfully!", {
        id: "purchase",
        description: (
          <div>
            Transaction confirmed on block #{blockNumber}. Card added to your inventory!<br/>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              View transaction on MONAD Explorer
            </a>
          </div>
        )
      });

      // Show a second toast with instructions on how to view the card
      setTimeout(() => {
        toast.info("View your new card", {
          description: "Go to your Profile to see the card in your collection.",
          action: {
            label: "View Profile",
            onClick: () => window.location.href = "/profile"
          },
          duration: 5000
        });
      }, 1000);

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error("Error processing purchase", {
        id: "purchase",
        description: "There was an error processing your transaction. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto pt-24 px-4 pb-16">
        <h1 className="text-4xl font-bold text-white mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            MONAD Marketplace
          </span>
        </h1>

        <div className="flex justify-between items-center mb-8">
          <Tabs defaultValue="all" className="w-[400px]">
            <TabsList className="bg-black/40">
              <TabsTrigger value="all">All Cards</TabsTrigger>
              <TabsTrigger value="attack">Attack</TabsTrigger>
              <TabsTrigger value="defense">Defense</TabsTrigger>
              <TabsTrigger value="utility">Utility</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-2">
            <div className="bg-black/40 px-4 py-2 rounded-lg flex items-center">
              <span className="text-white mr-2">Your Balance:</span>
              <span className="text-indigo-400 font-bold">
                {typeof currentPlayer.tokens === 'number' ? currentPlayer.tokens.toFixed(4) : currentPlayer.tokens} MONAD
                <span className="ml-1 text-xs text-green-400">(Live)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {listings.map((listing) => (
            <CardComponent key={listing.id} className="glassmorphism border-indigo-500/30 overflow-visible">
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-indigo-400 font-mono">
                    {listing.monadContract?.substring(0, 10)}...
                  </span>
                  <span className="bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded text-xs">
                    {new Date(listing.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-center">
                  <GameCard card={listing.card} className="transform hover:scale-105 transition-all duration-300" />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{listing.card.name}</span>
                    <span className="text-indigo-400 font-bold">{listing.price} MONAD</span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    onClick={() => {
                      setActiveListing(listing);
                      setIsDialogOpen(true);
                    }}
                  >
                    Purchase
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/50 mr-1"></div>
                    <span className="text-xs text-gray-400">Seller: {listing.seller.substring(0, 6)}...</span>
                  </div>
                  {listing.monadTxHash && (
                    <div>
                      <span className="inline-flex items-center text-xs text-indigo-400">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></span>
                        On-chain
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardComponent>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glassmorphism border-indigo-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are about to purchase this card using the MONAD blockchain.
            </DialogDescription>
          </DialogHeader>

          {activeListing && (
            <div className="flex justify-center py-4">
              <GameCard card={activeListing.card} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="bg-black/20 p-3 rounded">
              <div className="text-sm text-gray-400">Price</div>
              <div className="text-lg font-bold text-indigo-400">
                {activeListing?.price} MONAD
              </div>
            </div>

            <div className="bg-black/20 p-3 rounded">
              <div className="text-sm text-gray-400">Your Balance</div>
              <div className="text-lg font-bold text-indigo-400">
                {typeof currentPlayer.tokens === 'number' ? currentPlayer.tokens.toFixed(4) : currentPlayer.tokens} MONAD
                <div className="text-xs text-green-400">(Live from blockchain)</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-900"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
              onClick={handleBuy}
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplaceOriginal;
