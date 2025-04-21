import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
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
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<string>('good');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsService = WebSocketService.getInstance();
  const syncService = GameSyncService.getInstance();

  useEffect(() => {
    // Listen for connection status changes
    wsService.addConnectionStatusListener(handleConnectionStatus);

    // Listen for sync status changes
    syncService.addSyncStatusListener(handleSyncStatus);

    // Listen for game state updates
    syncService.addStateUpdateListener(handleGameStateUpdate);

    // Listen for connection quality changes
    wsService.addConnectionQualityListener(handleConnectionQuality);

    // Check initial connection status
    setConnected(wsService.isConnected());

    // Set up reconnection attempt tracking
    const reconnectTracker = setInterval(() => {
      if (!wsService.isConnected()) {
        setReconnectAttempts(prev => prev + 1);
        setReconnecting(true);
      } else {
        setReconnectAttempts(0);
        setReconnecting(false);
      }
    }, 5000);

    return () => {
      wsService.removeConnectionStatusListener(handleConnectionStatus);
      syncService.removeSyncStatusListener(handleSyncStatus);
      syncService.removeStateUpdateListener(handleGameStateUpdate);
      wsService.removeConnectionQualityListener(handleConnectionQuality);
      clearInterval(reconnectTracker);
    };
  }, []);

  const handleConnectionStatus = (isConnected: boolean) => {
    setConnected(isConnected);

    if (isConnected && reconnecting) {
      // Connection restored
      setReconnecting(false);
      setReconnectAttempts(0);
      toast.success('Connection restored', {
        description: 'Successfully reconnected to the game server'
      });

      // Request sync to ensure game state is up to date
      syncService.requestSync();
    }
  };

  const handleSyncStatus = (isSyncing: boolean) => {
    setSyncing(isSyncing);
  };

  const handleGameStateUpdate = (state: GameState) => {
    setLastSyncTime(state.lastSyncTime);
    setTransactionStatus(state.transactionStatus || null);
    setBlockNumber(state.blockNumber || null);
  };

  const handleConnectionQuality = (quality: { quality: string, latency: number, packetLoss: number }) => {
    setConnectionQuality(quality.quality);
  };

  const handleManualSync = useCallback(() => {
    if (!connected) {
      // Try to reconnect if not connected
      toast.info('Attempting to reconnect...', {
        description: 'Trying to establish connection to the game server'
      });

      // Force reconnection
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect(localStorage.getItem('userId') || 'anonymous');
      }, 500);
      return;
    }

    syncService.requestSync();
  }, [connected]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getConnectionStatusIcon = () => {
    if (connected) {
      // Show different icons based on connection quality
      if (connectionQuality === 'excellent' || connectionQuality === 'good') {
        return <Wifi className="h-4 w-4 text-emerald-400" />;
      } else if (connectionQuality === 'fair') {
        return <Wifi className="h-4 w-4 text-amber-400" />;
      } else {
        return <Wifi className="h-4 w-4 text-orange-400" />;
      }
    } else if (reconnecting) {
      return <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />;
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
              <span className="ml-1">
                {connected
                  ? connectionQuality === 'excellent' || connectionQuality === 'good'
                    ? 'Connected'
                    : `Connected (${connectionQuality})`
                  : reconnecting
                    ? 'Reconnecting...'
                    : 'Disconnected'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {connected
                ? connectionQuality === 'excellent' || connectionQuality === 'good'
                  ? 'Connected to game server with good signal'
                  : `Connected to game server with ${connectionQuality} signal`
                : reconnecting
                  ? `Reconnecting to game server... (attempt ${reconnectAttempts})`
                  : 'Not connected to game server. Click refresh to try again.'}
            </p>
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
        disabled={syncing}
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
      </Button>
    </div>
  );
};

export default GameSyncStatus;
