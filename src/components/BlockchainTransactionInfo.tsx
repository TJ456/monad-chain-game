import React from 'react';
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getTransactionExplorerUrl, truncateHash as truncateHashUtil } from '@/utils/blockchain';

export interface Transaction {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp?: number;
  gasUsed?: number;
  description: string;
}

interface BlockchainTransactionInfoProps {
  transactions: Transaction[];
  currentBlockHeight?: number;
  networkName?: string;
  isConnected: boolean;
}

const BlockchainTransactionInfo: React.FC<BlockchainTransactionInfoProps> = ({
  transactions,
  currentBlockHeight,
  networkName = 'MONAD',
  isConnected
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400 animate-pulse" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const truncateHash = (hash: string) => {
    return truncateHashUtil(hash);
  };

  const getExplorerUrl = (txHash: string) => {
    console.log('Opening explorer URL for transaction:', txHash);
    return getTransactionExplorerUrl(txHash);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="glassmorphism border-emerald-500/30 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center">
          <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
          MONAD Blockchain Status
        </h3>
        <div className="text-xs text-emerald-400">
          {networkName} • Block #{currentBlockHeight}
        </div>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {transactions.map((tx, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded-md flex items-center justify-between ${
                tx.status === 'pending'
                  ? 'bg-amber-950/30 border border-amber-500/30'
                  : tx.status === 'confirmed'
                  ? 'bg-emerald-950/30 border border-emerald-500/30'
                  : 'bg-red-950/30 border border-red-500/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                {getStatusIcon(tx.status)}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-gray-400">{truncateHash(tx.txHash)}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="w-80 p-3">
                      <div className="space-y-2">
                        <div className="font-semibold">Transaction Details</div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <span className="text-gray-400">Hash:</span>
                          <span className="col-span-2 text-white break-all">{tx.txHash}</span>

                          <span className="text-gray-400">Status:</span>
                          <span className="col-span-2 capitalize">{tx.status}</span>

                          {tx.blockNumber && (
                            <>
                              <span className="text-gray-400">Block:</span>
                              <span className="col-span-2">{tx.blockNumber}</span>
                            </>
                          )}

                          {tx.timestamp && (
                            <>
                              <span className="text-gray-400">Time:</span>
                              <span className="col-span-2">{formatTimestamp(tx.timestamp)}</span>
                            </>
                          )}

                          {tx.gasUsed && (
                            <>
                              <span className="text-gray-400">Gas Used:</span>
                              <span className="col-span-2">{tx.gasUsed}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <a
                href={getExplorerUrl(tx.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-gray-400">
          No recent transactions
        </div>
      )}
    </Card>
  );
};

export default BlockchainTransactionInfo;
