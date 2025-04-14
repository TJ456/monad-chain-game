import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIDifficultyTier } from '@/types/game';
import { Shield, Award, Star } from 'lucide-react';

interface GameRoomSelectorProps {
  onSelectDifficulty: (difficulty: AIDifficultyTier) => void;
}

const GameRoomSelector: React.FC<GameRoomSelectorProps> = ({ onSelectDifficulty }) => {
  return (
    <Card className="glassmorphism border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white">Select Game Room</CardTitle>
        <CardDescription>Choose your difficulty level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Novice Room */}
          <Card 
            className="glassmorphism border-gray-500/30 hover:border-emerald-500/50 transition-all cursor-pointer"
            onClick={() => onSelectDifficulty(AIDifficultyTier.NOVICE)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Novice</h3>
              <p className="text-sm text-gray-400 mb-4">Perfect for beginners. Learn the basics of Monad battles.</p>
              <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                <li>• Basic AI strategies</li>
                <li>• 1 shard reward per win</li>
                <li>• Standard card attributes</li>
              </ul>
              <Button variant="outline" className="mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/20">
                Enter Room
              </Button>
            </CardContent>
          </Card>
          
          {/* Veteran Room */}
          <Card 
            className="glassmorphism border-blue-500/30 hover:border-blue-500/50 transition-all cursor-pointer"
            onClick={() => onSelectDifficulty(AIDifficultyTier.VETERAN)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-900/20 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Veteran</h3>
              <p className="text-sm text-gray-400 mb-4">For experienced players. Face smarter opponents.</p>
              <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                <li>• Advanced AI tactics</li>
                <li>• 3 shard rewards per win</li>
                <li>• Enhanced card attributes</li>
              </ul>
              <Button variant="outline" className="mt-2 border-blue-500/30 text-blue-400 hover:bg-blue-900/20">
                Enter Room
              </Button>
            </CardContent>
          </Card>
          
          {/* Legend Room */}
          <Card 
            className="glassmorphism border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
            onClick={() => onSelectDifficulty(AIDifficultyTier.LEGEND)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-amber-900/20 flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Legend</h3>
              <p className="text-sm text-gray-400 mb-4">For masters only. Face the ultimate challenge.</p>
              <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                <li>• Expert AI strategies</li>
                <li>• 5 shard rewards per win</li>
                <li>• Max-powered cards</li>
              </ul>
              <Button variant="outline" className="mt-2 border-amber-500/30 text-amber-400 hover:bg-amber-900/20">
                Enter Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameRoomSelector;
