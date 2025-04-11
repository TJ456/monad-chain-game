
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity } from '@/types/game';
import { currentPlayer, cards } from '@/data/gameData';

const BurnToEvolve: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCards, setSelectedCards] = useState<GameCardType[]>([]);
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [playerMonad, setPlayerMonad] = useState(currentPlayer.monad);
  
  // Generate potential evolve results based on selected cards
  const getPotentialResult = (): GameCardType => {
    // Base evolved card template
    const baseEvolved: GameCardType = {
      id: `evolved-${Date.now()}`,
      name: "Phoenix Guardian",
      description: "Born from the ashes of sacrifice",
      image: "/phoenix-guardian.png",
      rarity: CardRarity.RARE,
      type: "attack" as any,
      mana: 3,
      attack: 6,
      monadId: `0xEVOLVE${Math.floor(Math.random() * 10000)}`,
      onChainMetadata: {
        creator: "0xBurnToEvolve",
        creationBlock: 1420999 + Math.floor(Math.random() * 100),
        evolutionStage: 2,
        battleHistory: []
      }
    };
    
    // Customize evolved card based on selected cards
    if (selectedCards.length === 2) {
      const totalAttack = selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0);
      const totalDefense = selectedCards.reduce((sum, card) => sum + (card.defense || 0), 0);
      const avgMana = selectedCards.reduce((sum, card) => sum + card.mana, 0) / 2;
      const isRare = selectedCards.some(card => card.rarity === CardRarity.RARE);
      const isEpic = selectedCards.some(card => card.rarity === CardRarity.EPIC);
      
      // Calculate new stats based on input cards
      baseEvolved.attack = Math.round(totalAttack * 1.5);
      baseEvolved.defense = Math.round(totalDefense * 1.5) || undefined;
      baseEvolved.mana = Math.round(avgMana * 1.2);
      
      // Determine rarity based on input cards
      if (isEpic || (isRare && totalAttack > 10)) {
        baseEvolved.rarity = CardRarity.EPIC;
        baseEvolved.name = "Inferno Leviathan";
      } else if (isRare) {
        baseEvolved.name = "Flame Colossus";
      }
      
      // Add special effect for higher rarity cards
      if (baseEvolved.rarity === CardRarity.EPIC) {
        baseEvolved.specialEffect = {
          description: "Inflicts burn damage for 2 turns",
          effectType: "DEBUFF"
        };
      }
    }
    
    return baseEvolved;
  };
  
  const handleCardSelect = (card: GameCardType) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    } else {
      toast.warning("You can only select 2 cards to burn");
    }
  };
  
  const handleBurn = () => {
    if (selectedCards.length < 2) {
      toast.error("Select 2 cards to burn");
      return;
    }
    
    setIsProcessing(true);
    
    toast.loading("Burning cards on Monad blockchain...", {
      id: "burn-evolve"
    });
    
    setTimeout(() => {
      toast.success("Cards burned successfully!", {
        id: "burn-evolve",
        description: "Creating new evolved card..."
      });
      
      // Remove selected cards from deck
      setPlayerDeck(playerDeck.filter(card => 
        !selectedCards.some(selected => selected.id === card.id)
      ));
      
      // Deduct MONAD cost
      setPlayerMonad(prev => prev - 5);
      
      setTimeout(() => {
        setStep(2);
        setIsProcessing(false);
      }, 1000);
    }, 2000);
  };
  
  const handleClaim = () => {
    setIsProcessing(true);
    
    toast.loading("Minting new card on Monad blockchain...", {
      id: "claim-evolve"
    });
    
    setTimeout(() => {
      const evolvedCard = getPotentialResult();
      
      // Add evolved card to deck
      setPlayerDeck(prev => [...prev, evolvedCard]);
      
      toast.success("New card claimed!", {
        id: "claim-evolve",
        description: `${evolvedCard.name} added to your collection`
      });
      
      setStep(3);
      setIsProcessing(false);
    }, 2000);
  };

  const resetBurn = () => {
    setSelectedCards([]);
    setStep(1);
  };
  
  // Sample cards for the demo tab
  const sampleCard1: GameCardType = {
    id: "burn-1",
    name: "Flame Wisp",
    description: "A small elemental entity",
    image: "/flame-wisp.png",
    rarity: CardRarity.COMMON,
    type: "attack" as any,
    mana: 2,
    attack: 2,
    monadId: "0xBURN001"
  };

  const sampleCard2: GameCardType = {
    id: "burn-2",
    name: "Ember Sprite",
    description: "A mischievous fire sprite",
    image: "/ember-sprite.png",
    rarity: CardRarity.COMMON,
    type: "attack" as any,
    mana: 2,
    attack: 3,
    monadId: "0xBURN002"
  };

  const evolvedCard = getPotentialResult();
  
  return (
    <Card className="glassmorphism border-orange-500/30 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-10 w-10 rounded-full bg-orange-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Burn-to-Evolve</h3>
          <p className="text-gray-400">Sacrifice cards to create more powerful ones</p>
        </div>
        <Badge className="ml-auto bg-orange-600 text-white">Deflationary</Badge>
      </div>
      
      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <h4 className="text-white font-medium">Select Cards to Burn</h4>
            <p className="text-sm text-gray-400">Sacrifice two cards to mint a more powerful one</p>
          </div>
          
          <Tabs defaultValue="your-cards" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="your-cards">Your Cards</TabsTrigger>
              <TabsTrigger value="example">Example</TabsTrigger>
            </TabsList>
            
            <TabsContent value="your-cards" className="mt-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {playerDeck.map((card) => (
                  <div 
                    key={card.id} 
                    onClick={() => handleCardSelect(card)}
                    className={`cursor-pointer transition-all ${selectedCards.some(c => c.id === card.id) ? 
                      'ring-2 ring-orange-500 scale-105' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <GameCard card={card} showDetails={false} />
                    <div className="mt-1 text-center">
                      <span className="text-xs text-gray-400 capitalize">{card.rarity}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4 mt-4">
                {selectedCards.map((card) => (
                  <div key={card.id}>
                    <GameCard card={card} showDetails={false} />
                    <div className="mt-2 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCardSelect(card)}
                        className="text-xs text-red-400 border-red-400/50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                {selectedCards.length === 1 && (
                  <div className="flex items-center">
                    <span className="text-orange-400 text-2xl">+</span>
                    <div className="w-20 h-28 border border-dashed border-orange-500/50 rounded-md flex items-center justify-center">
                      <span className="text-orange-400/70 text-xs">Select one more</span>
                    </div>
                  </div>
                )}
                
                {selectedCards.length === 0 && (
                  <div className="text-center text-orange-400/70 text-sm">
                    Select two cards to burn
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="example" className="mt-4">
              <div className="flex justify-center space-x-6">
                <div>
                  <GameCard card={sampleCard1} showDetails={false} />
                  <div className="mt-2 text-center">
                    <span className="text-sm text-gray-400">Common</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-orange-400 text-2xl">+</span>
                </div>
                
                <div>
                  <GameCard card={sampleCard2} showDetails={false} />
                  <div className="mt-2 text-center">
                    <span className="text-sm text-gray-400">Common</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="bg-black/30 p-4 rounded-lg border border-orange-500/20 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-orange-400 font-bold">
                {selectedCards.length === 2 ? '100%' : '0%'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">New Card Rarity</span>
              <span className={`font-bold ${
                selectedCards.some(c => c.rarity === CardRarity.EPIC) ? 'text-purple-400' : 
                selectedCards.some(c => c.rarity === CardRarity.RARE) ? 'text-blue-400' : 
                'text-gray-400'
              }`}>
                {selectedCards.some(c => c.rarity === CardRarity.EPIC) ? 'Epic' : 
                 selectedCards.some(c => c.rarity === CardRarity.RARE) ? 'Rare' : 
                 'Common'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Burn Transaction Fee</span>
              <span className="text-orange-400 font-bold">5 MONAD</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            onClick={handleBurn}
            disabled={isProcessing || selectedCards.length < 2 || playerMonad < 5}
          >
            {isProcessing ? "Processing..." : 
             selectedCards.length < 2 ? "Select 2 Cards" :
             playerMonad < 5 ? "Need 5 MONAD" :
             "Burn Cards"}
          </Button>
        </>
      )}
      
      {step === 2 && (
        <>
          <div className="text-center mb-6">
            <h4 className="text-white font-medium">Evolution Complete!</h4>
            <p className="text-sm text-gray-400">Your new card has been forged from the flames</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="transform hover:scale-105 transition-all duration-500">
              <GameCard card={evolvedCard} />
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg border border-orange-500/20 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Rarity</span>
              <span className={`font-bold ${
                evolvedCard.rarity === CardRarity.EPIC ? 'text-purple-400' : 
                evolvedCard.rarity === CardRarity.RARE ? 'text-blue-400' : 
                'text-gray-400'
              }`}>
                {evolvedCard.rarity}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Power Increase</span>
              <span className="text-green-400 font-bold">+120%</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Permanent NFT</span>
              <span className="text-orange-400 font-bold">Yes</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            onClick={handleClaim}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Claim New Card"}
          </Button>
        </>
      )}
      
      {step === 3 && (
        <>
          <div className="text-center mb-6">
            <h4 className="text-white font-medium">Evolution Complete!</h4>
            <p className="text-sm text-gray-400">Card added to your collection</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="animate-float">
              <GameCard card={evolvedCard} />
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg border border-orange-500/20 mb-6">
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-green-500/30 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-green-400">Successfully minted on Monad blockchain</span>
            </div>
            <div className="mt-2 text-xs font-mono text-gray-500">
              Transaction: 0xf762d9e7f4a3e6b9b719e5c422f4c2afc580ef59...
            </div>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            onClick={resetBurn}
          >
            Evolve More Cards
          </Button>
        </>
      )}
      
      <div className="mt-4 text-center text-xs text-gray-500">
        Powered by Monad's deflationary NFT mechanics
      </div>
    </Card>
  );
};

export default BurnToEvolve;
