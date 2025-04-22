import React, { useState, useEffect } from 'react';
import { gameConsensusService } from '@/services/GameConsensusService';
import { consensusIntegration } from '@/services/ConsensusIntegration';
import { areServicesInitialized } from '@/services/initServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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
  const [consensusStats, setConsensusStats] = useState<{
    totalBlocks: number;
    lastBlockTime: number;
    activeValidators: number;
    pendingTransactions: number;
    isPrimary: boolean;
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Consensus Status</CardTitle>
          <CardDescription>Loading consensus information...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={80} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (!consensusStats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Consensus Status</CardTitle>
          <CardDescription>Consensus system not initialized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-amber-500">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Consensus service not ready</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please initialize the consensus system using the controls on the left.
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
            <CardTitle>Monad BFT Consensus</CardTitle>
            <CardDescription>Game state consensus status</CardDescription>
          </div>
          {consensusStats.isPrimary && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Primary Validator
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Latest Block</span>
              <span className="font-medium">{latestBlock?.number || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Validators</span>
              <span className="font-medium">{consensusStats.activeValidators}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending Tx</span>
              <span className="font-medium">{consensusStats.pendingTransactions}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Block</span>
              <span className="font-medium">{getTimeSinceLastBlock()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Blocks</span>
              <span className="font-medium">{consensusStats.totalBlocks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
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
              <span className="text-sm font-medium">Latest Block Info</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Block information from the Monad BFT consensus</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Block Hash</span>
                <span className="font-mono">{latestBlock.merkleRoot?.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions</span>
                <span>{latestBlock.transactions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp</span>
                <span>{new Date(latestBlock.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
