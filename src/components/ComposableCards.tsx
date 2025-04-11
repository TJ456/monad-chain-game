
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCard from '@/components/GameCard';
import { toast } from "sonner";
import { useToast } from "@/components/ui/use-toast";
import { Card as GameCardType, CardRarity, CardType } from '@/types/game';
import { currentPlayer } from '@/data/gameData';

// Mock data for a new card resulting from composition
const compositeCardResult: GameCardType = {
  id: "card-composed-1",
  name: "Ethereal Monad Guardian",
  description: "A powerful fusion of defense and utility, providing shield and mana regeneration",
  image: "/composed-guardian.png",
  rarity: CardRarity.LEGENDARY,
  type: CardType.DEFENSE,
  defense: 15,
  mana: 5,
  monadId: "0xMONAD121",
  onChainMetadata: {
    creator: "0xAbCdEfGh1234567890",
    creationBlock: 1420600,
    evolutionStage: 1,
    battleHistory: [],
    composableWith: ["card-2", "card-5"],
    stateHash: "0x7fb2c..."
  },
  stateChannels: {
    channelId: "channel-76543",
    lastStateHash: "0x9d3f2...",
    pendingMoves: 0,
    participantAddresses: ["0xAbCd...EfGh", "0x1234...5678"]
  }
};

const ComposableCards: React.FC = () => {
  const { toast: uiToast } = useToast();
  const [selectedCards, setSelectedCards] = useState<GameCardType[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [composedCard, setComposedCard] = useState<GameCardType | null>(null);
  
  const toggleCardSelection = (card: GameCardType) => {
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      if (selectedCards.length < 2) {
        setSelectedCards([...selectedCards, card]);
      } else {
        uiToast({
          title: "Selection Limited",
          description: "You can only select two cards for composition",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleComposeCards = () => {
    if (selectedCards.length !== 2) {
      uiToast({
        title: "Selection Required",
        description: "Select exactly two cards to compose",
        variant: "destructive"
      });
      return;
    }
    
    setIsComposing(true);
    toast.loading("Initiating MONAD blockchain composition...", {
      id: "card-compose",
      duration: 4000,
    });
    
    // Simulate blockchain composition process
    setTimeout(() => {
      toast.success("Generating ZK-proof for composition validity", {
        id: "card-compose",
        duration: 2000,
      });
      
      setTimeout(() => {
        toast.success("Recording composition on MONAD blockchain", {
          id: "card-compose",
          duration: 2000,
        });
        
        setTimeout(() => {
          setComposedCard(compositeCardResult);
          setIsComposing(false);
          
          uiToast({
            title: "Cards Successfully Composed",
            description: `Created new ${compositeCardResult.rarity} card: ${compositeCardResult.name}`,
          });
          
          toast.success("Composition complete!", {
            id: "card-compose",
            description: "Transaction recorded at block #1420601"
          });
          
        }, 2000);
      }, 2000);
    }, 4000);
  };
  
  const resetComposition = () => {
    setSelectedCards([]);
    setComposedCard(null);
  };
  
  return (
    <Card className="glassmorphism border-purple-500/30 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            MONAD Composable Cards
          </span>
        </h2>
        <p className="text-sm text-gray-400">
          Compose two cards on-chain to create a powerful new card with combined abilities
        </p>
      </div>
      
      {!composedCard ? (
        <>
          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-2">Select two cards to compose:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentPlayer.cards.map(card => (
                <div 
                  key={card.id}
                  className={`relative transition-all ${
                    selectedCards.some(c => c.id === card.id) 
                      ? 'scale-105 ring-2 ring-purple-500 rounded' 
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => toggleCardSelection(card)}
                >
                  <GameCard card={card} className="w-28 h-40" showDetails={false} />
                  {selectedCards.some(c => c.id === card.id) && (
                    <div className="absolute top-1 right-1 h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {selectedCards.findIndex(c => c.id === card.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              disabled={selectedCards.length !== 2 || isComposing}
              onClick={handleComposeCards}
            >
              {isComposing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Composing on MONAD...
                </span>
              ) : (
                "Compose Cards on MONAD"
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-sm text-emerald-400 mb-4">
            Card composition successful on MONAD blockchain!
          </div>
          
          <div className="animate-float mb-6">
            <GameCard card={composedCard} className="w-56 h-80" />
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              onClick={resetComposition}
            >
              Compose New Cards
            </Button>
          </div>
        </div>
      )}
      
      {/* Display technical composition details */}
      {isComposing && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="text-xs font-mono text-purple-400 mb-2">MONAD Composition Details:</div>
          <div className="bg-black/30 p-2 rounded text-xs font-mono text-gray-400">
            <div>compositionID: {`0x${Math.random().toString(16).slice(2, 10)}`}</div>
            <div>inputCards: [{selectedCards.map(c => c.monadId).join(', ')}]</div>
            <div>stateChannel: active</div>
            <div>zkProof: generating...</div>
            <div className="text-purple-400">estimatedGas: 0.0043 MONAD</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ComposableCards;
