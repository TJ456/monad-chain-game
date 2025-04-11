
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ChainReactionCards = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  
  const triggerChainReaction = () => {
    setIsTriggering(true);
    
    toast.loading("Initiating smart contract event...", {
      id: "chain-reaction"
    });
    
    setTimeout(() => {
      toast.success("Chain Reaction Complete!", {
        id: "chain-reaction",
        description: "Blockchain Hack stole 1 NFT from opponent's wallet"
      });
      
      setIsTriggering(false);
    }, 2000);
  };
  
  return (
    <Card className="glassmorphism border-purple-500/30 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-10 w-10 rounded-full bg-purple-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Chain Reaction Cards</h3>
          <p className="text-gray-400">Cards that trigger actual smart contract events</p>
        </div>
        <Badge className="ml-auto bg-purple-600 text-white">Exclusive</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
          <h4 className="text-white font-medium mb-2">Blockchain Hack</h4>
          <p className="text-sm text-gray-400 mb-3">
            Steals a random NFT from opponent's wallet and holds it hostage until match ends
          </p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mana Cost: 7</span>
            <span>Success Rate: 85%</span>
          </div>
          <Button 
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600"
            size="sm"
            disabled={isTriggering}
            onClick={triggerChainReaction}
          >
            {isTriggering ? "Processing..." : "Trigger Example"}
          </Button>
        </div>
        
        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
          <h4 className="text-white font-medium mb-2">Airdrop Strike</h4>
          <p className="text-sm text-gray-400 mb-3">
            Mints a surprise token directly to player's wallet with random attributes
          </p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mana Cost: 5</span>
            <span>Token Quality: 1-100</span>
          </div>
          <Button 
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600"
            size="sm"
            variant="outline"
          >
            Locked - Collect Card First
          </Button>
        </div>
      </div>
      
      <div className="mt-6 bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
        <h4 className="text-white font-medium">How It Works</h4>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">1</div>
          <p className="text-sm text-gray-300">Card effect triggers smart contract function call</p>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">2</div>
          <p className="text-sm text-gray-300">Monad processes transaction in under 1 second</p>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">3</div>
          <p className="text-sm text-gray-300">Real blockchain state changes affect gameplay</p>
        </div>
      </div>
    </Card>
  );
};

export default ChainReactionCards;
