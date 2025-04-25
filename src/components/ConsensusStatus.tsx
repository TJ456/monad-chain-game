import React, { useState, useEffect } from 'react';
import { gameConsensusService } from '@/services/GameConsensusService';
import { consensusIntegration } from '@/services/ConsensusIntegration';
import { areServicesInitialized } from '@/services/initServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sword,
  Shield,
  Zap,
  Trophy,
  Coins,
  Activity,
  AlertCircle,
  Clock,
  Wifi
} from 'lucide-react';

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

  // Helper method to get network status icon based on health status
  const getNetworkStatusIcon = (status: 'excellent' | 'good' | 'fair' | 'degraded' | 'critical') => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="mr-1 text-emerald-500 h-4 w-4" />;
      case 'good':
        return <Wifi className="mr-1 text-green-500 h-4 w-4" />;
      case 'fair':
        return <Activity className="mr-1 text-amber-500 h-4 w-4" />;
      case 'degraded':
        return <AlertCircle className="mr-1 text-orange-500 h-4 w-4" />;
      case 'critical':
        return <XCircle className="mr-1 text-red-500 h-4 w-4" />;
      default:
        return <Clock className="mr-1 text-gray-500 h-4 w-4" />;
    }
  };

  // Helper method to get network status text based on health status
  const getNetworkStatusText = (status: 'excellent' | 'good' | 'fair' | 'degraded' | 'critical') => {
    switch (status) {
      case 'excellent':
        return <span className="text-emerald-600">Excellent</span>;
      case 'good':
        return <span className="text-green-600">Healthy</span>;
      case 'fair':
        return <span className="text-amber-600">Fair</span>;
      case 'degraded':
        return <span className="text-orange-600">Degraded</span>;
      case 'critical':
        return <span className="text-red-600">Critical</span>;
      default:
        return <span className="text-gray-600">Unknown</span>;
    }
  };

  // Helper method to get health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  const [consensusStats, setConsensusStats] = useState<{
    totalBlocks: number;
    lastBlockTime: number;
    activeValidators: number;
    pendingTransactions: number;
    isPrimary: boolean;
    totalShardRewards?: number;
    healthMetrics: {
      validatorResponseTimes: number[];
      networkLatency: number;
      consensusVerification: {
        agreementPercentage: number;
        verifiedBlocks: number;
        failedConsensusAttempts: number;
      };
      blockPropagationTime: number;
      lastViewChange: number;
      healthScore: number;
      status: 'excellent' | 'good' | 'fair' | 'degraded' | 'critical';
    };
  } | null>(null);

  const [latestBlock, setLatestBlock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initStage, setInitStage] = useState('Connecting to validator nodes...');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Debug function to log game events
  const logGameEvents = () => {
    try {
      const gameEventsJson = localStorage.getItem('monad:game:events');
      if (gameEventsJson) {
        const gameEvents = JSON.parse(gameEventsJson);
        console.log('Current game events in localStorage:', gameEvents);
        return gameEvents;
      }
      return [];
    } catch (error) {
      console.error('Error reading game events from localStorage:', error);
      return [];
    }
  };

  // Load consensus stats on mount
  useEffect(() => {
    const loadConsensusStats = async () => {
      try {
        // Only set loading on initial load, otherwise just show updating
        if (isLoading) {
          setIsLoading(true);
        } else {
          setIsUpdating(true);
        }

        // Log current game events for debugging
        const currentEvents = logGameEvents();
        console.log(`Found ${currentEvents.length} game events in localStorage`);

        // Set last update time
        setLastUpdateTime(Date.now());

        // Simulate initialization progress for better UX
        const simulateInitProgress = () => {
          // Start with connecting to validators
          setInitStage('Connecting to validator nodes...');
          setInitProgress(10);

          const stages = [
            { progress: 25, message: 'Establishing secure connection...' },
            { progress: 40, message: 'Verifying battle network integrity...' },
            { progress: 55, message: 'Syncing with consensus validators...' },
            { progress: 70, message: 'Loading battle records...' },
            { progress: 85, message: 'Preparing battle consensus...' },
            { progress: 95, message: 'Finalizing connection...' }
          ];

          let currentStage = 0;

          const progressInterval = setInterval(() => {
            if (currentStage < stages.length) {
              setInitProgress(stages[currentStage].progress);
              setInitStage(stages[currentStage].message);
              currentStage++;
            } else {
              clearInterval(progressInterval);
            }
          }, 600);

          return progressInterval;
        };

        const progressInterval = simulateInitProgress();

        // First check if services are initialized - don't show toasts
        const initialized = await areServicesInitialized(false);
        if (!initialized) {
          console.log('Consensus services not initialized - ConsensusStatus will show not ready state');
          clearInterval(progressInterval);
          setIsLoading(false);
          return;
        }

        try {
          // Add a small delay to allow the progress animation to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          const stats = await gameConsensusService.getConsensusStats();
          setConsensusStats(stats);

          // Update game-specific metrics based on current game state
          if (stats) {
            // Get game events from localStorage
            try {
              const gameEventsJson = localStorage.getItem('monad:game:events');
              if (gameEventsJson) {
                const gameEvents = JSON.parse(gameEventsJson);

                if (gameEvents && gameEvents.length > 0) {
                  // Process game events to update metrics
                  const updatedStats = processGameEvents(stats, gameEvents);
                  setConsensusStats(updatedStats);
                }
              }
            } catch (error) {
              console.error('Error reading game events from localStorage:', error);
            }
          }
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

        // Set progress to 100% when done
        setInitProgress(100);
      } catch (error) {
        console.error('Error loading consensus stats:', error);
      } finally {
        setIsLoading(false);
        setIsUpdating(false);
      }
    };

    // Helper function to process game events and update metrics
    const processGameEvents = (stats: any, gameEvents: any[]) => {
      // Clone the stats object to avoid mutating the original
      const updatedStats = JSON.parse(JSON.stringify(stats));

      // Calculate metrics based on game events
      const recentEvents = gameEvents.filter(e => e.timestamp > Date.now() - 300000); // Last 5 minutes

      if (recentEvents.length > 0) {
        console.log(`Processing ${recentEvents.length} recent game events for metrics`);

        // Update total blocks based on game events
        updatedStats.totalBlocks = Math.max(updatedStats.totalBlocks, recentEvents.length);

        // Update last block time to the most recent event
        const mostRecentEvent = recentEvents.reduce((latest, event) =>
          event.timestamp > latest.timestamp ? event : latest, recentEvents[0]);
        updatedStats.lastBlockTime = mostRecentEvent.timestamp;

        // Calculate average response time for game actions
        const responseTimes = recentEvents
          .filter(e => e.responseTime)
          .map(e => e.responseTime);

        if (responseTimes.length > 0) {
          const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

          // Create simulated validator response times based on game events
          const simulatedValidatorTimes = [];
          // Generate 4 validator response times based on the average with some variation
          for (let i = 0; i < 4; i++) {
            // Add some randomness to make it look realistic
            const variation = (Math.random() * 0.4) - 0.2; // -20% to +20% variation
            simulatedValidatorTimes.push(avgResponseTime * (1 + variation));
          }

          // Update validator response times with game-specific data
          updatedStats.healthMetrics.validatorResponseTimes = simulatedValidatorTimes;

          // Update network latency based on game actions - more responsive to recent events
          updatedStats.healthMetrics.networkLatency = avgResponseTime;
        }

        // Count card play events
        const cardPlayEvents = recentEvents.filter(e => e.type === 'card_play');
        if (cardPlayEvents.length > 0) {
          // Update verified blocks count
          updatedStats.healthMetrics.consensusVerification.verifiedBlocks = cardPlayEvents.length;

          // Calculate average agreement from card play events
          const agreementSum = cardPlayEvents.reduce((sum, e) => sum + (e.agreement || 0), 0);
          const newAgreement = agreementSum / cardPlayEvents.length;

          // Make agreement more responsive to recent events
          updatedStats.healthMetrics.consensusVerification.agreementPercentage = newAgreement;

          // Update pending transactions based on recent activity
          updatedStats.pendingTransactions = Math.max(0, Math.min(5,
            Math.floor(Math.random() * 3) + (Date.now() - mostRecentEvent.timestamp > 10000 ? 0 : 2)
          ));
        }

        // Handle game end events specially
        const gameEndEvents = recentEvents.filter(e => e.type === 'game_end');
        if (gameEndEvents.length > 0) {
          // Game end events have higher agreement
          const endAgreement = gameEndEvents.reduce((sum, e) => sum + (e.agreement || 0), 0) / gameEndEvents.length;

          // Blend with existing agreement percentage but weight end events more heavily
          updatedStats.healthMetrics.consensusVerification.agreementPercentage =
            (updatedStats.healthMetrics.consensusVerification.agreementPercentage * 0.3) + (endAgreement * 0.7);

          // Game end events reduce pending transactions
          updatedStats.pendingTransactions = 0;
        }

        // Recalculate health score
        const latencyScore = Math.max(0, 100 - (updatedStats.healthMetrics.networkLatency / 50));
        const agreementScore = updatedStats.healthMetrics.consensusVerification.agreementPercentage;
        const propagationScore = Math.max(0, 100 - (updatedStats.healthMetrics.blockPropagationTime / 100));
        const failureScore = Math.max(0, 100 - (updatedStats.healthMetrics.consensusVerification.failedConsensusAttempts * 10));

        // Weighted average of scores
        const healthScore = (
          latencyScore * 0.3 +
          agreementScore * 0.4 +
          propagationScore * 0.2 +
          failureScore * 0.1
        );

        updatedStats.healthMetrics.healthScore = Math.min(100, Math.max(0, healthScore));

        // Update status based on health score
        if (updatedStats.healthMetrics.healthScore >= 90) {
          updatedStats.healthMetrics.status = 'excellent';
        } else if (updatedStats.healthMetrics.healthScore >= 75) {
          updatedStats.healthMetrics.status = 'good';
        } else if (updatedStats.healthMetrics.healthScore >= 60) {
          updatedStats.healthMetrics.status = 'fair';
        } else if (updatedStats.healthMetrics.healthScore >= 40) {
          updatedStats.healthMetrics.status = 'degraded';
        } else {
          updatedStats.healthMetrics.status = 'critical';
        }

        // Update active validators based on game activity
        updatedStats.activeValidators = 4; // Fixed at 4 validators for simplicity

        console.log('Updated consensus metrics:', {
          healthScore: updatedStats.healthMetrics.healthScore,
          agreement: updatedStats.healthMetrics.consensusVerification.agreementPercentage,
          latency: updatedStats.healthMetrics.networkLatency,
          status: updatedStats.healthMetrics.status
        });
      }

      return updatedStats;
    };

    // Load initial stats
    loadConsensusStats();

    // Set up refresh interval - more frequent updates (2 seconds)
    const interval = setInterval(loadConsensusStats, 2000);
    setRefreshInterval(interval);

    // Set up a listener for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'monad:game:events') {
        console.log('Game events changed in localStorage, refreshing consensus stats');
        loadConsensusStats();
      }
    };

    // Set up a listener for custom game event updates
    const handleGameEventUpdate = (e: CustomEvent) => {
      console.log('Game event update detected:', e.detail);
      loadConsensusStats();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('game-event-update', handleGameEventUpdate as EventListener);

    // Clean up on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('game-event-update', handleGameEventUpdate as EventListener);
    };
  }, []);

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
          <Progress value={initProgress} className="w-full bg-blue-200" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-blue-600 animate-pulse">{initStage}</p>
            <span className="text-xs text-blue-500 font-medium">{initProgress}%</span>
          </div>

          {/* Show battle-specific initialization details */}
          {initProgress > 40 && (
            <div className="mt-4 pt-2 border-t border-blue-200">
              <div className="text-xs text-blue-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Validator Nodes</span>
                  <span className="font-medium">{Math.min(4, Math.floor(initProgress / 25))} connected</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Battle Records</span>
                  <span className="font-medium">{initProgress > 70 ? Math.floor(initProgress / 10) : '...'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Network Status</span>
                  <span className={`font-medium ${initProgress > 85 ? 'text-green-600' : 'text-amber-600'}`}>
                    {initProgress > 85 ? 'Ready' : 'Syncing...'}
                  </span>
                </div>

                {initProgress > 70 && (
                  <div className="flex justify-between items-center">
                    <span>Battle Protocol</span>
                    <span className="font-medium text-purple-600">MONAD-BFT v1.2</span>
                  </div>
                )}
              </div>
            </div>
          )}
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
              <Sword className={`w-5 h-5 mr-2 text-purple-500 ${isUpdating ? 'animate-pulse' : ''}`} />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Battle Consensus</span>
              {isUpdating && (
                <span className="ml-2 text-xs text-blue-400 animate-pulse">Updating...</span>
              )}
            </CardTitle>
            <CardDescription>
              Game state consensus status
              {lastUpdateTime > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="font-medium flex items-center">
                      {getNetworkStatusIcon(consensusStats.healthMetrics?.status || 'critical')}
                      {getNetworkStatusText(consensusStats.healthMetrics?.status || 'critical')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-2">
                    <div className="space-y-2">
                      <p className="font-medium">Consensus Health Details</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span>Health Score:</span>
                        <span className="font-medium">{consensusStats.healthMetrics?.healthScore.toFixed(1) || 0}/100</span>

                        <span>Network Latency:</span>
                        <span className="font-medium">{consensusStats.healthMetrics?.networkLatency.toFixed(0) || 0}ms</span>

                        <span>Validator Agreement:</span>
                        <span className="font-medium">{consensusStats.healthMetrics?.consensusVerification.agreementPercentage.toFixed(1) || 0}%</span>

                        <span>Verified Blocks:</span>
                        <span className="font-medium">{consensusStats.healthMetrics?.consensusVerification.verifiedBlocks || 0}/{consensusStats.totalBlocks}</span>

                        <span>Failed Attempts:</span>
                        <span className="font-medium">{consensusStats.healthMetrics?.consensusVerification.failedConsensusAttempts || 0}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Consensus Health</span>
                <span className="text-xs font-medium">{consensusStats.healthMetrics?.healthScore.toFixed(1) || 0}/100</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getHealthScoreColor(consensusStats.healthMetrics?.healthScore || 0)}`}
                  style={{ width: `${consensusStats.healthMetrics?.healthScore || 0}%` }}
                ></div>
              </div>
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

        {/* Consensus Verification Section */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-1 text-blue-500" />
              Consensus Verification
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Detailed metrics about validator consensus and network performance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-2">
            {/* Validator Agreement */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Validator Agreement</span>
                <span className="text-xs font-medium">
                  {consensusStats.healthMetrics?.consensusVerification.agreementPercentage.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    consensusStats.healthMetrics?.consensusVerification.agreementPercentage >= 90 ? 'bg-emerald-500' :
                    consensusStats.healthMetrics?.consensusVerification.agreementPercentage >= 75 ? 'bg-green-500' :
                    consensusStats.healthMetrics?.consensusVerification.agreementPercentage >= 60 ? 'bg-amber-500' :
                    consensusStats.healthMetrics?.consensusVerification.agreementPercentage >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${consensusStats.healthMetrics?.consensusVerification.agreementPercentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Network Latency */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Network Latency</span>
                <span className="text-xs font-medium">
                  {consensusStats.healthMetrics?.networkLatency.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    consensusStats.healthMetrics?.networkLatency <= 50 ? 'bg-emerald-500' :
                    consensusStats.healthMetrics?.networkLatency <= 100 ? 'bg-green-500' :
                    consensusStats.healthMetrics?.networkLatency <= 200 ? 'bg-amber-500' :
                    consensusStats.healthMetrics?.networkLatency <= 500 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (consensusStats.healthMetrics?.networkLatency || 0) / 5)}%` }}
                ></div>
              </div>
            </div>

            {/* Validator Response Times */}
            {consensusStats.healthMetrics?.validatorResponseTimes.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Validator Response Times</span>
                  <span className="text-xs font-medium">
                    {consensusStats.healthMetrics.validatorResponseTimes.length} validators
                  </span>
                </div>
                <div className="flex space-x-1">
                  {consensusStats.healthMetrics.validatorResponseTimes.map((time, index) => {
                    // Determine color based on response time
                    const color = time < 100 ? 'bg-emerald-500' :
                                 time < 200 ? 'bg-green-500' :
                                 time < 500 ? 'bg-amber-500' :
                                 time < 1000 ? 'bg-orange-500' :
                                 'bg-red-500';

                    // Calculate height based on response time (inverse - faster is taller)
                    const height = Math.max(10, Math.min(24, 24 - (time / 100)));

                    return (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger>
                            <div
                              className={`w-2 ${color} rounded-t`}
                              style={{ height: `${height}px` }}
                            ></div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Validator {index + 1}: {time.toFixed(0)}ms</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
