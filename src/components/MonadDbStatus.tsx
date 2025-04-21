import React, { useState, useEffect } from 'react';
import { monadDb } from '../services/MonadDbService';
import { monadDbIntegration } from '../services/MonadDbIntegration';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Database, Server, Activity, RefreshCw, BarChart3 } from 'lucide-react';

/**
 * MonadDbStatus - Component to display MonadDb statistics and status
 */
const MonadDbStatus: React.FC = () => {
  const [stats, setStats] = useState<any>({
    reads: 0,
    writes: 0,
    hits: 0,
    misses: 0,
    batchedWrites: 0,
    compressionRatio: 0,
    averageAccessTime: 0,
    cacheSize: 0,
    pendingBatchSize: 0
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Initialize MonadDb integration if not already initialized
  useEffect(() => {
    const init = async () => {
      try {
        await monadDbIntegration.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing MonadDb integration:', error);
      }
    };

    if (!isInitialized) {
      init();
    }
  }, [isInitialized]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      try {
        const currentStats = monadDb.getStats();
        setStats(currentStats);
      } catch (error) {
        console.error('Error getting MonadDb stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  // Calculate hit rate
  const hitRate = stats.hits + stats.misses > 0
    ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1)
    : '0';

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle sync with MonadDb
  const handleSync = async () => {
    try {
      await monadDbIntegration.syncWithMonadDb();
      handleRefresh();
    } catch (error) {
      console.error('Error syncing with MonadDb:', error);
    }
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

  return (
    <Card className="w-full shadow-md bg-slate-900 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-400 mr-2" />
            <CardTitle className="text-lg text-white">MonadDb Status</CardTitle>
          </div>
          <Badge
            variant={isInitialized ? "success" : "destructive"}
            className={isInitialized ? "bg-emerald-600" : "bg-red-600"}
          >
            {isInitialized ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          High-performance state backend for Monad blockchain
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mx-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <CardContent className="pt-4">
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Cache Hit Rate</div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold text-white">{hitRate}%</span>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <Progress
                  value={parseFloat(hitRate)}
                  className="h-1 mt-2"
                  indicatorClassName="bg-blue-500"
                />
              </div>

              <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Compression Ratio</div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold text-white">{stats.compressionRatio.toFixed(1)}x</span>
                  <Server className="h-4 w-4 text-emerald-400" />
                </div>
                <Progress
                  value={Math.min(stats.compressionRatio * 10, 100)}
                  className="h-1 mt-2"
                  indicatorClassName="bg-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800 p-2 rounded-md border border-slate-700 flex flex-col items-center">
                <div className="text-xs text-slate-400">Reads</div>
                <div className="text-lg font-bold text-white">{stats.reads}</div>
              </div>

              <div className="bg-slate-800 p-2 rounded-md border border-slate-700 flex flex-col items-center">
                <div className="text-xs text-slate-400">Writes</div>
                <div className="text-lg font-bold text-white">{stats.writes}</div>
              </div>

              <div className="bg-slate-800 p-2 rounded-md border border-slate-700 flex flex-col items-center">
                <div className="text-xs text-slate-400">Batched</div>
                <div className="text-lg font-bold text-white">{stats.batchedWrites}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Average Access Time</div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-white">{stats.averageAccessTime.toFixed(2)} ms</span>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Cache Hits</div>
                <div className="text-lg font-bold text-white">{stats.hits}</div>
              </div>

              <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Cache Misses</div>
                <div className="text-lg font-bold text-white">{stats.misses}</div>
              </div>
            </div>

            <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Pending Batch Size</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{stats.pendingBatchSize}</span>
                <Progress
                  value={(stats.pendingBatchSize / 100) * 100}
                  max={100}
                  className="h-1 flex-1 mx-4"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Cache Entries</div>
              <div className="text-xl font-bold text-white">{stats.cacheSize}</div>
            </div>

            <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Storage Configuration</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-slate-400">Cache Size</div>
                <div className="text-xs text-white text-right">512 MB</div>

                <div className="text-xs text-slate-400">Batch Size</div>
                <div className="text-xs text-white text-right">100</div>

                <div className="text-xs text-slate-400">Compression</div>
                <div className="text-xs text-white text-right">Enabled (Level 6)</div>

                <div className="text-xs text-slate-400">Persistence</div>
                <div className="text-xs text-white text-right">Enabled</div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-slate-700 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
            onClick={handleBlockchainSync}
            disabled={!isInitialized}
          >
            <Server className="h-3 w-3 mr-1" />
            Blockchain
          </Button>

          <Button
            variant="default"
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSync}
            disabled={!isInitialized}
          >
            <Database className="h-3 w-3 mr-1" />
            Sync DB
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MonadDbStatus;
