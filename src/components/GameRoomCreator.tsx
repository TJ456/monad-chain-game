import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameRoom } from '@/types/game';
import { Copy, Users, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GameRoomCreatorProps {
  onRoomCreated: (room: GameRoom) => void;
  onBack: () => void;
  walletAddress: string;
  username: string;
}

const GameRoomCreator: React.FC<GameRoomCreatorProps> = ({ 
  onRoomCreated, 
  onBack,
  walletAddress,
  username
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [blockNumber, setBlockNumber] = useState(0);

  const generateRoomCode = () => {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setIsCreating(true);
    
    try {
      // Generate a unique room code
      const generatedRoomCode = generateRoomCode();
      setRoomCode(generatedRoomCode);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate transaction hash and block number
      const txHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      const blockNum = Math.floor(Math.random() * 1000000) + 8000000;
      
      setTransactionHash(txHash);
      setBlockNumber(blockNum);
      
      // Create the room object
      const newRoom: GameRoom = {
        id: `room-${Date.now()}`,
        roomCode: generatedRoomCode,
        creatorAddress: walletAddress,
        creatorUsername: username,
        status: 'waiting',
        createdAt: Date.now(),
        transactionHash: txHash,
        blockNumber: blockNum
      };
      
      // Notify parent component
      onRoomCreated(newRoom);
      
      toast.success("Game room created!", {
        description: `Room code: ${generatedRoomCode}`,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create game room");
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard");
  };

  return (
    <Card className="glassmorphism border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white">Create Game Room</CardTitle>
        <CardDescription>Set up a 1v1 match with a friend</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roomName">Room Name</Label>
          <Input
            id="roomName"
            placeholder="Enter a name for your game room"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="bg-black/20 border-gray-700"
            disabled={isCreating || !!roomCode}
          />
        </div>
        
        {roomCode && (
          <div className="mt-6 p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">Room Created!</h3>
              <p className="text-sm text-gray-400">Share this code with your friend</p>
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-black/40 px-4 py-3 rounded-lg text-2xl font-mono tracking-wider text-blue-400">
                {roomCode}
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
            
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Transaction Hash:</span>
                <span className="text-blue-400 font-mono">{`${transactionHash.substring(0, 10)}...${transactionHash.substring(transactionHash.length - 8)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Block Number:</span>
                <span className="text-blue-400 font-mono">{blockNumber}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          disabled={isCreating}
        >
          Back
        </Button>
        
        {!roomCode ? (
          <Button 
            onClick={createRoom}
            disabled={isCreating || !roomName.trim()}
            className="bg-gradient-to-r from-blue-400 to-indigo-500"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Room
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={() => onRoomCreated({
              id: `room-${Date.now()}`,
              roomCode,
              creatorAddress: walletAddress,
              creatorUsername: username,
              status: 'waiting',
              createdAt: Date.now(),
              transactionHash,
              blockNumber
            })}
            className="bg-gradient-to-r from-blue-400 to-indigo-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Go to Waiting Room
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GameRoomCreator;
