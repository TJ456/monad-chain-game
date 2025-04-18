import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { getTransactionExplorerUrl, getBlockExplorerUrl, truncateHash } from '@/utils/blockchain';

interface TransactionConfirmationProps {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: number;
  onClose: () => void;
}

const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  transactionHash,
  status,
  blockNumber,
  timestamp,
  onClose
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="h-5 w-5 text-amber-400 animate-spin" />;
      case 'confirmed':
        return <Check className="h-5 w-5 text-emerald-400" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending';
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'failed':
        return 'Transaction Failed';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'Your move is being processed on the MONAD blockchain. This may take a few moments.';
      case 'confirmed':
        return `Your move has been confirmed on the MONAD blockchain in block #${blockNumber}.`;
      case 'failed':
        return 'Your move could not be processed on the MONAD blockchain. Please try again.';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-amber-500/30 bg-amber-900/10';
      case 'confirmed':
        return 'border-emerald-500/30 bg-emerald-900/10';
      case 'failed':
        return 'border-red-500/30 bg-red-900/10';
    }
  };

  const openBlockExplorer = () => {
    console.log('Opening explorer URL for transaction:', transactionHash);
    const explorerUrl = getTransactionExplorerUrl(transactionHash);
    console.log('Explorer URL:', explorerUrl);
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card className={`glassmorphism ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {getStatusIcon()}
            <h3 className="text-lg font-semibold ml-2">{getStatusText()}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </Button>
        </div>

        <p className="text-sm text-gray-300 mb-4">{getStatusDescription()}</p>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Transaction Hash:</span>
            <a
              href={getTransactionExplorerUrl(transactionHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 flex items-center"
            >
              {truncateHash(transactionHash, 10, 8)}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>

          {blockNumber && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Block Number:</span>
              <a
                href={getBlockExplorerUrl(blockNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:text-blue-300 flex items-center"
              >
                {blockNumber}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Time:</span>
            <span className="font-mono text-gray-300">{formatTime(timestamp)}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={openBlockExplorer}
            className="text-xs border-blue-500/30 text-blue-400"
          >
            View on Explorer
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionConfirmation;
