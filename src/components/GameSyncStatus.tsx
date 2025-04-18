import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Check, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WebSocketService from '@/services/WebSocketService';
import GameSyncService, { GameState } from '@/services/GameSyncService';

interface GameSyncStatusProps {
  roomCode: string;
}

const GameSyncStatus: React.FC<GameSyncStatusProps> = ({ roomCode }) => {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'confirmed' | 'failed' | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  
  const wsService = WebSocketService.getInstance();
  const syncService = GameSyncService.getInstance();
  
  useEffect(() => {
    // Listen for connection status changes
    wsService.addConnectionStatusListener(handleConnectionStatus);
    
    // Listen for sync status changes
    syncService.addSyncStatusListener(handleSyncStatus);
    
    // Listen for game state updates
    syncService.addStateUpdateListener(handleGameStateUpdate);
    
    return () => {
      wsService.removeConnectionStatusListener(handleConnectionStatus);
      syncService.removeSyncStatusListener(handleSyncStatus);
      syncService.removeStateUpdateListener(handleGameStateUpdate);
    };
  }, []);
  
  const handleConnectionStatus = (isConnected: boolean) => {
    setConnected(isConnected);
  };
  
  const handleSyncStatus = (isSyncing: boolean) => {
    setSyncing(isSyncing);
  };
  
  const handleGameStateUpdate = (state: GameState) => {
    setLastSyncTime(state.lastSyncTime);
    setTransactionStatus(state.transactionStatus || null);
    setBlockNumber(state.blockNumber || null);
  };
  
  const handleManualSync = () => {
    syncService.requestSync();
  };
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const getConnectionStatusIcon = () => {
    if (connected) {
      return <Wifi className="h-4 w-4 text-emerald-400" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />;
    }
  };
  
  const getSyncStatusIcon = () => {
    if (syncing) {
      return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
    } else if (lastSyncTime) {
      return <Check className="h-4 w-4 text-emerald-400" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
  };
  
  const getTransactionStatusIcon = () => {
    if (!transactionStatus) return null;
    
    switch (transactionStatus) {
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />;
      case 'confirmed':
        return <Check className="h-4 w-4 text-emerald-400" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };
  
  const getTransactionStatusText = () => {
    if (!transactionStatus) return null;
    
    switch (transactionStatus) {
      case 'pending':
        return 'Transaction pending...';
      case 'confirmed':
        return `Confirmed in block #${blockNumber}`;
      case 'failed':
        return 'Transaction failed';
    }
  };
  
  return (
    <div className="flex items-center space-x-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {getConnectionStatusIcon()}
              <span className="ml-1">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{connected ? 'Connected to game server' : 'Not connected to game server'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <span className="text-gray-500">|</span>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {getSyncStatusIcon()}
              <span className="ml-1">
                {syncing ? 'Syncing...' : lastSyncTime ? `Synced ${formatTime(lastSyncTime)}` : 'Not synced'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{syncing 
              ? 'Synchronizing game state with server' 
              : lastSyncTime 
                ? `Last synchronized at ${formatTime(lastSyncTime)}` 
                : 'Game state not synchronized'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {transactionStatus && (
        <>
          <span className="text-gray-500">|</span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {getTransactionStatusIcon()}
                  <span className="ml-1">{getTransactionStatusText()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{transactionStatus === 'confirmed' 
                  ? `Transaction confirmed in block #${blockNumber}` 
                  : transactionStatus === 'pending' 
                    ? 'Transaction is being processed on the blockchain' 
                    : 'Transaction failed to process'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleManualSync}
        disabled={syncing || !connected}
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
      </Button>
    </div>
  );
};

export default GameSyncStatus;
