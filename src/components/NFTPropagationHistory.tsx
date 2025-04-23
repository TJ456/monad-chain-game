import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nftPropagationService } from '../services/NFTPropagationService';
import { raptorCastService } from '../services/RaptorCastService';
import { monadDb } from '../services/MonadDbService';
import { initializeServices } from '../services/initServices';
import { Network, Clock, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Database } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import BlockchainHistoryCreator from './BlockchainHistoryCreator';

interface NFTPropagationHistoryProps {
  className?: string;
}

interface HistoryEntry {
  type: 'propagation' | 'evolution' | 'broadcast';
  timestamp: number;
  tokenId?: number;
  messageId?: string;
  merkleRoot: string;
  blockNumber?: number;
  blockchainStatus?: 'pending' | 'confirmed';
  txHash?: string;
  evolvedTokenId?: number;
  nftId?: number;
}

const NFTPropagationHistory: React.FC<NFTPropagationHistoryProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});

  // Check if services are initialized when component mounts
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);

        // Step 1: Check if MonadDb is already initialized
        if (!monadDb['isInitialized']) {
          console.log('Initializing MonadDb...');
          try {
            await monadDb.initialize({
              cacheSize: 512, // 512MB cache
              persistToDisk: true,
              logLevel: 'info'
            });
            console.log('MonadDb initialized successfully');
          } catch (dbError) {
            console.error('Error initializing MonadDb:', dbError);
            throw new Error(`Failed to initialize database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
          }
        } else {
          console.log('MonadDb is already initialized');
        }

        // Step 2: Initialize NFTPropagationService
        if (!nftPropagationService['isInitialized']) {
          console.log('Initializing NFTPropagationService...');
          try {
            await nftPropagationService.initialize();
            console.log('NFTPropagationService initialized successfully');
          } catch (nftError) {
            console.error('Error initializing NFTPropagationService:', nftError);
            throw new Error(`Failed to initialize NFT service: ${nftError instanceof Error ? nftError.message : 'Unknown error'}`);
          }
        } else {
          console.log('NFTPropagationService is already initialized');
        }

        // Step 3: Initialize RaptorCastService if needed
        if (!raptorCastService['isInitialized']) {
          console.log('Initializing RaptorCastService...');
          try {
            await raptorCastService.initialize();
            console.log('RaptorCastService initialized successfully');
          } catch (raptorError) {
            console.error('Error initializing RaptorCastService:', raptorError);
            throw new Error(`Failed to initialize RaptorCast service: ${raptorError instanceof Error ? raptorError.message : 'Unknown error'}`);
          }
        } else {
          console.log('RaptorCastService is already initialized');
        }

        // All services initialized successfully
        setIsDbInitialized(true);
        setInitializationError(null);
        loadHistory();
      } catch (error) {
        console.error('Error initializing services:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error initializing services');
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);

    try {
      // Verify all required services are initialized
      if (!isDbInitialized) {
        console.log('Services not initialized, cannot load history');
        setInitializationError('Required services not initialized. Please retry initialization.');
        setIsLoading(false);
        return;
      }

      // Get blockchain transaction history first
      const blockchainHistory = await monadDb.getAll<any>('blockchain-history');
      console.log('Blockchain history:', blockchainHistory);

      // Create entries from blockchain history
      const blockchainEntries = blockchainHistory.map(entry => ({
        type: entry.type as 'propagation' | 'evolution' | 'broadcast',
        timestamp: entry.timestamp,
        tokenId: entry.tokenId || entry.originalTokenId || entry.nftId,
        evolvedTokenId: entry.evolvedTokenId,
        messageId: entry.messageId,
        merkleRoot: entry.merkleRoot || 'unknown',
        blockchainStatus: entry.status || 'confirmed',
        blockNumber: entry.blockNumber,
        txHash: entry.txHash,
        name: entry.name
      }));

      // Get propagation history
      const propagationHistory = await nftPropagationService.getPropagationHistory();
      console.log('Propagation history:', propagationHistory);
      const propagationEntries = propagationHistory.map(entry => ({
        type: 'propagation' as const,
        timestamp: entry.timestamp,
        tokenId: entry.tokenId,
        messageId: entry.messageId,
        merkleRoot: entry.merkleRoot,
        blockchainStatus: entry.blockchainStatus || 'pending',
        blockNumber: entry.blockNumber,
        txHash: entry.txHash,
        name: entry.name
      }));

      // Get evolution history
      const evolutionHistory = await nftPropagationService.getEvolutionHistory();
      console.log('Evolution history:', evolutionHistory);
      const evolutionEntries = evolutionHistory.map(entry => ({
        type: 'evolution' as const,
        timestamp: entry.timestamp,
        tokenId: entry.originalTokenId,
        evolvedTokenId: entry.evolvedTokenId,
        merkleRoot: entry.merkleRoot,
        blockchainStatus: entry.blockchainStatus || 'pending',
        blockNumber: entry.blockNumber,
        txHash: entry.txHash,
        name: entry.name || entry.originalName
      }));

      // Get broadcast history
      const broadcastHistory = await raptorCastService.getBroadcastHistory();
      console.log('Broadcast history:', broadcastHistory);
      const broadcastEntries = broadcastHistory.map(entry => ({
        type: 'broadcast' as const,
        timestamp: entry.timestamp,
        messageId: entry.messageId,
        merkleRoot: entry.merkleRoot,
        nftId: entry.nftId,
        blockchainStatus: entry.blockchainStatus || 'pending',
        blockNumber: entry.blockNumber,
        txHash: entry.txHash
      }));

      // Combine and sort by timestamp (newest first)
      // Prioritize blockchain entries as they're the most reliable
      const combinedHistory = [...blockchainEntries, ...propagationEntries, ...evolutionEntries, ...broadcastEntries]
        .sort((a, b) => b.timestamp - a.timestamp);

      // Remove duplicates (prefer blockchain entries)
      const uniqueHistory = combinedHistory.filter((entry, index, self) => {
        // If it has a txHash, use that for uniqueness
        if (entry.txHash) {
          return index === self.findIndex(e => e.txHash === entry.txHash);
        }
        // Otherwise use a combination of type, timestamp and tokenId/messageId
        return index === self.findIndex(e =>
          e.type === entry.type &&
          e.timestamp === entry.timestamp &&
          ((e.tokenId && e.tokenId === entry.tokenId) ||
           (e.messageId && e.messageId === entry.messageId))
        );
      });

      console.log('Combined history:', uniqueHistory);
      setHistory(uniqueHistory);
    } catch (error) {
      console.error('Error loading history:', error);

      // Update initialization error if it's an initialization issue
      if (error instanceof Error && error.message.includes('not initialized')) {
        setInitializationError(error.message);
        setIsDbInitialized(false);
      } else {
        toast.error('Failed to load blockchain history', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyIntegrity = async (entry: HistoryEntry) => {
    try {
      let result = false;

      if (entry.type === 'propagation' && entry.tokenId) {
        result = await nftPropagationService.verifyPropagationIntegrity(entry.tokenId);
      } else if (entry.type === 'broadcast' && entry.messageId) {
        result = await raptorCastService.verifyBroadcastIntegrity(entry.messageId);
      }

      // Update verification results
      setVerificationResults(prev => ({
        ...prev,
        [entry.merkleRoot]: result
      }));

      return result;
    } catch (error) {
      console.error('Error verifying integrity:', error);
      return false;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'propagation':
        return 'NFT Propagation';
      case 'evolution':
        return 'NFT Evolution';
      case 'broadcast':
        return 'RaptorCast Broadcast';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'propagation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'evolution':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'broadcast':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Network className="w-5 h-5 mr-2 text-blue-400" />
          MonadDb Blockchain History
        </h3>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            toast.info('Refreshing blockchain history...');
            loadHistory();
          }}
          disabled={isLoading}
          className="bg-blue-900/30 border-blue-500/30 hover:bg-blue-800/40 hover:border-blue-500/50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh History
        </Button>
      </div>

      <BlockchainHistoryCreator onHistoryCreated={loadHistory} />

      {initializationError && (
        <Card className="p-4 bg-red-900/30 border-red-500/30 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-300">Database Error</h4>
              <p className="text-xs text-red-300/80 mt-1">{initializationError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-800/40"
            onClick={async () => {
              setIsLoading(true);
              try {
                // Reinitialize all required services
                await monadDb.initialize({
                  cacheSize: 512,
                  persistToDisk: true,
                  logLevel: 'info'
                });

                await nftPropagationService.initialize();
                await raptorCastService.initialize();

                setIsDbInitialized(true);
                setInitializationError(null);
                loadHistory();
              } catch (error) {
                console.error('Error reinitializing services:', error);
                setInitializationError(`Failed to initialize services: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <Database className="w-4 h-4 mr-2" />
            Retry Database Initialization
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-gray-400">Loading blockchain history from MonadDb...</p>
        </Card>
      ) : history.length === 0 && !initializationError ? (
        <Card className="p-8 text-center">
          <p className="text-gray-400">No history found in MonadDb</p>
          <p className="text-gray-400 mt-2">Click the "Create Blockchain Entry" button above to create a test entry</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((entry, index) => (
            <Card key={index} className="p-3 bg-slate-950/50 border border-slate-700/50">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex items-start">
                  <Badge className={`mr-3 ${getTypeColor(entry.type)}`}>
                    {getTypeLabel(entry.type)}
                  </Badge>

                  <div>
                    <div className="text-sm text-white">
                      {entry.type === 'propagation' && `NFT #${entry.tokenId}${entry.name ? ` (${entry.name})` : ''} Propagated`}
                      {entry.type === 'evolution' && `NFT #${entry.tokenId}${entry.name ? ` (${entry.name})` : ''} Evolved`}
                      {entry.type === 'broadcast' && `Message ${entry.messageId?.substring(0, 8)}... Broadcast`}
                    </div>

                    <div className="text-xs text-gray-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 md:mt-0 flex items-center">
                  {entry.blockchainStatus && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center mr-3">
                            {entry.blockchainStatus === 'confirmed' ? (
                              <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" />
                            )}
                            <span className={entry.blockchainStatus === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}>
                              {entry.blockchainStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">
                            {entry.blockchainStatus === 'confirmed'
                              ? 'Transaction confirmed on Monad blockchain'
                              : 'Transaction pending confirmation'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => verifyIntegrity(entry)}
                  >
                    {verificationResults[entry.merkleRoot] === undefined ? (
                      'Verify Integrity'
                    ) : verificationResults[entry.merkleRoot] ? (
                      <span className="text-green-400 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">View on Monad Explorer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/30">
                <div className="text-xs text-gray-500 flex flex-wrap">
                  <span className="mr-4">
                    <span className="text-gray-400">Merkle Root:</span> {entry.merkleRoot.substring(0, 16)}...
                  </span>

                  {entry.txHash && (
                    <span className="mr-4">
                      <span className="text-gray-400">Tx Hash:</span> {entry.txHash.substring(0, 16)}...
                    </span>
                  )}

                  {entry.blockNumber && (
                    <span className="mr-4">
                      <span className="text-gray-400">Block:</span> {entry.blockNumber.toLocaleString()}
                    </span>
                  )}

                  {entry.type === 'propagation' && entry.tokenId && (
                    <span className="mr-4">
                      <span className="text-gray-400">Token ID:</span> {entry.tokenId}
                    </span>
                  )}

                  {entry.type === 'evolution' && entry.tokenId && (
                    <>
                      <span className="mr-4">
                        <span className="text-gray-400">Original Token:</span> {entry.tokenId}
                      </span>
                      <span className="mr-4">
                        <span className="text-gray-400">Evolved Token:</span> {entry.evolvedTokenId}
                      </span>
                    </>
                  )}

                  {entry.type === 'broadcast' && entry.messageId && (
                    <span className="mr-4">
                      <span className="text-gray-400">Message ID:</span> {entry.messageId.substring(0, 16)}...
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTPropagationHistory;
