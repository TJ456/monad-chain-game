import React from 'react';
import { ChainReactionResult } from '../services/ChainReactionService';
import { monadChainReactionService } from '../services/MonadChainReactionService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Clock, Cpu, Gauge, Server, ExternalLink } from 'lucide-react';

interface ExecutionMetricsProps {
  result: ChainReactionResult;
  className?: string;
}

const ExecutionMetrics: React.FC<ExecutionMetricsProps> = ({ result, className = '' }) => {
  // Format execution time with color coding based on speed
  const getExecutionTimeColor = (time: number) => {
    if (time < 500) return 'text-green-400';
    if (time < 1000) return 'text-blue-400';
    if (time < 2000) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Format gas usage with color coding
  const getGasColor = (gas: number) => {
    if (gas < 30000) return 'text-green-400';
    if (gas < 60000) return 'text-blue-400';
    if (gas < 100000) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Format parallel speedup with color coding
  const getSpeedupColor = (speedup: number) => {
    if (speedup > 3) return 'text-green-400';
    if (speedup > 2) return 'text-blue-400';
    if (speedup > 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-5 w-5 bg-slate-800 rounded flex items-center justify-center mr-2">
            <Zap className="h-3 w-3 text-blue-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">Monad Execution Metrics</span>
          {result.transactionHash ? (
            <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
              On-Chain
            </span>
          ) : (
            <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              Simulation
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="h-5 w-5 rounded bg-slate-800 flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400">?</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-900 border-slate-700 max-w-xs">
              <div className="text-xs">
                <span className="text-blue-400 font-bold">Monad Execution Metrics</span>
                <div className="text-slate-300 mt-1">
                  These metrics show the performance of your chain reaction on the Monad blockchain.
                  Monad's parallel execution enables multiple effects to be processed simultaneously,
                  resulting in significantly faster execution times compared to traditional blockchains.
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
          <div className="flex items-center mb-1">
            <Clock className="h-3 w-3 text-blue-400 mr-1.5" />
            <span className="text-slate-400 text-[10px]">Execution Time</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base font-bold ${getExecutionTimeColor(result.executionTimeMs)}`}>
              {result.executionTimeMs}
              <span className="text-xs ml-1 opacity-70">ms</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
          <div className="flex items-center mb-1">
            <Cpu className="h-3 w-3 text-blue-400 mr-1.5" />
            <span className="text-slate-400 text-[10px]">Effects Triggered</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-base font-bold text-white">
              {result.totalEffectsTriggered}
            </span>
          </div>
        </div>

        {result.parallelSpeedup && (
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
            <div className="flex items-center mb-1">
              <Zap className="h-3 w-3 text-blue-400 mr-1.5" />
              <span className="text-slate-400 text-[10px]">Parallel Speedup</span>
            </div>
            <div className="flex items-center justify-center">
              <span className={`text-base font-bold ${getSpeedupColor(result.parallelSpeedup)}`}>
                {result.parallelSpeedup}
                <span className="text-xs ml-1 opacity-70">x</span>
              </span>
            </div>
          </div>
        )}

        {result.gasUsed && (
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
            <div className="flex items-center mb-1">
              <Gauge className="h-3 w-3 text-blue-400 mr-1.5" />
              <span className="text-slate-400 text-[10px]">Gas Used</span>
            </div>
            <div className="flex items-center justify-center">
              <span className={`text-base font-bold ${getGasColor(result.gasUsed)}`}>
                {(result.gasUsed / 1000).toFixed(1)}
                <span className="text-xs ml-1 opacity-70">K</span>
              </span>
            </div>
          </div>
        )}

        {result.transactionHash && (
          <div className="col-span-2 mt-2 bg-blue-900/20 p-2 rounded border border-blue-500/30 flex items-center">
            <div className="flex-shrink-0 mr-2">
              <div className="h-5 w-5 bg-blue-900/50 rounded flex items-center justify-center">
                <ExternalLink className="h-3 w-3 text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-400">Transaction Hash</div>
              <a
                href={monadChainReactionService.getExplorerUrl(result.transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 truncate block hover:text-blue-300 transition-colors"
              >
                {result.transactionHash.substring(0, 18)}...
              </a>
            </div>
            <div className="flex-shrink-0 ml-2">
              <div className="text-[10px] text-slate-400">Block</div>
              <div className="text-xs text-white">{result.blockNumber}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionMetrics;
