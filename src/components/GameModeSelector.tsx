import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameMode } from '@/types/game';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dices, Trophy, Swords, BookOpen, Lock } from 'lucide-react';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
  currentMode: GameMode | null;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode, currentMode }) => {
  const gameModes = [
    {
      mode: GameMode.PRACTICE,
      title: "Practice Mode",
      description: "Train against AI without blockchain transactions",
      icon: <Dices className="h-8 w-8 text-indigo-400" />,
      available: true,
      details: "Perfect for learning the game mechanics and testing strategies without using MONAD tokens."
    },
    {
      mode: GameMode.RANKED,
      title: "Ranked Mode",
      description: "Compete on the MONAD blockchain for rewards",
      icon: <Trophy className="h-8 w-8 text-yellow-400" />,
      available: false,
      details: "Battle other players on the MONAD blockchain. Win matches to earn MONAD tokens and climb the leaderboard."
    },
    {
      mode: GameMode.TOURNAMENT,
      title: "Tournament Mode",
      description: "Join tournaments with entry fees and prize pools",
      icon: <Swords className="h-8 w-8 text-red-400" />,
      available: false,
      details: "Enter tournaments with MONAD token entry fees. Winners take home the prize pool distributed via smart contracts."
    },
    {
      mode: GameMode.STORY,
      title: "Story Mode",
      description: "Experience the MONAD universe through story missions",
      icon: <BookOpen className="h-8 w-8 text-emerald-400" />,
      available: false,
      details: "Play through story missions to earn unique cards and learn about the MONAD universe and blockchain technology."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Game Mode</h2>
        <p className="text-gray-400">Choose how you want to play on the MONAD blockchain</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameModes.map((gameMode) => (
          <Card 
            key={gameMode.mode}
            className={`p-4 border ${currentMode === gameMode.mode 
              ? 'border-indigo-500 bg-indigo-900/20' 
              : 'border-gray-700 bg-black/40 hover:bg-black/60'} 
              transition-all duration-200 cursor-pointer relative overflow-hidden`}
            onClick={() => gameMode.available && onSelectMode(gameMode.mode)}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
              <div className="h-full w-full bg-[url('/pattern.svg')] bg-repeat opacity-10"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-black/50 backdrop-blur-sm">
                  {gameMode.icon}
                </div>
                
                {!gameMode.available && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-800/80 text-xs text-gray-300">
                          <Lock className="h-3 w-3" />
                          <span>Coming Soon</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">This mode will be available in a future update</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">{gameMode.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{gameMode.description}</p>
              
              <div className="text-xs text-gray-500 mb-4">
                {gameMode.details}
              </div>
              
              <Button 
                variant={currentMode === gameMode.mode ? "default" : "outline"}
                className={`w-full ${!gameMode.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!gameMode.available}
                onClick={() => gameMode.available && onSelectMode(gameMode.mode)}
              >
                {currentMode === gameMode.mode ? 'Selected' : gameMode.available ? 'Select' : 'Coming Soon'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {currentMode === GameMode.PRACTICE && (
        <div className="mt-4 p-4 border border-indigo-500/30 rounded-lg bg-indigo-900/10">
          <h3 className="text-md font-semibold text-white mb-2 flex items-center">
            <Dices className="h-4 w-4 mr-2 text-indigo-400" />
            About Practice Mode
          </h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Perfect for learning game mechanics and testing strategies</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>No blockchain transactions required - play offline</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Test MONAD boost mechanics without spending tokens</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Three AI difficulty levels to challenge yourself</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameModeSelector;
