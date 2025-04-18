import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GameRoom, Card as GameCardType, CardRarity, CardType } from '@/types/game';
import { Eye, Users, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import GameChat from './GameChat';
import { getTransactionExplorerUrl, getBlockExplorerUrl, truncateHash } from '@/utils/blockchain';

interface SpectatorModeProps {
  onBack: () => void;
  username: string;
}

interface SpectatorGameState {
  player1: {
    username: string;
    health: number;
    mana: number;
    cards: GameCardType[];
  };
  player2: {
    username: string;
    health: number;
    mana: number;
    cards: GameCardType[];
  };
  currentTurn: 'player1' | 'player2';
  moveHistory: {
    player: string;
    card: string;
    effect: string;
    timestamp: number;
  }[];
  spectatorCount: number;
}

const SpectatorMode: React.FC<SpectatorModeProps> = ({ onBack, username }) => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [gameState, setGameState] = useState<SpectatorGameState | null>(null);
  const [spectatorView, setSpectatorView] = useState<'game' | 'chat'>('game');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleJoinAsSpectator = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    // Check if the room code is in the correct format (6 alphanumeric characters)
    const isValid = /^[A-Z0-9]{6}$/.test(roomCode);

    if (!isValid) {
      toast.error("Invalid room code format", {
        description: "Room code should be 6 alphanumeric characters"
      });
      return;
    }

    setIsJoining(true);

    try {
      // Simulate API call to check if room exists
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes, we'll create a simulated game room and state
      const simulatedRoom: GameRoom = {
        id: `room-${Date.now()}`,
        roomCode: roomCode,
        creatorAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        creatorUsername: "Player1",
        opponentAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        opponentUsername: "Player2",
        status: 'playing',
        createdAt: Date.now() - 300000, // 5 minutes ago
        gameId: Math.floor(Math.random() * 1000000),
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 8000000
      };

      const simulatedGameState: SpectatorGameState = {
        player1: {
          username: "Player1",
          health: 15,
          mana: 7,
          cards: [
            { id: "card1", name: "Flame Strike", description: "Deal 5 damage", image: "/card1.png", rarity: CardRarity.RARE, type: CardType.ATTACK, attack: 5, mana: 4, monadId: "monad1" },
            { id: "card2", name: "Ice Shield", description: "Gain 4 defense", image: "/card2.png", rarity: CardRarity.COMMON, type: CardType.DEFENSE, defense: 4, mana: 3, monadId: "monad2" },
            { id: "card3", name: "Energy Bolt", description: "Deal 3 damage", image: "/card3.png", rarity: CardRarity.COMMON, type: CardType.ATTACK, attack: 3, mana: 2, monadId: "monad3" }
          ]
        },
        player2: {
          username: "Player2",
          health: 12,
          mana: 8,
          cards: [
            { id: "card4", name: "Shadow Strike", description: "Deal 4 damage", image: "/card4.png", rarity: CardRarity.RARE, type: CardType.ATTACK, attack: 4, mana: 3, monadId: "monad4" },
            { id: "card5", name: "Healing Wave", description: "Restore 3 health", image: "/card5.png", rarity: CardRarity.COMMON, type: CardType.UTILITY, mana: 2, monadId: "monad5" }
          ]
        },
        currentTurn: 'player1',
        moveHistory: [
          { player: "Player1", card: "Flame Strike", effect: "Dealt 5 damage", timestamp: Date.now() - 120000 },
          { player: "Player2", card: "Shadow Strike", effect: "Dealt 4 damage", timestamp: Date.now() - 90000 },
          { player: "Player1", card: "Energy Bolt", effect: "Dealt 3 damage", timestamp: Date.now() - 60000 },
          { player: "Player2", card: "Healing Wave", effect: "Restored 3 health", timestamp: Date.now() - 30000 }
        ],
        spectatorCount: Math.floor(Math.random() * 5) + 1 // 1-5 spectators
      };

      setCurrentRoom(simulatedRoom);
      setGameState(simulatedGameState);
      setLastUpdateTime(Date.now());

      toast.success("Joined as spectator!", {
        description: `Watching game in room ${roomCode}`
      });
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join game room");
    } finally {
      setIsJoining(false);
    }
  };

  const refreshGameState = async () => {
    if (!currentRoom) return;

    setIsRefreshing(true);

    try {
      // Simulate API call to get updated game state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, we'll update the simulated game state
      if (gameState) {
        const updatedGameState = { ...gameState };

        // Simulate game progress
        if (updatedGameState.currentTurn === 'player1') {
          updatedGameState.currentTurn = 'player2';
          updatedGameState.player1.mana -= 2;
          updatedGameState.player2.health -= Math.floor(Math.random() * 3) + 1;
          updatedGameState.moveHistory.push({
            player: "Player1",
            card: "Energy Bolt",
            effect: "Dealt 3 damage",
            timestamp: Date.now()
          });
        } else {
          updatedGameState.currentTurn = 'player1';
          updatedGameState.player2.mana -= 2;
          updatedGameState.player1.health -= Math.floor(Math.random() * 3) + 1;
          updatedGameState.moveHistory.push({
            player: "Player2",
            card: "Shadow Strike",
            effect: "Dealt 4 damage",
            timestamp: Date.now()
          });
        }

        // Randomly update spectator count
        if (Math.random() > 0.7) {
          updatedGameState.spectatorCount += Math.random() > 0.5 ? 1 : -1;
          if (updatedGameState.spectatorCount < 1) updatedGameState.spectatorCount = 1;
        }

        setGameState(updatedGameState);
        setLastUpdateTime(Date.now());

        toast.success("Game state updated", {
          description: "Latest moves have been loaded"
        });
      }
    } catch (error) {
      console.error("Error refreshing game state:", error);
      toast.error("Failed to refresh game state");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!currentRoom || !gameState) {
    return (
      <Card className="glassmorphism border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Spectator Mode</CardTitle>
          <CardDescription>Watch ongoing games without participating</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Enter Room Code</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter 6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-black/20 border-gray-700 font-mono tracking-wider text-center uppercase"
                maxLength={6}
                disabled={isJoining}
              />
              <Button
                onClick={handleJoinAsSpectator}
                disabled={isJoining || !roomCode.trim()}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                {isJoining ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Join
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 border border-purple-500/30 rounded-lg bg-purple-900/10">
            <h3 className="text-md font-semibold text-white mb-2 flex items-center">
              <Eye className="h-4 w-4 mr-2 text-purple-400" />
              About Spectator Mode
            </h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Watch live games between other players</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>See all moves and game state in real-time</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Chat with other spectators</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Learn strategies by observing high-level play</span>
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
            Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-purple-500/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Eye className="h-5 w-5 mr-2 text-purple-400" />
            Spectator Mode
          </CardTitle>
          <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-500/50">
            <Users className="h-3 w-3 mr-1" />
            {gameState.spectatorCount} watching
          </Badge>
        </div>
        <CardDescription className="flex justify-between items-center">
          <span>Room: {currentRoom.roomCode}</span>
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            <span className="text-gray-400">
              Last updated: {lastUpdateTime ? formatTime(lastUpdateTime) : 'N/A'}
            </span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex space-x-2 border-b border-gray-700 pb-2">
          <Button
            variant={spectatorView === 'game' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSpectatorView('game')}
            className={spectatorView === 'game' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Game View
          </Button>
          <Button
            variant={spectatorView === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSpectatorView('chat')}
            className={spectatorView === 'chat' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Chat
          </Button>
          <div className="flex-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshGameState}
            disabled={isRefreshing}
            className="border-purple-500/30 text-purple-300"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {spectatorView === 'game' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-emerald-500/30 rounded-lg bg-emerald-900/10">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-emerald-300">{gameState.player1.username}</div>
                  <div className="text-xs text-gray-400">
                    {gameState.currentTurn === 'player1' && (
                      <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-500/50">
                        Current Turn
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health:</span>
                  <span className="text-emerald-300">{gameState.player1.health}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mana:</span>
                  <span className="text-blue-300">{gameState.player1.mana}</span>
                </div>
              </div>

              <div className="p-3 border border-amber-500/30 rounded-lg bg-amber-900/10">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-amber-300">{gameState.player2.username}</div>
                  <div className="text-xs text-gray-400">
                    {gameState.currentTurn === 'player2' && (
                      <Badge variant="outline" className="bg-amber-900/30 text-amber-300 border-amber-500/50">
                        Current Turn
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health:</span>
                  <span className="text-amber-300">{gameState.player2.health}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mana:</span>
                  <span className="text-blue-300">{gameState.player2.mana}</span>
                </div>
              </div>
            </div>

            <div className="p-3 border border-gray-700 rounded-lg bg-black/20">
              <h3 className="text-sm font-medium text-white mb-2">Move History</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {gameState.moveHistory.slice().reverse().map((move, index) => (
                  <div key={index} className="text-xs p-2 border border-gray-700 rounded bg-black/30">
                    <div className="flex justify-between">
                      <span className={move.player === "Player1" ? "text-emerald-400" : "text-amber-400"}>
                        {move.player}
                      </span>
                      <span className="text-gray-500">{formatTime(move.timestamp)}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-blue-300">{move.card}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-gray-300">{move.effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border border-blue-500/30 rounded-lg bg-blue-900/10">
              <h3 className="text-sm font-medium text-white mb-2">Blockchain Details</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction:</span>
                  <a
                    href={getTransactionExplorerUrl(currentRoom.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 font-mono flex items-center"
                  >
                    {truncateHash(currentRoom.transactionHash, 10, 8)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block:</span>
                  <a
                    href={getBlockExplorerUrl(currentRoom.blockNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 font-mono flex items-center"
                  >
                    {currentRoom.blockNumber}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px]">
            <GameChat
              roomCode={currentRoom.roomCode}
              playerName={username}
              opponentName="Spectator Chat"
            />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          Exit Spectator Mode
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SpectatorMode;
