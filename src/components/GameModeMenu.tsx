import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameMode } from '@/types/game';
import { Dices, Users, Trophy, Swords, BookOpen } from 'lucide-react';

interface GameModeMenuProps {
  onSelectMode: (mode: GameMode) => void;
}

const GameModeMenu: React.FC<GameModeMenuProps> = ({ onSelectMode }) => {
  const gameModes = [
    {
      mode: GameMode.PRACTICE,
      title: "Practice Mode",
      description: "Train against AI without blockchain transactions",
      icon: <Dices className="h-12 w-12 text-emerald-400" />,
      available: true,
      details: "Perfect for learning the game mechanics and testing strategies without using MONAD tokens."
    },
    {
      mode: GameMode.GAMEROOM,
      title: "Game Room (1v1)",
      description: "Play against friends with room codes",
      icon: <Users className="h-12 w-12 text-blue-400" />,
      available: true,
      details: "Create or join a game room to play against friends. Uses MONAD blockchain for secure, transparent gameplay."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Select Game Mode</h2>
        <p className="text-gray-400">Choose how you want to play</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gameModes.map((gameMode) => (
          <Card 
            key={gameMode.mode}
            className="glassmorphism border-gray-500/30 hover:border-emerald-500/50 transition-all cursor-pointer"
            onClick={() => gameMode.available && onSelectMode(gameMode.mode)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-black/20 flex items-center justify-center mb-4">
                {gameMode.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{gameMode.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{gameMode.description}</p>
              
              <div className="text-xs text-gray-500 mb-6">
                {gameMode.details}
              </div>
              
              <Button 
                variant="default"
                className={`w-full bg-gradient-to-r ${gameMode.mode === GameMode.PRACTICE ? 'from-emerald-400 to-teal-500' : 'from-blue-400 to-indigo-500'} text-white`}
                disabled={!gameMode.available}
                onClick={() => gameMode.available && onSelectMode(gameMode.mode)}
              >
                {gameMode.available ? 'Select' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          More game modes coming soon! Stay tuned for Ranked, Tournament, and Story modes.
        </p>
      </div>
    </div>
  );
};

export default GameModeMenu;
