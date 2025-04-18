import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameRoom } from '@/types/game';
import { ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getTransactionExplorerUrl, getBlockExplorerUrl, truncateHash } from '@/utils/blockchain';

interface GameRoomJoinerProps {
  onRoomJoined: (room: GameRoom) => void;
  onBack: () => void;
  walletAddress: string;
  username: string;
}

const GameRoomJoiner: React.FC<GameRoomJoinerProps> = ({
  onRoomJoined,
  onBack,
  walletAddress,
  username
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [blockNumber, setBlockNumber] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);

  const validateRoomCode = () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return false;
    }

    // Check if the room code is in the correct format (6 alphanumeric characters)
    const isValid = /^[A-Z0-9]{6}$/.test(roomCode);

    if (!isValid) {
      toast.error("Invalid room code format", {
        description: "Room code should be 6 alphanumeric characters"
      });
      return false;
    }

    return true;
  };

  const checkRoomCode = async () => {
    if (!validateRoomCode()) return;

    setIsValidatingCode(true);

    try {
      // Simulate API call to check if room exists
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes, we'll assume the room exists if the code is valid format
      setIsCodeValid(true);

      toast.success("Room found!", {
        description: "You can now join this game room"
      });
    } catch (error) {
      console.error("Error validating room:", error);
      setIsCodeValid(false);
      toast.error("Room not found");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const joinRoom = async () => {
    if (!validateRoomCode()) return;

    setIsJoining(true);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate transaction hash and block number
      const txHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      const blockNum = Math.floor(Math.random() * 1000000) + 8000000;

      setTransactionHash(txHash);
      setBlockNumber(blockNum);

      // Create the room object
      const joinedRoom: GameRoom = {
        id: `room-${Date.now()}`,
        roomCode: roomCode,
        creatorAddress: `0x${Math.random().toString(16).substring(2, 42)}`, // Simulated creator address
        creatorUsername: "Player1", // Simulated creator name
        opponentAddress: walletAddress,
        opponentUsername: username,
        status: 'playing',
        createdAt: Date.now() - 300000, // 5 minutes ago
        gameId: Math.floor(Math.random() * 1000000),
        transactionHash: txHash,
        blockNumber: blockNum
      };

      // Notify parent component
      onRoomJoined(joinedRoom);

      toast.success("Joined game room!", {
        description: `Connected to room ${roomCode}`,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join game room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="glassmorphism border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white">Join Game Room</CardTitle>
        <CardDescription>Enter a room code to join a friend's game</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roomCode">Room Code</Label>
          <div className="flex space-x-2">
            <Input
              id="roomCode"
              placeholder="Enter 6-digit room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="bg-black/20 border-gray-700 font-mono tracking-wider text-center uppercase"
              maxLength={6}
              disabled={isJoining}
            />
            <Button
              variant="outline"
              onClick={checkRoomCode}
              disabled={isValidatingCode || isJoining || !roomCode.trim()}
              className="border-blue-500/30 text-blue-400"
            >
              {isValidatingCode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>

          {isCodeValid === true && (
            <p className="text-xs text-green-400 mt-1">Room found! You can now join.</p>
          )}

          {isCodeValid === false && (
            <p className="text-xs text-red-400 mt-1">Room not found. Please check the code.</p>
          )}
        </div>

        {transactionHash && (
          <div className="mt-4 p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
            <h3 className="text-sm font-semibold text-white mb-2">Transaction Details</h3>

            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Transaction Hash:</span>
                <a
                  href={getTransactionExplorerUrl(transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 font-mono flex items-center"
                >
                  {truncateHash(transactionHash, 10, 8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between">
                <span>Block Number:</span>
                <a
                  href={getBlockExplorerUrl(blockNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 font-mono flex items-center"
                >
                  {blockNumber}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Transaction is being processed on the MONAD blockchain
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isJoining}
        >
          Back
        </Button>

        <Button
          onClick={joinRoom}
          disabled={isJoining || !isCodeValid}
          className="bg-gradient-to-r from-blue-400 to-indigo-500"
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join Room
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameRoomJoiner;
