import React, { useState, useEffect } from 'react';
import { monadDbIntegration } from '../services/MonadDbIntegration';
import { stateSyncService } from '../services/StateSyncService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Database, Server, Activity, RefreshCw, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Component for displaying state sync status and controls
 */
export function StateSyncStatus() {
  const [syncStatuses, setSyncStatuses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [targetBlock, setTargetBlock] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Initialize services if not already initialized
  useEffect(() => {
    const init = async () => {
      try {
        await monadDbIntegration.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    if (!isInitialized) {
      init();
    }
  }, [isInitialized]);

  // Refresh data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get sync statuses
        const allStatuses = stateSyncService.getAllSyncStatuses();
        setSyncStatuses(allStatuses);

        // Get stats
        const syncStats = monadDbIntegration.getStateSyncStats();
        setStats(syncStats);

        // Set default target block
        if (targetBlock === 0) {
          setTargetBlock(syncStats.latestSyncedBlock + 10);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isInitialized) {
      fetchData();
    }

    // Set up interval to refresh data
    const interval = setInterval(() => {
      if (isInitialized) {
        fetchData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isInitialized, refreshKey, targetBlock]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle sync with blockchain
  const handleBlockchainSync = async () => {
    try {
      await monadDbIntegration.syncWithBlockchain();
      handleRefresh();
    } catch (error) {
      console.error('Error syncing with blockchain:', error);
    }
  };

  // Handle sync to specific block
  const handleSyncToBlock = async () => {
    try {
      if (targetBlock <= 0) {
        toast.error('Invalid block number', {
          description: 'Please enter a valid block number'
        });
        return;
      }

      await monadDbIntegration.syncToBlock(targetBlock);
      handleRefresh();
    } catch (error) {
      console.error('Error syncing to block:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          State Sync Status
        </CardTitle>
        <CardDescription>
          Synchronize game state with Monad blockchain
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Syncs</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {syncStatuses.length > 0 ? (
                syncStatuses.map((status) => (
                  <div key={status.syncId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Sync to Block {status.targetBlock}</div>
                      <Badge className={getStatusColor(status.status)}>
                        {status.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      Started: {formatTime(status.startTime)}
                      {status.endTime && ` • Completed: ${formatTime(status.endTime)}`}
                    </div>

                    <Progress value={status.progress} className="h-2 mb-2" />

                    <div className="text-xs text-gray-500">
                      Chunks: {status.chunksReceived}/{status.totalChunks}
                      {status.error && (
                        <div className="text-red-500 mt-1">Error: {status.error}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active sync operations
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button onClick={handleBlockchainSync} className="flex-1">
                  <Server className="h-4 w-4 mr-2" />
                  Sync with Blockchain
                </Button>

                <div className="flex flex-1 gap-2">
                  <input
                    type="number"
                    value={targetBlock}
                    onChange={(e) => setTargetBlock(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Block #"
                  />
                  <Button onClick={handleSyncToBlock}>
                    Sync to Block
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Latest Block</div>
                <div className="text-2xl font-bold">{stats.latestSyncedBlock || 0}</div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Total Syncs</div>
                <div className="text-2xl font-bold">{stats.totalSyncs || 0}</div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Completed Syncs</div>
                <div className="text-2xl font-bold">{stats.completedSyncs || 0}</div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Failed Syncs</div>
                <div className="text-2xl font-bold">{stats.failedSyncs || 0}</div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Accounts Tracked</div>
                <div className="text-2xl font-bold">{stats.accountsTracked || 0}</div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Block Headers</div>
                <div className="text-2xl font-bold">{stats.blockHeadersStored || 0}</div>
              </div>

              <div className="border rounded-lg p-3 col-span-2">
                <div className="text-sm font-medium mb-1">Bandwidth</div>
                <div className="text-xl font-bold">
                  {Math.round((stats.estimatedBandwidth || 0) / 1024)} KB/s
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Last updated: {formatTime(Date.now())}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
