
import React, { useState } from 'react';
import { Card as CardComponent } from "@/components/ui/card";
import { Card as GameCardType, CardRarity, CardType } from "@/types/game";
import { cn } from "@/lib/utils";
import { generateCardImage } from '@/utils/placeholderImages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Zap, Shield, Wand2, Flame, ArrowRight } from 'lucide-react';
import ManaCost from '@/components/ui/mana-cost';

interface GameCardProps {
  card: GameCardType;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ card, onClick, className, showDetails = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  // New rarity styles with hexagonal/geometric theme
  const rarityStyles: Record<CardRarity, string> = {
    [CardRarity.COMMON]: "border-slate-400 bg-slate-900 shadow-md",
    [CardRarity.RARE]: "border-cyan-400 bg-slate-900 shadow-md",
    [CardRarity.EPIC]: "border-fuchsia-400 bg-slate-900 shadow-md",
    [CardRarity.LEGENDARY]: "border-amber-400 bg-slate-900 shadow-lg"
  };

  // New rarity background effects
  const rarityBackgrounds: Record<CardRarity, string> = {
    [CardRarity.COMMON]: "bg-gradient-to-br from-slate-800 to-slate-900",
    [CardRarity.RARE]: "bg-gradient-to-br from-cyan-900/30 to-slate-900",
    [CardRarity.EPIC]: "bg-gradient-to-br from-fuchsia-900/30 to-slate-900",
    [CardRarity.LEGENDARY]: "bg-gradient-to-br from-amber-900/30 to-slate-900"
  };

  // New rarity glow effects
  const rarityGlows: Record<CardRarity, string> = {
    [CardRarity.COMMON]: "shadow-none",
    [CardRarity.RARE]: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    [CardRarity.EPIC]: "shadow-[0_0_15px_rgba(192,38,211,0.3)]",
    [CardRarity.LEGENDARY]: "shadow-[0_0_20px_rgba(245,158,11,0.4)]"
  };

  // New type icons using Lucide icons
  const typeIcons: Record<CardType, React.ReactNode> = {
    [CardType.ATTACK]: <Zap className="h-5 w-5 text-rose-500" />,
    [CardType.DEFENSE]: <Shield className="h-5 w-5 text-cyan-500" />,
    [CardType.UTILITY]: <Wand2 className="h-5 w-5 text-fuchsia-500" />
  };

  // Type colors for various UI elements
  const typeColors: Record<CardType, string> = {
    [CardType.ATTACK]: "text-rose-500 border-rose-500/30",
    [CardType.DEFENSE]: "text-cyan-500 border-cyan-500/30",
    [CardType.UTILITY]: "text-fuchsia-500 border-fuchsia-500/30"
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
    <div
      className={cn(
        "relative w-56 h-80 perspective-1000 transition-all duration-300 cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Rectangular card container with beveled corners */}
      <div
        className={cn(
          "absolute inset-0 transform-gpu transition-all duration-500 rounded-lg",
          isHovered ? "scale-105" : "",
          rarityGlows[card.rarity],
          card.rarity === CardRarity.LEGENDARY ? "card-rarity-legendary" : ""
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isHovered ? "rotateY(5deg) rotateX(-5deg)" : "rotateY(0) rotateX(0)"
        }}
      >
        {/* Card background with rarity-based styling */}
        <div className={cn(
          "absolute inset-0 border-2",
          rarityStyles[card.rarity],
          card.boosted ? "ring-1 ring-amber-400/50" : ""
        )}>
          {/* Holographic effect */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-gradient-to-br from-transparent via-white to-transparent"
               style={{
                 backgroundSize: "200% 200%",
                 animation: "holographic 3s ease infinite",
                 backgroundPosition: isHovered ? "right bottom" : "left top"
               }}></div>

          {/* Circuit pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('/circuit-pattern.svg')] bg-repeat bg-[length:100px_100px] circuit-pattern"></div>

          {/* Main background */}
          <div className={cn("absolute inset-0", rarityBackgrounds[card.rarity])}></div>

          {/* Boosted effect */}
          {card.boosted && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-fuchsia-500/10 animate-pulse"></div>
          )}

          {/* Energy field effect */}
          <div className="absolute inset-0 opacity-30 energy-field">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-500/5 to-transparent"></div>
          </div>
        </div>

        {/* Card content */}
        <div className="relative h-full flex flex-col p-3 z-10">
          {/* Card Header - Redesigned */}
          <div className="relative mb-2">
            {/* Decorative header line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-400/50 to-transparent"></div>

            {/* Type badge - moved to top right with new design */}
            <div className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center h-8 w-8 rounded-full backdrop-blur-sm border",
              typeColors[card.type]
            )}>
              {typeIcons[card.type]}
            </div>

            {/* Mana cost badge - integrated with card design */}
            <div className="absolute top-0 left-0 z-20 p-1.5 bg-gradient-to-br from-black/80 to-transparent rounded-tl-md">
              <ManaCost
                cost={card.mana}
                size="sm"
                showAnimation={isHovered}
                isAffordable={true}
                variant="tech"
                cardRarity={card.rarity.toLowerCase() as 'common' | 'rare' | 'epic' | 'legendary'}
                className="shadow-md"
              />
            </div>

            {/* Card name with tech-inspired styling */}
            <div className="pt-3 pb-1 flex items-center">
              <div className="text-lg font-bold text-white truncate tracking-wide pl-10">
                {card.name}
              </div>
              {card.boosted && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="ml-1 flex items-center justify-center h-4 w-4 rounded-full bg-amber-500/30">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 border-amber-500/50">
                      <div className="text-xs">
                        <span className="text-amber-400 font-bold">MONAD Boosted</span>
                        <div className="text-slate-300 mt-1">This card's power has been amplified by MONAD tokens</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Chain Reaction Badge */}
              {card.specialEffect?.chainReaction?.canTriggerChain && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="ml-1 flex items-center justify-center h-4 w-4 rounded-full bg-purple-500/30">
                        <Zap className="h-3 w-3 text-purple-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 border-purple-500/50">
                      <div className="text-xs">
                        <span className="text-purple-400 font-bold">Chain Reaction</span>
                        <div className="text-slate-300 mt-1">This card can trigger chain reactions on Monad</div>
                        {card.specialEffect.chainReaction.parallelExecution && (
                          <div className="text-blue-300 mt-1 flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            Uses Monad's parallel execution
                          </div>
                        )}
                        {card.specialEffect.chainReaction.triggerProbability && (
                          <div className="text-amber-300 mt-1">
                            {Math.round(card.specialEffect.chainReaction.triggerProbability * 100)}% success rate
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Card Image - Redesigned with rectangular frame */}
          <div className="flex-1 relative overflow-hidden mb-2">
            {/* Rectangular image container with subtle beveled corners */}
            <div className="absolute inset-0 rounded-md overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 bg-cover bg-center transition-transform duration-700",
                  isHovered ? "scale-110" : "scale-100"
                )}
                style={{ backgroundImage: `url(${imageUrl})` }}
              />

              {/* Image overlay with tech-inspired pattern */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

              {/* Animated energy lines */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute h-0.5 w-1/3 bg-gradient-to-r from-transparent via-white to-transparent top-1/4 -left-full animate-[moveRight_3s_ease-in-out_infinite]"></div>
                <div className="absolute h-0.5 w-1/4 bg-gradient-to-r from-transparent via-white to-transparent top-2/3 -left-full animate-[moveRight_2.5s_ease-in-out_infinite_0.5s]"></div>
              </div>

              {/* Monad Blockchain Badge - Redesigned */}
              <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[8px] text-cyan-400 font-mono border border-cyan-500/20 rounded-sm">
                MONAD
              </div>

              {/* Active Effects Display */}
              {card.activeEffects && card.activeEffects.length > 0 && (
                <div className="absolute bottom-1 left-1 flex space-x-1">
                  {card.activeEffects.map((effect, index) => (
                    <TooltipProvider key={`${effect.id}-${index}`}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="bg-black/70 backdrop-blur-sm h-5 w-5 flex items-center justify-center rounded-full border border-purple-500/30">
                            <Flame className="h-3 w-3 text-purple-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-black/90 border-purple-500/50">
                          <div className="text-xs">
                            <span className="text-purple-400 font-bold">{effect.name}</span>
                            <div className="text-slate-300 mt-1">Magnitude: {effect.magnitude}</div>
                            <div className="text-slate-300">Duration: {effect.duration} turns</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
            </div>

            {/* Rarity Indicator - Redesigned */}
            <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 flex items-center space-x-1 rounded-sm">
              {[...Array(card.rarity === CardRarity.LEGENDARY ? 3 : card.rarity === CardRarity.EPIC ? 2 : card.rarity === CardRarity.RARE ? 1 : 0)].map((_, i) => (
                <div key={i} className={cn(
                  "h-1.5 w-1.5",
                  card.rarity === CardRarity.LEGENDARY ? 'bg-amber-400' :
                  card.rarity === CardRarity.EPIC ? 'bg-fuchsia-400' : 'bg-cyan-400',
                  "animate-[pulse_1.5s_ease-in-out_infinite]",
                  i === 1 ? "animate-delay-300" : i === 2 ? "animate-delay-600" : ""
                )}></div>
              ))}
            </div>
          </div>

          {/* Card Details - Redesigned */}
          {showDetails && (
            <>
              {/* Description with tech-inspired styling */}
              <div className="text-xs text-slate-300 mb-2 h-12 overflow-hidden bg-black/50 backdrop-blur-sm p-2 border border-slate-700/30 rounded-md">
                {card.description}
              </div>

              {/* Stats display - Redesigned */}
              <div className="grid grid-cols-3 gap-1 mb-1">
                {/* Special ability stat instead of mana (since mana is now prominent at top) */}
                <div className="flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-1 border border-purple-500/20 rounded-md">
                  <span className="text-xs text-purple-300">ABILITY</span>
                  <span className="text-sm font-semibold text-purple-400">{card.special || '-'}</span>
                </div>

                {/* Attack stat */}
                {card.attack && (
                  <div className="flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-1 border border-rose-500/20 rounded-md">
                    <span className="text-xs text-rose-300">ATK</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-rose-400">
                        {card.attack}
                        {card.boosted && card.originalAttack && (
                          <span className="text-green-400 text-xs ml-1">+{card.attack - card.originalAttack}</span>
                        )}
                      </span>
                      {card.boosted && <Sparkles className="h-3 w-3 text-amber-400 ml-1 animate-pulse" />}
                    </div>
                  </div>
                )}

                {/* Defense stat */}
                {card.defense && (
                  <div className="flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-1 border border-cyan-500/20 rounded-md">
                    <span className="text-xs text-cyan-300">DEF</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-cyan-400">
                        {card.defense}
                        {card.boosted && card.originalDefense && (
                          <span className="text-green-400 text-xs ml-1">+{card.defense - card.originalDefense}</span>
                        )}
                      </span>
                      {card.boosted && <Sparkles className="h-3 w-3 text-amber-400 ml-1 animate-pulse" />}
                    </div>
                  </div>
                )}
              </div>

              {/* Chain Reaction Effect Display */}
              {card.specialEffect?.chainReaction?.canTriggerChain && (
                <div className="mb-1 bg-purple-900/20 p-1 border border-purple-500/20 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 text-purple-400 mr-1" />
                      <span className="text-xs text-purple-400 font-medium">Chain Reaction</span>
                    </div>
                    <span className="text-xs text-purple-300">
                      {Math.round((card.specialEffect.chainReaction.triggerProbability || 0.5) * 100)}%
                    </span>
                  </div>
                  {card.specialEffect.chainReaction.chainedEffects && card.specialEffect.chainReaction.chainedEffects.length > 0 && (
                    <div className="flex items-center mt-1 overflow-hidden">
                      <div className="flex-shrink-0 h-3 w-3 rounded-full bg-purple-500/30 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-purple-400"></div>
                      </div>
                      <ArrowRight className="h-2 w-2 text-purple-400 mx-1" />
                      <div className="flex-shrink-0 h-3 w-3 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-blue-400"></div>
                      </div>
                      {card.specialEffect.chainReaction.chainedEffects.length > 1 && (
                        <>
                          <ArrowRight className="h-2 w-2 text-purple-400 mx-1" />
                          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-green-500/30 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 bg-green-400"></div>
                          </div>
                        </>
                      )}
                      <div className="ml-1 text-[8px] text-gray-400 truncate">
                        Monad Parallel Execution
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Monad Blockchain Data - Redesigned */}
              <div className="mt-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between text-cyan-400 bg-black/50 backdrop-blur-sm p-1 border border-cyan-500/20 rounded-md">
                        <span className="font-mono text-xs truncate">{card.monadId}</span>
                        <div className="h-3 w-3 bg-cyan-500/30 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-cyan-500 animate-pulse"></div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black/90 border-cyan-500/50">
                      <div className="text-xs font-mono text-cyan-400">
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
      </div>
    </div>
  );
};

export default GameCard;
