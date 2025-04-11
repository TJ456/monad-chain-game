
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Player, MonadTransaction } from "@/types/game";
import { generateAvatarImage } from '@/utils/placeholderImages';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const avatarUrl = player.avatar.startsWith('/') 
    ? generateAvatarImage(player.username)
    : player.avatar;

  const experienceToNextLevel = player.level * 100;
  const progressPercentage = Math.min(100, (player.experience % experienceToNextLevel) / experienceToNextLevel * 100);
  
  // Format Monad address with ellipsis
  const formatAddress = (address: string) => {
    if (address.includes('...')) return address;
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="glassmorphism border-mondo-purple/30 overflow-hidden transition-all duration-300 hover:border-mondo-purple/70">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Rank number if provided */}
          {rank !== undefined && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mondo-purple/20 flex items-center justify-center text-mondo-purple font-bold">
              {rank + 1}
            </div>
          )}
          
          {/* Avatar with Monad verified badge */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500">
            <img 
              src={avatarUrl} 
              alt={`${player.username}'s avatar`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-medium text-center">
              Lvl {player.level}
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border border-black flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Player info */}
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">{player.username}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-emerald-400 font-medium flex items-center">
                      {player.monad} MONAD
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/80 border-emerald-500/50">
                    <p className="text-xs text-emerald-400">Verified Monad balance on-chain</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="mt-1 flex items-center text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-emerald-400 font-mono truncate">{formatAddress(player.monadAddress)}</span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/80 border-emerald-500/50">
                    <p className="text-xs text-emerald-400">Monad Blockchain Address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Stats */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-green-400 text-sm">
                  <span className="font-semibold">{player.wins}</span> 
                  <span className="text-xs ml-1">Wins</span>
                </div>
                
                <div className="text-red-400 text-sm">
                  <span className="font-semibold">{player.losses}</span>
                  <span className="text-xs ml-1">Losses</span>
                </div>
                
                <div className="text-yellow-400 text-sm">
                  <span className="font-semibold">{player.cards.length}</span>
                  <span className="text-xs ml-1">Cards</span>
                </div>
              </div>
              
              {/* Win rate */}
              <div className="text-xs text-gray-300">
                Win Rate: 
                <span className="ml-1 font-semibold">
                  {player.wins + player.losses > 0 
                    ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
            
            {/* Experience bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Level {player.level}</span>
                <span>Level {player.level + 1}</span>
              </div>
              <Progress value={progressPercentage} className="h-1" />
            </div>

            {/* Transaction History Indicator */}
            {player.transactionHistory && player.transactionHistory.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center">
                <div className="text-xs text-emerald-400">
                  {player.transactionHistory.length} on-chain transactions
                </div>
                <div className="ml-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
