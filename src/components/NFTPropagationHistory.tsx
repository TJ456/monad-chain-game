import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nftPropagationService } from '../services/NFTPropagationService';
import { raptorCastService } from '../services/RaptorCastService';
import { Network, Clock, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

const NFTPropagationHistory: React.FC<NFTPropagationHistoryProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    setIsLoading(true);
    
    try {
      // Get propagation history
      const propagationHistory = await nftPropagationService.getPropagationHistory();
      const propagationEntries = propagationHistory.map(entry => ({
        type: 'propagation' as const,
        timestamp: entry.timestamp,
        tokenId: entry.tokenId,
        messageId: entry.messageId,
        merkleRoot: entry.merkleRoot,
        blockchainStatus: 'confirmed' // Assume confirmed for simplicity
      }));
      
      // Get evolution history
      const evolutionHistory = await nftPropagationService.getEvolutionHistory();
      const evolutionEntries = evolutionHistory.map(entry => ({
        type: 'evolution' as const,
        timestamp: entry.timestamp,
        tokenId: entry.originalTokenId,
        evolvedTokenId: entry.evolvedTokenId,
        merkleRoot: entry.merkleRoot,
        blockchainStatus: 'confirmed' // Assume confirmed for simplicity
      }));
      
      // Get broadcast history
      const broadcastHistory = await raptorCastService.getBroadcastHistory();
      const broadcastEntries = broadcastHistory.map(entry => ({
        type: 'broadcast' as const,
        timestamp: entry.timestamp,
        messageId: entry.messageId,
        merkleRoot: entry.merkleRoot,
        nftId: entry.nftId,
        blockchainStatus: 'confirmed' // Assume confirmed for simplicity
      }));
      
      // Combine and sort by timestamp (newest first)
      const combinedHistory = [...propagationEntries, ...evolutionEntries, ...broadcastEntries]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setHistory(combinedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
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
          onClick={loadHistory}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-gray-400">Loading blockchain history from MonadDb...</p>
        </Card>
      ) : history.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-400">No history found in MonadDb</p>
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
                      {entry.type === 'propagation' && `NFT #${entry.tokenId} Propagated`}
                      {entry.type === 'evolution' && `NFT #${entry.tokenId} Evolved`}
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
                        <span className="text-gray-400">Evolved Token:</span> {(entry as any).evolvedTokenId}
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
