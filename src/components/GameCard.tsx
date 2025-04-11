
import React from 'react';
import { Card as CardComponent } from "@/components/ui/card";
import { Card as GameCardType, CardRarity, CardType } from "@/types/game";
import { cn } from "@/lib/utils";
import { generateCardImage } from '@/utils/placeholderImages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GameCardProps {
  card: GameCardType;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ card, onClick, className, showDetails = true }) => {
  const rarityStyles: Record<CardRarity, string> = {
    [CardRarity.COMMON]: "border-gray-400 bg-gradient-to-br from-gray-700 to-gray-800",
    [CardRarity.RARE]: "border-blue-400 bg-gradient-to-br from-blue-700 to-indigo-800 card-rare",
    [CardRarity.EPIC]: "border-purple-400 bg-gradient-to-br from-purple-700 to-pink-800 card-epic",
    [CardRarity.LEGENDARY]: "border-yellow-400 bg-gradient-to-br from-yellow-500 to-orange-600 card-legendary"
  };

  const typeIcons: Record<CardType, React.ReactNode> = {
    [CardType.ATTACK]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    ),
    [CardType.DEFENSE]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
      </svg>
    ),
    [CardType.UTILITY]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    )
  };

  // Use our placeholder image generator
  const imageUrl = card.image.startsWith('/') 
    ? generateCardImage(card.name, card.type, card.rarity)
    : card.image;

  // Calculate win rate from battle history
  const calculateWinRate = () => {
    if (!card.onChainMetadata?.battleHistory || card.onChainMetadata.battleHistory.length === 0) {
      return "No battles";
    }
    
    const wins = card.onChainMetadata.battleHistory.filter(result => result === 1).length;
    const total = card.onChainMetadata.battleHistory.length;
    return `${Math.round((wins / total) * 100)}% (${wins}/${total})`;
  };

  return (
    <CardComponent 
      className={cn(
        "relative overflow-hidden w-56 h-80 transition-all duration-300 cursor-pointer card-hover",
        rarityStyles[card.rarity],
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0.5 bg-black rounded-sm z-0" />
      
      <div className="relative z-10 h-full flex flex-col p-3">
        {/* Card Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold text-white truncate">{card.name}</div>
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm">
            {typeIcons[card.type]}
          </div>
        </div>
        
        {/* Card Image */}
        <div className="flex-1 relative overflow-hidden rounded-sm mb-2">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Monad Blockchain Badge */}
          <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5 text-[8px] text-emerald-400 font-mono">
            MONAD
          </div>
        </div>
        
        {/* Card Details */}
        {showDetails && (
          <>
            <div className="text-xs text-gray-300 mb-2 h-12 overflow-hidden">
              {card.description}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-blue-300">Mana:</span>
                <span className="text-sm font-semibold text-blue-400">{card.mana}</span>
              </div>
              
              {card.attack && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-red-300">ATK:</span>
                  <span className="text-sm font-semibold text-red-400">{card.attack}</span>
                </div>
              )}
              
              {card.defense && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-green-300">DEF:</span>
                  <span className="text-sm font-semibold text-green-400">{card.defense}</span>
                </div>
              )}
            </div>
            
            {/* Monad Blockchain Data */}
            <div className="mt-2 pt-2 border-t border-white/10 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="font-mono truncate">{card.monadId}</span>
                      <div className="h-3 w-3 bg-emerald-500/30 rounded-full flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/80 border-emerald-500/50">
                    <div className="text-xs font-mono text-emerald-400">
                      <div>Created at block: {card.onChainMetadata?.creationBlock || 'Unknown'}</div>
                      <div>Evolution: Stage {card.onChainMetadata?.evolutionStage || 1}</div>
                      <div>Win rate: {calculateWinRate()}</div>
                      <div>Creator: {card.onChainMetadata?.creator || 'Unknown'}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>
    </CardComponent>
  );
};

export default GameCard;
