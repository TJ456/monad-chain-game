import React from 'react';
import { ChainReactionResult } from '../services/ChainReactionService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Clock, Cpu, Gauge, Server } from 'lucide-react';

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
    <div className={`bg-black/30 rounded-md border border-purple-500/30 p-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Zap className="h-3 w-3 text-purple-400 mr-1" />
          <span className="text-xs font-medium text-purple-400">Monad Execution Metrics</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="h-4 w-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-[10px] text-purple-400">?</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-black/90 border-purple-500/50 max-w-xs">
              <div className="text-xs">
                <span className="text-purple-400 font-bold">Monad Execution Metrics</span>
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

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        <div className="flex items-center">
          <Clock className="h-2.5 w-2.5 text-blue-400 mr-1" />
          <span className="text-gray-400">Execution Time:</span>
          <span className={`ml-auto ${getExecutionTimeColor(result.executionTimeMs)}`}>
            {result.executionTimeMs}ms
          </span>
        </div>

        <div className="flex items-center">
          <Cpu className="h-2.5 w-2.5 text-blue-400 mr-1" />
          <span className="text-gray-400">Effects Triggered:</span>
          <span className="ml-auto text-white">{result.totalEffectsTriggered}</span>
        </div>

        {result.parallelSpeedup && (
          <div className="flex items-center">
            <Zap className="h-2.5 w-2.5 text-blue-400 mr-1" />
            <span className="text-gray-400">Parallel Speedup:</span>
            <span className={`ml-auto ${getSpeedupColor(result.parallelSpeedup)}`}>
              {result.parallelSpeedup}x
            </span>
          </div>
        )}

        {result.gasUsed && (
          <div className="flex items-center">
            <Gauge className="h-2.5 w-2.5 text-blue-400 mr-1" />
            <span className="text-gray-400">Gas Used:</span>
            <span className={`ml-auto ${getGasColor(result.gasUsed)}`}>
              {result.gasUsed.toLocaleString()}
            </span>
          </div>
        )}

        {result.networkLatency && (
          <div className="flex items-center">
            <Server className="h-2.5 w-2.5 text-blue-400 mr-1" />
            <span className="text-gray-400">Network Latency:</span>
            <span className="ml-auto text-gray-300">
              {result.networkLatency}ms
            </span>
          </div>
        )}

        {result.transactionHash && (
          <div className="flex items-center col-span-2">
            <span className="text-gray-400">TX Hash:</span>
            <span className="ml-2 text-blue-400 truncate">
              {result.transactionHash.substring(0, 10)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionMetrics;
