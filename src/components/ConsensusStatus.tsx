import React, { useState, useEffect } from 'react';
import { gameConsensusService } from '@/services/GameConsensusService';
import { consensusIntegration } from '@/services/ConsensusIntegration';
import { areServicesInitialized } from '@/services/initServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { CheckCircle, XCircle, AlertTriangle, Sword, Shield, Zap, Trophy, Coins } from 'lucide-react';

/**
 * ConsensusStatus - Component to display the current consensus status
 *
 * Shows:
 * - Current block number
 * - Validator count
 * - Primary validator status
 * - Consensus health
 * - Recent blocks
 */
export function ConsensusStatus() {
  // Helper method to get battle difficulty from block data
  const getBattleDifficulty = (block: any): string => {
    if (!block || !block.transactions || block.transactions.length === 0) {
      return 'Normal';
    }

    try {
      // Try to parse the first transaction to get battle data
      const txData = JSON.parse(block.transactions[0]);
      if (txData.battleData && txData.battleData.battleDifficulty) {
        // Capitalize first letter
        const difficulty = txData.battleData.battleDifficulty;
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      }
    } catch (error) {
      console.warn('Error parsing battle difficulty:', error);
    }

    // Default difficulty
    return 'Normal';
  };
  const [consensusStats, setConsensusStats] = useState<{
    totalBlocks: number;
    lastBlockTime: number;
    activeValidators: number;
    pendingTransactions: number;
    isPrimary: boolean;
    totalShardRewards?: number;
  } | null>(null);

  const [latestBlock, setLatestBlock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load consensus stats on mount
  useEffect(() => {
    const loadConsensusStats = async () => {
      try {
        setIsLoading(true);

        // First check if services are initialized - don't show toasts
        const initialized = await areServicesInitialized(false);
        if (!initialized) {
          console.log('Consensus services not initialized - ConsensusStatus will show not ready state');
          setIsLoading(false);
          return;
        }

        try {
          const stats = await gameConsensusService.getConsensusStats();
          setConsensusStats(stats);
        } catch (statsError) {
          console.error('Error getting consensus stats:', statsError);
          // Don't fail completely if just stats fail
        }

        try {
          const block = await consensusIntegration.getLatestBlock();
          setLatestBlock(block);
        } catch (blockError) {
          console.error('Error getting latest block:', blockError);
          // Don't fail completely if just block retrieval fails
        }
      } catch (error) {
        console.error('Error loading consensus stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load initial stats
    loadConsensusStats();

    // Set up refresh interval
    const interval = setInterval(loadConsensusStats, 5000);
    setRefreshInterval(interval);

    // Clean up on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Calculate time since last block
  const getTimeSinceLastBlock = () => {
    if (!consensusStats?.lastBlockTime) return 'Unknown';

    const seconds = Math.floor((Date.now() - consensusStats.lastBlockTime) / 1000);

    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes ago`;
    } else {
      return `${Math.floor(seconds / 3600)} hours ago`;
    }
  };

  // Render loading state
  if (isLoading && !consensusStats) {
    return (
      <Card className="w-full border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sword className="w-5 h-5 mr-2 text-blue-500 animate-pulse" />
            <span className="text-blue-700">Battle Consensus</span>
          </CardTitle>
          <CardDescription>Initializing battle network...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={80} className="w-full bg-blue-200" />
          <p className="text-sm text-blue-600 mt-2 animate-pulse">Connecting to validator nodes...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (!consensusStats) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sword className="w-5 h-5 mr-2 text-amber-500" />
            <span className="text-amber-700">Battle Network Offline</span>
          </CardTitle>
          <CardDescription>Battle consensus system not initialized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-amber-600 bg-amber-100 p-2 rounded-md">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Battle network not connected</span>
            </div>
            <p className="text-sm text-amber-700">
              Initialize the battle consensus system to start recording your game battles on the Monad blockchain.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Sword className="w-5 h-5 mr-2 text-purple-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Battle Consensus</span>
            </CardTitle>
            <CardDescription>Game state consensus status</CardDescription>
          </div>
          {consensusStats.isPrimary && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Battle Master Node
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                Battle Block
              </span>
              <span className="font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md text-xs">
                #{latestBlock?.number || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <Shield className="w-4 h-4 mr-1 text-blue-500" />
                Validators
              </span>
              <span className="font-medium">{consensusStats.activeValidators}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <Sword className="w-4 h-4 mr-1 text-red-500" />
                Pending Battles
              </span>
              <span className="font-medium">{consensusStats.pendingTransactions}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <Trophy className="w-4 h-4 mr-1 text-amber-500" />
                Last Battle
              </span>
              <span className="font-medium">{getTimeSinceLastBlock()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <Coins className="w-4 h-4 mr-1 text-green-500" />
                Total Battles
              </span>
              <span className="font-medium">{consensusStats.totalBlocks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network Status</span>
              <span className="font-medium flex items-center">
                <CheckCircle className="mr-1 text-green-500 h-4 w-4" />
                Healthy
              </span>
            </div>
          </div>
        </div>

        {latestBlock && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                Latest Battle Record
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cryptographically verified battle record on the Monad blockchain</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Battle Hash</span>
                <span className="font-mono bg-gray-100 px-1 rounded text-xs">{latestBlock.merkleRoot?.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Card Moves</span>
                <span className="text-blue-600 font-medium">{latestBlock.transactions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Battle Time</span>
                <span>{new Date(latestBlock.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shard Rewards</span>
                <span className="text-green-600 font-medium">
                  {consensusStats.totalShardRewards ?
                    Math.floor(consensusStats.totalShardRewards / consensusStats.totalBlocks) : 0}
                </span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="font-medium">Battle Difficulty</span>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                  {getBattleDifficulty(latestBlock)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
