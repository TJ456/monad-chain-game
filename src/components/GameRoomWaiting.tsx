import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameRoom } from '@/types/game';
import { Copy, Users, ArrowRight, Loader2, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import GameChat from './GameChat';

interface GameRoomWaitingProps {
  room: GameRoom;
  onGameStart: () => void;
  onCancel: () => void;
  isCreator: boolean;
}

const GameRoomWaiting: React.FC<GameRoomWaitingProps> = ({
  room,
  onGameStart,
  onCancel,
  isCreator
}) => {
  const [waitTime, setWaitTime] = useState(0);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Start the wait timer
    const interval = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);

    // Simulate opponent joining after a random time (5-15 seconds)
    if (isCreator) {
      const joinTime = Math.floor(Math.random() * 10000) + 5000;
      const timeout = setTimeout(() => {
        setOpponentJoined(true);
        toast.success("Player has joined your room!", {
          description: "You can now start the game"
        });
      }, joinTime);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => clearInterval(interval);
  }, [isCreator]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    toast.success("Room code copied to clipboard");
  };

  const startGame = async () => {
    setIsStarting(true);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Game starting!", {
        description: "Initializing game on MONAD blockchain"
      });

      // Notify parent component
      onGameStart();
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
      setIsStarting(false);
    }
  };

  return (
    <Card className="glassmorphism border-blue-500/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Waiting Room</CardTitle>
            <CardDescription>
              {isCreator
                ? "Waiting for opponent to join"
                : "Connected to game room"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="border-blue-500/30 text-blue-400"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-between items-center p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-gray-400">Waiting time:</span>
          </div>
          <div className="font-mono text-white">{formatTime(waitTime)}</div>
        </div>

        {isCreator && (
          <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">Share Room Code</h3>
              <p className="text-sm text-gray-400">Give this code to your friend</p>
            </div>

            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-black/40 px-4 py-3 rounded-lg text-2xl font-mono tracking-wider text-blue-400">
                {room.roomCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyRoomCode}
                className="border-blue-500/30 text-blue-400"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-black/20">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-emerald-900/20 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">{isCreator ? room.creatorUsername : room.creatorUsername}</div>
                <div className="text-xs text-gray-500">{isCreator ? "(You)" : "Room Creator"}</div>
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-emerald-900/20 text-emerald-400">
              Ready
            </div>
          </div>

          <div className="flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-black/20">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-900/20 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium">
                  {opponentJoined
                    ? (isCreator ? "Player2" : room.opponentUsername)
                    : "Waiting for player..."}
                </div>
                <div className="text-xs text-gray-500">{!isCreator && "(You)"}</div>
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              opponentJoined
                ? "bg-emerald-900/20 text-emerald-400"
                : "bg-amber-900/20 text-amber-400"
            }`}>
              {opponentJoined ? "Ready" : "Waiting"}
            </div>
          </div>
        </div>

        {showChat ? (
          <div className="h-[300px]">
            <GameChat
              roomCode={room.roomCode}
              playerName={isCreator ? room.creatorUsername : "You"}
              opponentName={isCreator ? "Opponent" : room.creatorUsername}
            />
          </div>
        ) : (
          <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-black/20">
            <h3 className="text-sm font-semibold text-white mb-2">Blockchain Details</h3>

            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Transaction Hash:</span>
                <a
                  href="#"
                  className="text-blue-400 font-mono flex items-center"
                  onClick={(e) => e.preventDefault()}
                >
                  {`${room.transactionHash?.substring(0, 10)}...${room.transactionHash?.substring((room.transactionHash?.length || 0) - 8)}`}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between">
                <span>Block Number:</span>
                <a
                  href="#"
                  className="text-blue-400 font-mono flex items-center"
                  onClick={(e) => e.preventDefault()}
                >
                  {room.blockNumber}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400">Confirmed</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isStarting}
        >
          Cancel
        </Button>

        {isCreator ? (
          <Button
            onClick={startGame}
            disabled={isStarting || !opponentJoined}
            className="bg-gradient-to-r from-blue-400 to-indigo-500"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Game
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            className="border-blue-500/30 text-blue-400"
          >
            Waiting for host to start
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GameRoomWaiting;
