
import React from 'react';
import { Card as CardComponent } from "@/components/ui/card";
import { Card as GameCardType, CardRarity, CardType } from "@/types/game";
import { cn } from "@/lib/utils";
import { generateCardImage } from '@/utils/placeholderImages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from 'lucide-react';

interface GameCardProps {
  card: GameCardType;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ card, onClick, className, showDetails = true }) => {
  const rarityStyles: Record<CardRarity, string> = {
    [CardRarity.COMMON]: "border-gray-400 bg-gradient-to-br from-gray-700 to-gray-800 shadow-md shadow-gray-700/30",
    [CardRarity.RARE]: "border-blue-400 bg-gradient-to-br from-blue-700 to-indigo-800 card-rare shadow-md shadow-blue-700/30",
    [CardRarity.EPIC]: "border-purple-400 bg-gradient-to-br from-purple-700 to-pink-800 card-epic shadow-md shadow-purple-700/30",
    [CardRarity.LEGENDARY]: "border-yellow-400 bg-gradient-to-br from-yellow-500 to-orange-600 card-legendary shadow-lg shadow-orange-500/30"
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
        "relative overflow-hidden w-56 h-80 transition-all duration-300 cursor-pointer card-hover border-2",
        rarityStyles[card.rarity],
        card.boosted ? "ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/20" : "",
        className
      )}
      onClick={onClick}
    >
      {card.boosted && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400/20 to-purple-500/20 animate-pulse rounded-lg z-0"></div>
      )}
      <div className="absolute inset-0.5 bg-gradient-to-b from-black to-gray-900 rounded-sm z-0" />

      <div className="relative z-10 h-full flex flex-col p-3">
        {/* Card Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className="text-lg font-bold text-white truncate">{card.name}</div>
            {card.boosted && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="ml-1 flex items-center justify-center h-4 w-4 rounded-full bg-yellow-500/30">
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/80 border-yellow-500/50">
                    <div className="text-xs">
                      <span className="text-yellow-400 font-bold">MONAD Boosted</span>
                      <div className="text-gray-300 mt-1">This card's power has been amplified by MONAD tokens</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm">
            {typeIcons[card.type]}
          </div>
        </div>

        {/* Card Image */}
        <div className="flex-1 relative overflow-hidden rounded-sm mb-2 ring-1 ring-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center transform hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Card Frame Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
          {/* Monad Blockchain Badge */}
          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[8px] text-emerald-400 font-mono border border-emerald-500/20">
            MONAD
          </div>
          {/* Rarity Indicator */}
          <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center space-x-1">
            {[...Array(card.rarity === CardRarity.LEGENDARY ? 3 : card.rarity === CardRarity.EPIC ? 2 : card.rarity === CardRarity.RARE ? 1 : 0)].map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${card.rarity === CardRarity.LEGENDARY ? 'bg-yellow-400' : card.rarity === CardRarity.EPIC ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
            ))}
          </div>
        </div>

        {/* Card Details */}
        {showDetails && (
          <>
            <div className="text-xs text-gray-300 mb-2 h-12 overflow-hidden bg-black/30 p-2 rounded border border-white/5">
              {card.description}
            </div>

            <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/5">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-blue-300">Mana:</span>
                <span className="text-sm font-semibold text-blue-400">{card.mana}</span>
              </div>

              {card.attack && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-red-300">ATK:</span>
                  <span className="text-sm font-semibold text-red-400">
                    {card.attack}
                    {card.boosted && card.originalAttack && (
                      <span className="text-green-400 text-xs ml-1">+{card.attack - card.originalAttack}</span>
                    )}
                  </span>
                  {card.boosted && <Sparkles className="h-3 w-3 text-yellow-400 ml-1 animate-pulse" />}
                </div>
              )}

              {card.defense && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-green-300">DEF:</span>
                  <span className="text-sm font-semibold text-green-400">
                    {card.defense}
                    {card.boosted && card.originalDefense && (
                      <span className="text-green-400 text-xs ml-1">+{card.defense - card.originalDefense}</span>
                    )}
                  </span>
                  {card.boosted && <Sparkles className="h-3 w-3 text-yellow-400 ml-1 animate-pulse" />}
                </div>
              )}
            </div>

            {/* Monad Blockchain Data */}
            <div className="mt-2 pt-2 border-t border-white/10 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between text-emerald-400 bg-black/40 p-1.5 rounded border border-emerald-500/20 backdrop-blur-sm">
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
