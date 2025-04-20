import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card as UICard } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Zap, Flame, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import GameCard from './GameCard';
import { MonadGameService } from '../services/MonadGameService';
import { getTransactionExplorerUrl } from '../utils/explorer';

interface CardFusionManagerProps {
  playerCards: any[];
  monadGameService: MonadGameService;
  onFusionComplete: () => void;
}

const CardFusionManager: React.FC<CardFusionManagerProps> = ({
  playerCards,
  monadGameService,
  onFusionComplete
}) => {
  const [activeTab, setActiveTab] = useState('evolution');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eligibleCards, setEligibleCards] = useState<any[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  
  // Filter cards eligible for evolution
  useEffect(() => {
    const filterEligibleCards = () => {
      if (activeTab === 'evolution') {
        // Cards eligible for evolution have battleCount >= 5 and are not at max level
        return playerCards.filter(card => 
          card.isActive && 
          card.evolutionLevel < 5 && 
          card.battleCount >= 5
        );
      } else {
        // All active cards are eligible for fusion
        return playerCards.filter(card => card.isActive);
      }
    };
    
    setEligibleCards(filterEligibleCards());
  }, [activeTab, playerCards]);
  
  const handleCardSelect = (card: any) => {
    if (activeTab === 'evolution') {
      // For evolution, only select one card at a time
      setSelectedCards([card]);
    } else {
      // For fusion, can select up to 2 cards
      if (selectedCards.includes(card)) {
        setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      } else if (selectedCards.length < 2) {
        setSelectedCards([...selectedCards, card]);
      } else {
        toast.error("You can only select 2 cards for fusion");
      }
    }
  };
  
  const handleEvolution = async () => {
    if (selectedCards.length === 0) {
      toast.error("Please select a card to evolve");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const toastId = "evolution-toast";
      toast.loading("Processing card evolution on Monad blockchain...", { id: toastId });
      
      if (batchMode && eligibleCards.length > 1) {
        // Batch evolution
        const cardIds = eligibleCards.map(card => card.id);
        const result = await monadGameService.batchEvolveCards(cardIds);
        
        toast.success(`Successfully evolved ${cardIds.length} cards!`, {
          id: toastId,
          description: `Transaction confirmed in block #${result.blockNumber}`
        });
        
        // Add a button to view the transaction in the explorer
        const explorerUrl = getTransactionExplorerUrl(result.txHash);
        toast.success(
          <div className="flex flex-col space-y-2">
            <span>View evolution on MONAD Explorer</span>
            <button
              onClick={() => window.open(explorerUrl, '_blank')}
              className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 py-1 px-2 rounded flex items-center justify-center"
            >
              <Zap className="h-3 w-3 mr-1" />
              Open Explorer
            </button>
          </div>,
          {
            duration: 5000,
          }
        );
      } else {
        // Single card evolution
        const card = selectedCards[0];
        const result = await monadGameService.evolveCard(card.id);
        
        toast.success(`Successfully evolved ${card.name}!`, {
          id: toastId,
          description: `Transaction confirmed in block #${result.blockNumber}`
        });
        
        // Add a button to view the transaction in the explorer
        const explorerUrl = getTransactionExplorerUrl(result.txHash);
        toast.success(
          <div className="flex flex-col space-y-2">
            <span>View evolution on MONAD Explorer</span>
            <button
              onClick={() => window.open(explorerUrl, '_blank')}
              className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 py-1 px-2 rounded flex items-center justify-center"
            >
              <Zap className="h-3 w-3 mr-1" />
              Open Explorer
            </button>
          </div>,
          {
            duration: 5000,
          }
        );
      }
      
      // Reset selection and notify parent
      setSelectedCards([]);
      onFusionComplete();
    } catch (error) {
      console.error("Evolution failed:", error);
      toast.error("Failed to evolve card", {
        description: error.message || "Transaction failed. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFusion = async () => {
    if (selectedCards.length !== 2) {
      toast.error("Please select exactly 2 cards for fusion");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const toastId = "fusion-toast";
      toast.loading("Processing card fusion on Monad blockchain...", { id: toastId });
      
      const card1 = selectedCards[0];
      const card2 = selectedCards[1];
      
      const result = await monadGameService.composeCards(card1.id, card2.id);
      
      toast.success(`Successfully fused cards into a new card!`, {
        id: toastId,
        description: `Transaction confirmed in block #${result.blockNumber}`
      });
      
      // Add a button to view the transaction in the explorer
      const explorerUrl = getTransactionExplorerUrl(result.txHash);
      toast.success(
        <div className="flex flex-col space-y-2">
          <span>View fusion on MONAD Explorer</span>
          <button
            onClick={() => window.open(explorerUrl, '_blank')}
            className="text-xs bg-amber-900/50 hover:bg-amber-800/50 text-amber-400 py-1 px-2 rounded flex items-center justify-center"
          >
            <Flame className="h-3 w-3 mr-1" />
            Open Explorer
          </button>
        </div>,
        {
          duration: 5000,
        }
      );
      
      // Reset selection and notify parent
      setSelectedCards([]);
      onFusionComplete();
    } catch (error) {
      console.error("Fusion failed:", error);
      toast.error("Failed to fuse cards", {
        description: error.message || "Transaction failed. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getEvolutionRequirements = (card: any) => {
    if (!card) return null;
    
    const level = card.evolutionLevel;
    
    if (level === 0) {
      return { battles: 5, wins: 0, shards: 5 };
    } else if (level === 1) {
      return { battles: 15, wins: 5, shards: 10 };
    } else if (level === 2) {
      return { battles: 30, wins: 15, shards: 15 };
    } else if (level === 3) {
      return { battles: 50, wins: 25, shards: 20 };
    } else if (level === 4) {
      return { battles: 100, wins: 50, shards: 25 };
    }
    
    return null;
  };
  
  const isCardEligibleForEvolution = (card: any) => {
    if (!card || card.evolutionLevel >= 5) return false;
    
    const requirements = getEvolutionRequirements(card);
    if (!requirements) return false;
    
    return (
      card.battleCount >= requirements.battles &&
      card.winCount >= requirements.wins
    );
  };
  
  const renderEvolutionTab = () => {
    const selectedCard = selectedCards[0];
    const requirements = selectedCard ? getEvolutionRequirements(selectedCard) : null;
    const isEligible = selectedCard ? isCardEligibleForEvolution(selectedCard) : false;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Card Evolution</h3>
          
          {eligibleCards.length > 1 && (
            <Button
              variant={batchMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBatchMode(!batchMode)}
              className={batchMode ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {batchMode ? "Batch Mode: ON" : "Batch Mode: OFF"}
            </Button>
          )}
        </div>
        
        <div className="bg-black/30 rounded-md p-4 border border-emerald-500/20">
          <p className="text-sm text-gray-300 mb-4">
            Evolve your cards to increase their power. Each evolution level requires the card to have participated in a certain number of battles and won a specific number of times.
          </p>
          
          {batchMode ? (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Batch Evolution</h4>
              <p className="text-xs text-gray-300 mb-2">
                Evolve multiple cards at once. This is more efficient on the Monad blockchain.
              </p>
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-md p-2 mb-2">
                <p className="text-xs text-emerald-300">
                  {eligibleCards.length} cards eligible for evolution
                </p>
              </div>
              
              <Button
                onClick={handleEvolution}
                disabled={isProcessing || eligibleCards.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Evolve All Eligible Cards
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Select a Card to Evolve</h4>
                  <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto p-2 bg-black/40 rounded-md">
                    {eligibleCards.length > 0 ? (
                      eligibleCards.map(card => (
                        <div
                          key={card.id}
                          onClick={() => handleCardSelect(card)}
                          className={`cursor-pointer transform transition-all ${
                            selectedCards.includes(card)
                              ? 'scale-105 ring-2 ring-emerald-500 rounded-lg'
                              : 'hover:scale-105'
                          }`}
                        >
                          <GameCard card={card} showDetails={false} />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No eligible cards</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Evolution Preview</h4>
                  <div className="bg-black/40 rounded-md p-3 h-64 flex flex-col">
                    {selectedCard ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-300">Current Level:</span>
                          <span className="text-xs text-emerald-400">{selectedCard.evolutionLevel}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-300">New Level:</span>
                          <span className="text-xs text-emerald-400">{selectedCard.evolutionLevel + 1}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-300">Battle Count:</span>
                          <span className={`text-xs ${selectedCard.battleCount >= requirements?.battles ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedCard.battleCount} / {requirements?.battles}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-300">Win Count:</span>
                          <span className={`text-xs ${selectedCard.winCount >= requirements?.wins ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedCard.winCount} / {requirements?.wins}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs text-gray-300">Shard Cost:</span>
                          <span className="text-xs text-amber-400">{requirements?.shards} Shards</span>
                        </div>
                        
                        <div className="mt-auto">
                          {isEligible ? (
                            <Button
                              onClick={handleEvolution}
                              disabled={isProcessing}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Evolve Card
                            </Button>
                          ) : (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-2 text-center">
                              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                              <p className="text-xs text-red-400">
                                Card does not meet evolution requirements
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">Select a card to see evolution details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  const renderFusionTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Card Fusion</h3>
        
        <div className="bg-black/30 rounded-md p-4 border border-amber-500/20">
          <p className="text-sm text-gray-300 mb-4">
            Fuse two cards together to create a more powerful card. The new card will inherit properties from both parent cards and may have increased rarity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-2">Select Cards to Fuse (2)</h4>
              <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto p-2 bg-black/40 rounded-md">
                {eligibleCards.length > 0 ? (
                  eligibleCards.map(card => (
                    <div
                      key={card.id}
                      onClick={() => handleCardSelect(card)}
                      className={`cursor-pointer transform transition-all ${
                        selectedCards.includes(card)
                          ? 'scale-105 ring-2 ring-amber-500 rounded-lg'
                          : 'hover:scale-105'
                      }`}
                    >
                      <GameCard card={card} showDetails={false} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm">No eligible cards</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-2">Fusion Preview</h4>
              <div className="bg-black/40 rounded-md p-3 h-64 flex flex-col">
                {selectedCards.length === 2 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1 text-center">Card 1</p>
                        <div className="transform scale-75 origin-top-left ml-2">
                          <GameCard card={selectedCards[0]} showDetails={false} />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-amber-500" />
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400 mb-1 text-center">Card 2</p>
                        <div className="transform scale-75 origin-top-left ml-2">
                          <GameCard card={selectedCards[1]} showDetails={false} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-md p-2 mb-4">
                      <p className="text-xs text-amber-400 text-center">
                        Fusion will create a new card with combined properties.
                        The original cards will be consumed in the process.
                      </p>
                    </div>
                    
                    <div className="mt-auto">
                      <Button
                        onClick={handleFusion}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Flame className="w-4 h-4 mr-2" />
                        Fuse Cards
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm">
                      {selectedCards.length === 0
                        ? "Select 2 cards to fuse"
                        : "Select 1 more card to fuse"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <UICard className="glassmorphism border-emerald-500/30">
      <div className="p-6">
        <Tabs defaultValue="evolution" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="evolution" className="data-[state=active]:bg-emerald-900/50 data-[state=active]:text-emerald-400">
              <Zap className="w-4 h-4 mr-2" />
              Evolution
            </TabsTrigger>
            <TabsTrigger value="fusion" className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-400">
              <Flame className="w-4 h-4 mr-2" />
              Fusion
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="evolution">
            {renderEvolutionTab()}
          </TabsContent>
          
          <TabsContent value="fusion">
            {renderFusionTab()}
          </TabsContent>
        </Tabs>
      </div>
    </UICard>
  );
};

export default CardFusionManager;
