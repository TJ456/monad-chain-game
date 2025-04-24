import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameRoom } from '@/types/game';
import { Plus, LogIn, Eye } from 'lucide-react';
import GameRoomCreator from './GameRoomCreator';
import GameRoomJoiner from './GameRoomJoiner';
import GameRoomWaiting from './GameRoomWaiting';
import SpectatorMode from './SpectatorMode';

interface GameRoomManagerProps {
  onStartGame: () => void;
  onBack: () => void;
  walletAddress: string;
  username: string;
}

type RoomView = 'menu' | 'create' | 'join' | 'waiting' | 'spectate';

const GameRoomManager: React.FC<GameRoomManagerProps> = ({
  onStartGame,
  onBack,
  walletAddress,
  username
}) => {
  const [currentView, setCurrentView] = useState<RoomView>('menu');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  const handleCreateRoom = (room: GameRoom) => {
    setCurrentRoom(room);
    setIsCreator(true);
    setCurrentView('waiting');
  };

  const handleJoinRoom = (room: GameRoom) => {
    setCurrentRoom(room);
    setIsCreator(false);
    setCurrentView('waiting');
  };

  const handleCancel = () => {
    setCurrentRoom(null);
    setCurrentView('menu');
  };

  return (
    <div className="mt-16"> {/* Added a container with top margin to avoid navbar collision */}
      {currentView === 'menu' && (
        <Card className="glassmorphism border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white">Game Room</CardTitle>
            <CardDescription>Play 1v1 matches with friends</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="glassmorphism border-gray-500/30 hover:border-blue-500/50 transition-all cursor-pointer"
                onClick={() => setCurrentView('create')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-900/20 flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Create Room</h3>
                  <p className="text-sm text-gray-400 mb-4">Start a new game and invite a friend</p>
                  <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                    <li>• Generate a unique room code</li>
                    <li>• Share code with your friend</li>
                    <li>• Start the game when they join</li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="glassmorphism border-gray-500/30 hover:border-blue-500/50 transition-all cursor-pointer"
                onClick={() => setCurrentView('join')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-900/20 flex items-center justify-center mb-4">
                    <LogIn className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Join Room</h3>
                  <p className="text-sm text-gray-400 mb-4">Enter a room code to join a game</p>
                  <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                    <li>• Enter the 6-digit room code</li>
                    <li>• Connect to your friend's game</li>
                    <li>• Wait for them to start the match</li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="glassmorphism border-gray-500/30 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => setCurrentView('spectate')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-900/20 flex items-center justify-center mb-4">
                    <Eye className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Spectate</h3>
                  <p className="text-sm text-gray-400 mb-4">Watch ongoing games</p>
                  <ul className="text-xs text-left text-gray-300 space-y-1 mb-4 w-full">
                    <li>• Enter a room code to spectate</li>
                    <li>• Watch games in real-time</li>
                    <li>• Chat with other spectators</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
              <h3 className="text-md font-semibold text-white mb-2">About Game Rooms</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Play 1v1 matches with friends using room codes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>All game moves are recorded on the MONAD blockchain</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Earn MONAD tokens for winning matches</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Perfect for friendly matches and tournaments</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              Back to Game Modes
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentView === 'create' && (
        <GameRoomCreator
          onRoomCreated={handleCreateRoom}
          onBack={handleCancel}
          walletAddress={walletAddress}
          username={username}
        />
      )}

      {currentView === 'join' && (
        <GameRoomJoiner
          onRoomJoined={handleJoinRoom}
          onBack={handleCancel}
          walletAddress={walletAddress}
          username={username}
        />
      )}

      {currentView === 'waiting' && currentRoom && (
        <GameRoomWaiting
          room={currentRoom}
          onGameStart={onStartGame}
          onCancel={handleCancel}
          isCreator={isCreator}
        />
      )}

      {currentView === 'spectate' && (
        <SpectatorMode
          onBack={handleCancel}
          username={username}
        />
      )}
    </div>
  );
};

export default GameRoomManager;
