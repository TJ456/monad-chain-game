
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity } from '@/types/game';
import { currentPlayer } from '@/data/gameData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BurnToEvolve: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCards, setSelectedCards] = useState<GameCardType[]>([]);
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [playerMonad, setPlayerMonad] = useState(currentPlayer.monad);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [potentialEvolvedCard, setPotentialEvolvedCard] = useState<GameCardType | null>(null);
  const [showPreviewNotification, setShowPreviewNotification] = useState(false);

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

  // Initialize component with latest data from localStorage if available
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem('playerCards');
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        // Update local state if localStorage has different cards than currentPlayer
        if (JSON.stringify(parsedCards) !== JSON.stringify(currentPlayer.cards)) {
          currentPlayer.cards = parsedCards;
          setPlayerDeck([...parsedCards]);
        }
      }

      const savedMonad = localStorage.getItem('playerMonad');
      if (savedMonad) {
        const parsedMonad = parseInt(savedMonad, 10);
        if (!isNaN(parsedMonad) && parsedMonad !== currentPlayer.monad) {
          currentPlayer.monad = parsedMonad;
          setPlayerMonad(parsedMonad);
        }
      }

      // We'll show the notification about minimum card requirement only when needed during card selection
    } catch (error) {
      console.error('Error loading saved player data:', error);
    }
  }, []);

  // Update potential evolved card whenever selected cards change
  useEffect(() => {
    if (selectedCards.length === 2) {
      setPotentialEvolvedCard(getPotentialResult());
      setShowPreviewNotification(true);
    } else {
      setPotentialEvolvedCard(null);
      setShowPreviewNotification(false);
    }
  }, [selectedCards]);

  const handleCardSelect = (card: GameCardType) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 2) {
      // Check if burning this card would leave the player with fewer than 3 cards
      const remainingCardsCount = playerDeck.length - selectedCards.length - 1;

      if (remainingCardsCount < 3) {
        toast.warning("You must keep at least 3 cards in your inventory to play the game");
        return;
      }

      setSelectedCards([...selectedCards, card]);
    } else {
      toast.warning("You can only select 2 cards to burn");
    }
  };

  const openInventoryDialog = () => {
    setShowInventoryDialog(true);

    // Show the burn-to-evolve notification only when the user is actively trying to select cards
    if (currentPlayer.cards.length <= 5) {
      toast.info(
        "You need at least 3 cards to play the game",
        {
          description: "Burning cards will transform them into a more powerful card, but make sure to keep at least 3 cards in your inventory.",
          duration: 5000
        }
      );
    }
  };

  const handleBurn = () => {
    if (selectedCards.length < 2) {
      toast.error("Select 2 cards to burn");
      return;
    }

    // Double-check that burning these cards won't leave the player with fewer than 3 cards
    const remainingCardsCount = playerDeck.length - selectedCards.length;
    if (remainingCardsCount < 3) {
      toast.error("You must keep at least 3 cards in your inventory to play the game");
      return;
    }

    setIsProcessing(true);

    // Store the evolved card before burning
    const evolvedCard = getPotentialResult();

    toast.loading("Burning cards on Monad blockchain...", {
      id: "burn-evolve"
    });

    setTimeout(() => {
      toast.success("Cards burned successfully!", {
        id: "burn-evolve",
        description: "Creating new evolved card..."
      });

      // Remove selected cards from deck (local state)
      const updatedDeck = playerDeck.filter(card =>
        !selectedCards.some(selected => selected.id === card.id)
      );
      setPlayerDeck(updatedDeck);

      // Also update the global currentPlayer object
      currentPlayer.cards = currentPlayer.cards.filter(card =>
        !selectedCards.some(selected => selected.id === card.id)
      );

      // Deduct MONAD cost
      setPlayerMonad(prev => prev - 5);
      currentPlayer.monad -= 5;

      setTimeout(() => {
        // Add evolved card directly to player's deck (local state)
        const newDeck = [...updatedDeck, evolvedCard];
        setPlayerDeck(newDeck);

        // Also update the global currentPlayer object
        currentPlayer.cards.push(evolvedCard);

        // Save to localStorage for persistence
        try {
          localStorage.setItem('playerCards', JSON.stringify(currentPlayer.cards));
        } catch (error) {
          console.error('Failed to save cards to localStorage:', error);
        }

        setStep(2);
        setIsProcessing(false);
      }, 1000);
    }, 2000);
  };

  const handleClaim = () => {
    setIsProcessing(true);

    toast.loading("Finalizing card on Monad blockchain...", {
      id: "claim-evolve"
    });

    setTimeout(() => {
      // Ensure the card is permanently saved to localStorage
      try {
        localStorage.setItem('playerCards', JSON.stringify(currentPlayer.cards));
        localStorage.setItem('playerMonad', currentPlayer.monad.toString());
      } catch (error) {
        console.error('Failed to save player data to localStorage:', error);
      }

      toast.success("New card finalized!", {
        id: "claim-evolve",
        description: `Card permanently added to your collection`
      });

      setStep(3);
      setIsProcessing(false);
    }, 2000);
  };

  const resetBurn = () => {
    setSelectedCards([]);
    // Refresh player deck from the global state to ensure we have the latest data
    setPlayerDeck([...currentPlayer.cards]);
    setPlayerMonad(currentPlayer.monad);
    setStep(1);
  };



  const evolvedCard = getPotentialResult();

  return (
    <Card className="glassmorphism border-orange-500/30 p-6 relative">
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

          <Button
            className="w-full mb-4 bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={openInventoryDialog}
          >
            Select Cards from Inventory
          </Button>

          {/* Preview notification when two cards are selected */}
          {showPreviewNotification && potentialEvolvedCard && (
            <Alert className="mb-4 bg-black/30 border-orange-500/30">
              <AlertTitle className="text-orange-400">Evolution Preview</AlertTitle>
              <AlertDescription className="text-gray-300">
                <div className="text-sm mb-2">
                  Burning these cards will create:
                </div>
                <div className="font-bold text-white mb-1">{potentialEvolvedCard.name}</div>
                <div className="flex justify-between text-xs">
                  <span>Rarity: <span className={`font-bold ${potentialEvolvedCard.rarity === CardRarity.EPIC ? 'text-purple-400' : potentialEvolvedCard.rarity === CardRarity.RARE ? 'text-blue-400' : 'text-gray-400'}`}>{potentialEvolvedCard.rarity}</span></span>
                  <span>Power: <span className="text-green-400 font-bold">+{Math.round((potentialEvolvedCard.attack || 0) * 100 / (selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0) || 1) - 100)}%</span></span>
                </div>
                {potentialEvolvedCard.specialEffect && (
                  <div className="mt-1 text-xs text-purple-400">
                    Special: {potentialEvolvedCard.specialEffect.description}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-4 mt-4 mb-6">
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

          {/* Inventory Selection Dialog */}
          <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
            <DialogContent className="bg-gray-900 border-orange-500/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl text-orange-400">Select Cards from Inventory</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Choose two cards to burn and evolve into a more powerful card.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4 my-6">
                {playerDeck.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className={`cursor-pointer transition-all ${selectedCards.some(c => c.id === card.id) ?
                      'ring-2 ring-orange-500 scale-105' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <GameCard card={card} showDetails={true} />
                    <div className="mt-1 text-center">
                      <span className={`text-xs capitalize font-semibold ${card.rarity === CardRarity.COMMON ? 'text-gray-400' : card.rarity === CardRarity.RARE ? 'text-blue-400' : card.rarity === CardRarity.EPIC ? 'text-purple-400' : 'text-yellow-400'}`}>
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  className="bg-gradient-to-r from-orange-600 to-red-600"
                  onClick={() => setShowInventoryDialog(false)}
                >
                  Confirm Selection ({selectedCards.length}/2)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              <GameCard card={potentialEvolvedCard || getPotentialResult()} />
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg border border-orange-500/20 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Rarity</span>
              <span className={`font-bold ${
                (potentialEvolvedCard?.rarity || evolvedCard.rarity) === CardRarity.EPIC ? 'text-purple-400' :
                (potentialEvolvedCard?.rarity || evolvedCard.rarity) === CardRarity.RARE ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {potentialEvolvedCard?.rarity || evolvedCard.rarity}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Power Increase</span>
              <span className="text-green-400 font-bold">+{Math.round((potentialEvolvedCard?.attack || evolvedCard.attack || 0) * 100 / (selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0) || 1) - 100)}%</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Permanent NFT</span>
              <span className="text-orange-400 font-bold">Yes</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Added to Inventory</span>
              <span className="text-green-400 font-bold">✓ Complete</span>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            onClick={handleClaim}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Finalize Card"}
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
              <GameCard card={potentialEvolvedCard || getPotentialResult()} />
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
            <div className="mt-2 flex items-center">
              <div className="h-4 w-4 rounded-full bg-blue-500/30 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-blue-400">Card has been added to your inventory</span>
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
