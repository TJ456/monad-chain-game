import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import GameCard from '@/components/GameCard';
import { Card as GameCardType } from '@/types/game';
import { Package, Check, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface PlayerInventoryProps {
  playerCards: GameCardType[];
  onClose: () => void;
  onSelectCards?: (selectedCards: GameCardType[]) => void;
  maxSelectable?: number;
  selectionMode?: boolean;
}

const PlayerInventory: React.FC<PlayerInventoryProps> = ({
  playerCards,
  onClose,
  onSelectCards,
  maxSelectable = 3,
  selectionMode = false
}) => {
  const [selectedCards, setSelectedCards] = useState<GameCardType[]>([]);

  const toggleCardSelection = (card: GameCardType) => {
    if (!selectionMode) return;

    const isSelected = selectedCards.some(c => c.id === card.id);

    if (isSelected) {
      // Remove card from selection
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      // Add card to selection if under max limit
      if (selectedCards.length < maxSelectable) {
        setSelectedCards([...selectedCards, card]);
      } else {
        // Show error toast or message that max cards are selected
      }
    }
  };

  const handleConfirmSelection = () => {
    if (onSelectCards && selectedCards.length > 0) {
      onSelectCards(selectedCards);
    }
    onClose();
  };

  return (
    <Card className="glassmorphism border-emerald-500/30 w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-emerald-400" />
            <span className="text-white">My Card Collection</span>
          </CardTitle>
          {selectionMode && (
            <Badge className="bg-emerald-500/20 text-emerald-400 px-3 py-1">
              Select {maxSelectable} Cards for Battle
            </Badge>
          )}
        </div>
        <CardDescription>
          {selectionMode
            ? `Selected ${selectedCards.length}/${maxSelectable} cards for your battle deck`
            : "Manage your MONAD blockchain cards"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {playerCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playerCards.map((card) => {
                const isSelected = selectedCards.some(c => c.id === card.id);
                return (
                  <div
                    key={card.id}
                    className={`relative transform hover:-translate-y-2 transition-transform ${selectionMode ? 'cursor-pointer' : ''}`}
                    onClick={() => toggleCardSelection(card)}
                  >
                    {selectionMode && isSelected && (
                      <div className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={isSelected ? 'ring-2 ring-emerald-500 rounded-lg' : ''}>
                      <GameCard card={card} showDetails={true} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Cards Yet</h3>
              <p className="text-sm text-gray-400 text-center max-w-sm">
                Your collection is empty. Win battles to earn shards and redeem them for new cards!
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        {selectionMode ? (
          <div className="w-full flex space-x-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500"
              onClick={handleConfirmSelection}
              disabled={selectedCards.length === 0}
            >
              {selectedCards.length === 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Select Cards
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Selection ({selectedCards.length}/{maxSelectable})
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button className="w-full bg-gradient-to-r from-emerald-400 to-teal-500" onClick={onClose}>
            Return to Game Room
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlayerInventory;
