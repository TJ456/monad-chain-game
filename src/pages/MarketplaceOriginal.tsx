
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
      toast.error("Insufficient MONDO tokens", {
        description: `You need ${activeListing.price} MONDO tokens to purchase this card.`
      });
      return;
    }
    
    toast.loading("Processing purchase on MONAD blockchain...", {
      id: "purchase",
      duration: 3000,
    });
    
    setTimeout(() => {
      toast.success("Card purchased successfully!", {
        id: "purchase",
        description: `Transaction confirmed on block #${Math.floor(Math.random() * 100000)}`
      });
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
              <span className="text-indigo-400 font-bold">{currentPlayer.tokens} MONDO</span>
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
                    <span className="text-indigo-400 font-bold">{listing.price} MONDO</span>
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
                {activeListing?.price} MONDO
              </div>
            </div>
            
            <div className="bg-black/20 p-3 rounded">
              <div className="text-sm text-gray-400">Your Balance</div>
              <div className="text-lg font-bold text-indigo-400">
                {currentPlayer.tokens} MONDO
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
