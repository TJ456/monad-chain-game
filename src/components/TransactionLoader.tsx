import React from 'react';
import { Loader2 } from 'lucide-react';

interface TransactionLoaderProps {
  isLoading: boolean;
  message?: string;
  txHash?: string;
  blockNumber?: number;
}

const TransactionLoader: React.FC<TransactionLoaderProps> = ({
  isLoading,
  message = 'Processing transaction on Monad blockchain...',
  txHash,
  blockNumber
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/80 border border-emerald-500/30 rounded-lg p-6 max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Monad Transaction</h3>
          <p className="text-gray-300 text-center mb-4">{message}</p>
          
          {txHash && (
            <div className="bg-black/50 rounded p-2 w-full mb-3">
              <div className="text-xs text-gray-400">Transaction Hash:</div>
              <div className="text-xs text-emerald-400 font-mono break-all">{txHash}</div>
            </div>
          )}
          
          {blockNumber && (
            <div className="text-xs text-gray-400">
              Current Block: <span className="text-emerald-400">{blockNumber}</span>
            </div>
          )}
          
          <div className="mt-4 flex items-center space-x-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoader;
