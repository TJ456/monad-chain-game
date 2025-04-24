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

interface MarketplaceProps {
  listings: MarketListing[];
  currentPlayer: Player & { tokens: number };
}

const MarketplaceOriginal: React.FC<MarketplaceProps> = ({ listings, currentPlayer }) => {
  const [activeListing, setActiveListing] = useState<MarketListing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleBuy = () => {
    if (!activeListing) return;

    if (currentPlayer.tokens < activeListing.price) {
      toast.error("Insufficient MONAD tokens", {
        description: `You need ${activeListing.price} MONAD tokens to purchase this card.`
      });
      return;
    }

    toast.loading("Processing purchase on MONAD blockchain...", {
      id: "purchase",
      duration: 3000,
    });

    setTimeout(() => {
      // Add the purchased card to the player's inventory
      // First, update the global currentPlayer object
      const { card } = activeListing;

      // Create a copy of the card with a unique ID
      const purchasedCard = {
        ...card,
        id: `purchased-${Date.now()}`,
        monadId: `${card.monadId}-${Math.floor(Math.random() * 1000)}`,
        status: "active"
      };

      // Add the card to the player's inventory
      if (typeof window !== 'undefined') {
        // Get current cards from localStorage or use currentPlayer.cards
        const savedCards = localStorage.getItem('playerCards');
        let playerCards = [];

        if (savedCards) {
          try {
            playerCards = JSON.parse(savedCards);
          } catch (error) {
            console.error('Error parsing saved cards:', error);
            playerCards = [...currentPlayer.cards];
          }
        } else {
          playerCards = [...currentPlayer.cards];
        }

        // Add the new card
        playerCards.push(purchasedCard);

        // Update currentPlayer object
        currentPlayer.cards = playerCards;

        // Deduct tokens/monad
        currentPlayer.monad -= activeListing.price;

        // Save to localStorage
        try {
          localStorage.setItem('playerCards', JSON.stringify(playerCards));
          localStorage.setItem('playerMonad', currentPlayer.monad.toString());
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }

      toast.success("Card purchased successfully!", {
        id: "purchase",
        description: (
          <div className="space-y-2">
            <p>Transaction confirmed on block #{Math.floor(Math.random() * 100000)}</p>
            <p className="text-green-400">Card added to your inventory!</p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => {
                  // Navigate to profile page where the inventory is shown
                  window.location.href = "/profile";
                }}
              >
                View in Inventory
              </Button>
            </div>
          </div>
        ),
        duration: 8000
      });

      // Show a more prominent notification after a short delay
      setTimeout(() => {
        toast.info("New Card Added", {
          description: (
            <div className="space-y-2">
              <p>The card <strong>{activeListing.card.name}</strong> has been added to your inventory!</p>
              <p className="text-xs text-gray-400">You can view it in your Profile page or use it in the Burn-to-Evolve section.</p>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    window.location.href = "/profile";
                  }}
                >
                  Go to Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                >
                  Burn to Evolve
                </Button>
              </div>
            </div>
          ),
          duration: 8000
        });
      }, 1000);

      setIsDialogOpen(false);
    }, 3000);
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
              <span className="text-indigo-400 font-bold">{currentPlayer.tokens} MONAD</span>
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
                {currentPlayer.tokens} MONAD
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
