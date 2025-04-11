
import React from 'react';
import { Card } from '@/components/ui/card';
import { monadGameState, monadTransactions } from '@/data/gameData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MonadStatus: React.FC = () => {
  const getStatusColor = () => {
    switch (monadGameState.networkStatus) {
      case 'connected':
        return 'text-emerald-500';
      case 'syncing':
        return 'text-amber-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getStatusIcon = () => {
    switch (monadGameState.networkStatus) {
      case 'connected':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'syncing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 animate-spin" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <Card className="glassmorphism border-emerald-500/30 overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">MONAD</span>
          <span className="ml-1">Blockchain Status</span>
        </h3>
        <div className={`flex items-center ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-1 font-medium capitalize">{monadGameState.networkStatus}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 p-3 rounded-md">
          <div className="text-xs text-gray-400 mb-1">Current Block</div>
          <div className="font-mono text-emerald-400 font-bold">
            {monadGameState.currentBlockHeight?.toLocaleString() || 'Unknown'}
          </div>
        </div>
        
        <div className="bg-black/30 p-3 rounded-md">
          <div className="text-xs text-gray-400 mb-1">Pending Transactions</div>
          <div className="font-mono text-emerald-400 font-bold flex items-center">
            {monadGameState.pendingTransactions}
            {monadGameState.pendingTransactions > 0 && (
              <span className="ml-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-2 text-sm text-white font-medium">Recent Transactions</div>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
        {monadTransactions.map(tx => (
          <TooltipProvider key={tx.txHash}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-black/30 p-2 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                    <div className="font-mono text-xs text-gray-300 truncate" style={{ maxWidth: '140px' }}>
                      {tx.txHash.substring(0, 10)}...
                    </div>
                  </div>
                  <div className="text-xs capitalize text-emerald-400">{tx.type}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/80 border-emerald-500/50">
                <div className="text-xs">
                  <div className="font-mono text-emerald-400">{tx.txHash}</div>
                  <div className="mt-1 text-gray-300">
                    <div>Type: {tx.type}</div>
                    <div>Amount: {tx.amount} MONAD</div>
                    <div>Block: {tx.blockHeight}</div>
                    <div>Status: {tx.status}</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </Card>
  );
};

export default MonadStatus;
