import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity, CardType, CardStatus } from '@/types/game';
import { currentPlayer } from '@/data/gameData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Sparkles, ArrowRight, Check, AlertTriangle, Zap, Shield, Wand2 } from "lucide-react";

const BurnToEvolve: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCards, setSelectedCards] = useState<GameCardType[]>([]);
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [playerMonad, setPlayerMonad] = useState(currentPlayer.monad);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [potentialEvolvedCard, setPotentialEvolvedCard] = useState<GameCardType | null>(null);
  const [showPreviewNotification, setShowPreviewNotification] = useState(false);

  // State for custom card attributes
  const [customCardName, setCustomCardName] = useState<string>("");
  const [customCardDescription, setCustomCardDescription] = useState<string>("");
  const [customCardType, setCustomCardType] = useState<string>("attack");
  const [customAttackPower, setCustomAttackPower] = useState<number>(0);
  const [customDefensePower, setCustomDefensePower] = useState<number>(0);
  const [customManaCost, setCustomManaCost] = useState<number>(0);
  const [customSpecialPower, setCustomSpecialPower] = useState<number>(0);

  // Generate potential evolve results based on selected cards
  const getPotentialResult = (): GameCardType => {
    // Calculate base stats from selected cards
    const totalAttack = selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0);
    const totalDefense = selectedCards.reduce((sum, card) => sum + (card.defense || 0), 0);
    const avgMana = selectedCards.reduce((sum, card) => sum + card.mana, 0) / 2;
    const isRare = selectedCards.some(card => card.rarity === CardRarity.RARE);
    const isEpic = selectedCards.some(card => card.rarity === CardRarity.EPIC);

    // Determine base rarity based on input cards
    let baseRarity = CardRarity.COMMON;
    if (isEpic || (isRare && totalAttack > 10)) {
      baseRarity = CardRarity.EPIC;
    } else if (isRare) {
      baseRarity = CardRarity.RARE;
    }

    // Generate default name if not provided
    const defaultName = baseRarity === CardRarity.EPIC ? "Inferno Leviathan" :
                        baseRarity === CardRarity.RARE ? "Flame Colossus" : "Phoenix Guardian";

    // Use custom values if provided, otherwise use calculated values
    const cardName = customCardName || defaultName;
    const cardDescription = customCardDescription || "Born from the ashes of sacrifice";
    const cardType = customCardType as any || "attack";

    // Calculate attack/defense/mana based on sliders
    // If custom values are 0, use the calculated values
    const attackValue = customAttackPower > 0 ?
      Math.round(totalAttack * (1 + customAttackPower/100)) :
      Math.round(totalAttack * 1.5);

    const defenseValue = customDefensePower > 0 ?
      Math.round(totalDefense * (1 + customDefensePower/100)) :
      Math.round(totalDefense * 1.5) || undefined;

    const manaValue = customManaCost > 0 ?
      Math.round(avgMana * (1 + customManaCost/100)) :
      Math.round(avgMana * 1.2);

    // Base evolved card template
    const baseEvolved: GameCardType = {
      id: `evolved-${Date.now()}`,
      name: cardName,
      description: cardDescription,
      image: "/phoenix-guardian.png",
      rarity: baseRarity,
      type: cardType,
      mana: manaValue,
      attack: attackValue,
      defense: defenseValue,
      special: customSpecialPower > 0 ? customSpecialPower : undefined,
      monadId: `0xEVOLVE${Math.floor(Math.random() * 10000)}`,
      status: CardStatus.ACTIVE,
      evolvedFrom: selectedCards.map(card => card.id),
      onChainMetadata: {
        creator: "0xBurnToEvolve",
        creationBlock: 1420999 + Math.floor(Math.random() * 100),
        evolutionStage: 2,
        battleHistory: []
      }
    };

    // Add special effect for higher rarity cards
    if (baseEvolved.rarity === CardRarity.EPIC) {
      baseEvolved.specialEffect = {
        description: "Inflicts burn damage for 2 turns",
        effectType: "DEBUFF"
      };
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

  // Initialize custom card values when cards are selected
  useEffect(() => {
    if (selectedCards.length === 2) {
      // Calculate base stats from selected cards
      const totalAttack = selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0);
      const totalDefense = selectedCards.reduce((sum, card) => sum + (card.defense || 0), 0);
      const avgMana = selectedCards.reduce((sum, card) => sum + card.mana, 0) / 2;
      const isRare = selectedCards.some(card => card.rarity === CardRarity.RARE);
      const isEpic = selectedCards.some(card => card.rarity === CardRarity.EPIC);

      // Determine default name based on rarity
      let defaultName = "Phoenix Guardian";
      if (isEpic || (isRare && totalAttack > 10)) {
        defaultName = "Inferno Leviathan";
      } else if (isRare) {
        defaultName = "Flame Colossus";
      }

      // Set default values
      setCustomCardName(defaultName);
      setCustomCardDescription("Born from the ashes of sacrifice");
      setCustomCardType("attack");
      setCustomAttackPower(50); // Default 50% boost
      setCustomDefensePower(50); // Default 50% boost
      setCustomManaCost(20); // Default 20% increase
      setCustomSpecialPower(Math.round((totalAttack + totalDefense) / 4)); // Default special power
    }
  }, [selectedCards]);

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
      // Mark the selected cards as burnt instead of removing them
      const updatedDeck = playerDeck.map(card => {
        if (selectedCards.some(c => c.id === card.id)) {
          return {
            ...card,
            status: CardStatus.BURNT,
            evolvedInto: evolvedCard.id
          };
        }
        return card;
      });

      setPlayerDeck(updatedDeck);

      // Also update the global currentPlayer object
      currentPlayer.cards = currentPlayer.cards.map(card => {
        if (selectedCards.some(c => c.id === card.id)) {
          return {
            ...card,
            status: CardStatus.BURNT,
            evolvedInto: evolvedCard.id
          };
        }
        return card;
      });

      toast.success("Cards successfully burnt!", {
        id: "burn-evolve",
        description: "Creating new evolved card..."
      });

      // Deduct MONAD cost
      setPlayerMonad(prev => prev - 5);
      currentPlayer.monad -= 5;

      setTimeout(() => {
        // Add evolved card to player's deck (local state)
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
    <div className="rounded-lg border bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/40 p-8 h-full flex flex-col shadow-xl relative overflow-hidden">
      {/* Animated flame particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full flame-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
              background: `radial-gradient(circle, rgba(255, 150, 0, 0.8) 0%, rgba(255, 100, 0, 0) 70%)`
            }}
          />
        ))}
      </div>

      {/* Transparent violet emoji outlines */}
      <div className="absolute -right-8 -top-8 text-8xl opacity-10 transform rotate-12 pointer-events-none">🔥</div>
      <div className="absolute -left-8 bottom-20 text-7xl opacity-10 transform -rotate-12 pointer-events-none">⚡</div>
      <div className="absolute right-10 bottom-10 text-6xl opacity-10 transform rotate-6 pointer-events-none">✨</div>

      <div className="flex items-center space-x-4 mb-6 relative z-10">
        <div className="h-12 w-12 rounded-md bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white text-shadow-glow-orange">Burn-to-Evolve</h3>
          <p className="text-gray-300 mt-1">Sacrifice cards to create more powerful ones on Monad blockchain</p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-1 text-sm shadow-md shadow-orange-900/30">Deflationary</Badge>
      </div>

      <div className="flex-grow relative z-10">

      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-white">Select Cards to Burn</h4>
            <p className="text-sm text-gray-300 mt-2">Sacrifice two cards to mint a more powerful one</p>
          </div>

          {selectedCards.length === 2 && (
            <div className="mb-6 bg-black/30 p-4 rounded-lg border border-orange-500/30">
              <h3 className="text-lg font-bold text-orange-400 mb-3">Customize Your Evolved Card</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="cardName" className="text-orange-300">Card Name</Label>
                  <Input
                    id="cardName"
                    value={customCardName}
                    onChange={(e) => setCustomCardName(e.target.value)}
                    className="bg-black/50 border-orange-500/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="cardType" className="text-orange-300">Card Type</Label>
                  <Select value={customCardType} onValueChange={setCustomCardType}>
                    <SelectTrigger className="bg-black/50 border-orange-500/30 text-white">
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-orange-500/30">
                      <SelectItem value="attack" className="text-rose-400">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-rose-500" />
                          Attack
                        </div>
                      </SelectItem>
                      <SelectItem value="defense" className="text-cyan-400">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-cyan-500" />
                          Defense
                        </div>
                      </SelectItem>
                      <SelectItem value="utility" className="text-fuchsia-400">
                        <div className="flex items-center">
                          <Wand2 className="h-4 w-4 mr-2 text-fuchsia-500" />
                          Utility
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="cardDescription" className="text-orange-300">Card Description</Label>
                <Textarea
                  id="cardDescription"
                  value={customCardDescription}
                  onChange={(e) => setCustomCardDescription(e.target.value)}
                  className="bg-black/50 border-orange-500/30 text-white h-20"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="attackPower" className="text-rose-400 flex items-center">
                      <Zap className="h-4 w-4 mr-1" /> Attack Power Boost
                    </Label>
                    <span className="text-white text-sm">+{customAttackPower}%</span>
                  </div>
                  <Slider
                    id="attackPower"
                    min={0}
                    max={200}
                    step={5}
                    value={[customAttackPower]}
                    onValueChange={(value) => setCustomAttackPower(value[0])}
                    className="py-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="defensePower" className="text-cyan-400 flex items-center">
                      <Shield className="h-4 w-4 mr-1" /> Defense Power Boost
                    </Label>
                    <span className="text-white text-sm">+{customDefensePower}%</span>
                  </div>
                  <Slider
                    id="defensePower"
                    min={0}
                    max={200}
                    step={5}
                    value={[customDefensePower]}
                    onValueChange={(value) => setCustomDefensePower(value[0])}
                    className="py-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="manaCost" className="text-blue-400 flex items-center">
                      <span className="text-blue-400 mr-1">⚡</span> Mana Cost Adjustment
                    </Label>
                    <span className="text-white text-sm">+{customManaCost}%</span>
                  </div>
                  <Slider
                    id="manaCost"
                    min={-50}
                    max={100}
                    step={5}
                    value={[customManaCost]}
                    onValueChange={(value) => setCustomManaCost(value[0])}
                    className="py-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="specialPower" className="text-purple-400 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" /> Special Ability Power
                    </Label>
                    <span className="text-white text-sm">{customSpecialPower}</span>
                  </div>
                  <Slider
                    id="specialPower"
                    min={0}
                    max={100}
                    step={1}
                    value={[customSpecialPower]}
                    onValueChange={(value) => setCustomSpecialPower(value[0])}
                    className="py-2"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full mb-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12 text-base font-medium shadow-md shadow-orange-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/30 group relative overflow-hidden"
            onClick={openInventoryDialog}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Select Cards from Inventory
            </span>
          </Button>

          {/* Preview notification when two cards are selected */}
          {showPreviewNotification && potentialEvolvedCard && (
            <Alert className="mb-4 bg-gradient-to-br from-black/40 to-orange-950/20 border-orange-500/40 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-full blur-xl"></div>
              </div>
              <AlertTitle className="text-orange-400 font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Evolution Preview
              </AlertTitle>
              <AlertDescription className="text-gray-300">
                <div className="text-sm mb-2 mt-1">
                  Burning these cards will create:
                </div>
                <div className="font-bold text-white text-lg mb-2 flex items-center">
                  <span className="mr-2">{potentialEvolvedCard.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                    New Card
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/30 p-2 rounded border border-orange-500/20 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-gray-300">Rarity: </span>
                    <span className={`ml-auto font-bold ${potentialEvolvedCard.rarity === CardRarity.EPIC ? 'text-purple-400' : potentialEvolvedCard.rarity === CardRarity.RARE ? 'text-blue-400' : 'text-gray-400'}`}>
                      {potentialEvolvedCard.rarity}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-orange-500/20 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-gray-300">Power: </span>
                    <span className="ml-auto text-green-400 font-bold">
                      +{Math.round((potentialEvolvedCard.attack || 0) * 100 / (selectedCards.reduce((sum, card) => sum + (card.attack || 0), 0) || 1) - 100)}%
                    </span>
                  </div>
                </div>
                {potentialEvolvedCard.specialEffect && (
                  <div className="mt-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Special Effect: {potentialEvolvedCard.specialEffect.description}</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-6 mt-6 mb-8">
            {selectedCards.map((card, index) => (
              <div key={card.id} className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg opacity-50 animate-pulse-slow"></div>
                  <div className="relative bg-black rounded-lg p-1 z-10">
                    <GameCard card={card} showDetails={false} />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-red-900/30 z-20">
                    {index + 1}
                  </div>
                  <div className="mt-3 text-center relative z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCardSelect(card)}
                      className="text-xs text-red-400 border-red-400/50 hover:bg-red-950/30 hover:text-red-300 transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {selectedCards.length === 1 && (
              <div className="flex items-center">
                <span className="text-orange-400 text-3xl mx-2 animate-pulse">+</span>
                <div className="relative group cursor-pointer" onClick={openInventoryDialog}>
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="w-[140px] h-[200px] border-2 border-dashed border-orange-500/50 rounded-lg flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500/70 mb-2 group-hover:text-orange-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-orange-400/70 text-sm group-hover:text-orange-300 transition-colors duration-300">Select one more</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCards.length === 0 && (
              <div className="w-full max-w-md bg-gradient-to-br from-orange-950/30 to-red-950/30 p-6 rounded-lg border border-orange-500/30 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-500/70 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h5 className="text-white font-medium mb-2">No Cards Selected</h5>
                <p className="text-orange-300/70 text-sm mb-4">Select two cards to burn and evolve into a more powerful card</p>
                <Button
                  variant="outline"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-950/30"
                  onClick={openInventoryDialog}
                >
                  Open Inventory
                </Button>
              </div>
            )}
          </div>

          {/* Inventory Selection Dialog */}
          <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-950 border-orange-500/40 text-white max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl text-orange-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Select Cards from Inventory
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Choose two cards to burn and evolve into a more powerful card on the Monad blockchain.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-black/30 p-3 rounded-lg border border-orange-500/20 mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-orange-300">Selected: {selectedCards.length}/2 cards</span>
                  <div className="ml-auto flex space-x-1">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${i < selectedCards.length ? 'bg-orange-500' : 'bg-gray-700'} transition-colors duration-300`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-6">
                {playerDeck.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className={`cursor-pointer transition-all duration-300 ${selectedCards.some(c => c.id === card.id) ?
                      'ring-2 ring-orange-500 scale-105 shadow-lg shadow-orange-500/20' :
                      'opacity-80 hover:opacity-100 hover:shadow-md hover:shadow-orange-500/10'}`}
                  >
                    <div className="relative">
                      <GameCard card={card} showDetails={true} />
                      {selectedCards.some(c => c.id === card.id) && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md z-20">
                          {selectedCards.findIndex(c => c.id === card.id) + 1}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 p-2 bg-black/40 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs capitalize font-semibold ${card.rarity === CardRarity.COMMON ? 'text-gray-400' : card.rarity === CardRarity.RARE ? 'text-blue-400' : card.rarity === CardRarity.EPIC ? 'text-purple-400' : 'text-yellow-400'}`}>
                          {card.rarity}
                        </span>
                        <span className="text-xs text-gray-400">
                          Power: <span className="text-white">{card.attack || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-10 px-6 shadow-md shadow-orange-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/30"
                  onClick={() => setShowInventoryDialog(false)}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Selection ({selectedCards.length}/2)
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="bg-gradient-to-br from-black/40 to-orange-950/20 p-5 rounded-lg border border-orange-500/30 mb-6 shadow-md">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Evolution Stats
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-3 rounded-lg border border-orange-500/20 flex flex-col">
                <div className="flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></div>
                  <span className="text-xs text-orange-300 font-medium">Success Rate</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {selectedCards.length === 2 ? '100' : '0'}<span className="text-sm text-orange-400">%</span>
                  </span>
                </div>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-orange-500/20 flex flex-col">
                <div className="flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></div>
                  <span className="text-xs text-orange-300 font-medium">New Card Rarity</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-xl font-bold ${
                    selectedCards.some(c => c.rarity === CardRarity.EPIC) ? 'text-purple-400' :
                    selectedCards.some(c => c.rarity === CardRarity.RARE) ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {selectedCards.some(c => c.rarity === CardRarity.EPIC) ? 'Epic' :
                     selectedCards.some(c => c.rarity === CardRarity.RARE) ? 'Rare' :
                     'Common'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 bg-orange-900/20 p-3 rounded-lg border border-orange-500/30 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="flex-1">
                <div className="text-sm text-orange-300 font-medium">Burn Transaction Fee</div>
                <div className="text-xs text-gray-400">Paid to Monad blockchain for evolution</div>
              </div>
              <span className="text-xl font-bold text-orange-400">5 <span className="text-sm">MONAD</span></span>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-14 text-lg font-bold shadow-md shadow-orange-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/30 group relative overflow-hidden"
            onClick={handleBurn}
            disabled={isProcessing || selectedCards.length < 2 || playerMonad < 5}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center">
              {isProcessing ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing on Monad...</span>
                </>
              ) : selectedCards.length < 2 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select 2 Cards
                </>
              ) : playerMonad < 5 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Need 5 MONAD
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                  Burn Cards & Evolve
                </>
              )}
            </span>
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

      </div>
      <div className="mt-4 text-center text-xs text-gray-500 relative z-10">
        Powered by Monad's deflationary NFT mechanics
      </div>
    </div>
  );
};

export default BurnToEvolve;
