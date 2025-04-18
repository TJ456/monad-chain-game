import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card as UICard } from "@/components/ui/card";
import GameCard from '@/components/GameCard';
import MonadStatus from '@/components/MonadStatus';
import ShardManager from '@/components/ShardManager';
import MonadBoostMechanic from '@/components/MonadBoostMechanic';
import GameRoomSelector from '@/components/GameRoomSelector';
import GameModeMenu from '@/components/GameModeMenu';
import GameRoomManager from '@/components/GameRoomManager';
import TurnTimer from '@/components/TurnTimer';
import GameSyncStatus from '@/components/GameSyncStatus';
import GameTransactionOverlay from '@/components/GameTransactionOverlay';
import PlayerInventory from '@/components/PlayerInventory';
import { Transaction } from '@/components/BlockchainTransactionInfo';
import WebSocketService from '@/services/WebSocketService';
import GameSyncService from '@/services/GameSyncService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toast } from "sonner";
import { cards, currentPlayer, monadGameState } from '@/data/gameData';
import { Card as GameCardType, MonadGameMove, AIDifficultyTier, Player as PlayerType, MovesBatch, GameMode, GameRoom } from '@/types/game';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Shield, Sword, Zap } from 'lucide-react';
import { aiStrategies, selectCardNovice, selectCardVeteran, selectCardLegend, getAIThinkingMessage, enhanceAICards } from '@/data/aiStrategies';
import { monadGameService } from '@/services/MonadGameService';

// Import the rest of your dependencies...

const Game = () => {
  // Your existing state variables...
  const { toast: uiToast } = useToast();
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [opponentCards, setOpponentCards] = useState<GameCardType[]>([]);
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameStatus, setGameStatus] = useState<'mode_select' | 'room_select' | 'gameroom' | 'inventory' | 'waiting' | 'playing' | 'end'>('mode_select');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  
  // WebSocket and sync state
  const [wsConnected, setWsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTransactionConfirmation, setShowTransactionConfirmation] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    timestamp: number;
  } | null>(null);
  
  // Your other state variables...
  
  // Initialize WebSocket and game sync service
  useEffect(() => {
    const initializeBlockchain = async () => {
        try {
            // Connect wallet
            const address = await monadGameService.connectWallet();
            setWalletAddress(address);
            setWalletConnected(true);

            // Check if player is registered
            const playerData = await monadGameService.getPlayerData(address);
            setIsRegistered(!!playerData);
            
            // Initialize WebSocket connection
            const wsService = WebSocketService.getInstance();
            const syncService = GameSyncService.getInstance();
            
            // Set up WebSocket connection listeners
            wsService.addConnectionStatusListener((connected) => {
              setWsConnected(connected);
              if (connected) {
                toast.success("Connected to game server", {
                  description: "Real-time updates enabled"
                });
              } else {
                toast.error("Disconnected from game server", {
                  description: "Attempting to reconnect..."
                });
              }
            });
            
            // Set up sync status listeners
            syncService.addSyncStatusListener((syncing) => {
              setIsSyncing(syncing);
            });
            
            // Set up transaction update listeners
            syncService.addTransactionUpdateListener((update) => {
              setTransactionDetails({
                hash: update.transactionHash,
                status: update.status,
                blockNumber: update.blockNumber,
                timestamp: update.timestamp
              });
              
              if (update.status === 'confirmed') {
                setShowTransactionConfirmation(true);
                // Auto-hide after 5 seconds
                setTimeout(() => setShowTransactionConfirmation(false), 5000);
              }
            });
            
            // Connect to WebSocket server
            wsService.connect(address || 'anonymous');
        } catch (error) {
            console.error("Blockchain initialization error:", error);
            toast.error("Failed to connect to blockchain");
        }
    };

    initializeBlockchain();
    
    // Clean up on unmount
    return () => {
      const wsService = WebSocketService.getInstance();
      wsService.disconnect();
    };
  }, []);
  
  // Your existing functions...
  
  // Add the turn timer expiration handler
  const handleTurnTimeExpired = () => {
    // When the turn timer expires, automatically end the player's turn
    if (currentTurn === 'player' && gameStatus === 'playing') {
      const message = "Turn time expired! Your turn has ended.";
      setBattleLog(prev => [...prev, message]);
      toast.warning("Turn time expired", {
        description: "Your turn has automatically ended"
      });
      setTurnTimeExpired(true);
      endTurn('opponent');
    }
  };
  
  // Your render function...
  const renderGameContent = () => {
    // Your existing render logic...
  };
  
  return (
    <div>
      {renderGameContent()}
      
      {/* Transaction Overlay */}
      <GameTransactionOverlay
        showTransactionConfirmation={showTransactionConfirmation}
        transactionDetails={transactionDetails}
        onClose={() => setShowTransactionConfirmation(false)}
      />
    </div>
  );
};

export default Game;
