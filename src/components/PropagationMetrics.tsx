import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Clock, Cpu, Gauge, Server, ExternalLink } from 'lucide-react';

interface PropagationMetricsProps {
  executionTime: number;
  gasUsed: number;
  parallelSpeedup: number;
  networkLatency: number;
  className?: string;
}

const PropagationMetrics: React.FC<PropagationMetricsProps> = ({ 
  executionTime, 
  gasUsed, 
  parallelSpeedup, 
  networkLatency,
  className = '' 
}) => {
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
          <span className="text-xs font-medium text-slate-300">RaptorCast Propagation Metrics</span>
          <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
            On-Chain
          </span>
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
                <span className="text-blue-400 font-bold">RaptorCast Propagation Metrics</span>
                <div className="text-slate-300 mt-1">
                  These metrics show the performance of your NFT propagation through the Monad network using RaptorCast technology.
                  RaptorCast enables efficient data propagation with erasure coding for reliability and speed.
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
            <span className="text-slate-400 text-[10px]">Propagation Time</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base font-bold ${getExecutionTimeColor(executionTime)}`}>
              {executionTime}
              <span className="text-xs ml-1 opacity-70">ms</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
          <div className="flex items-center mb-1">
            <Cpu className="h-3 w-3 text-blue-400 mr-1.5" />
            <span className="text-slate-400 text-[10px]">Gas Used</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base font-bold ${getGasColor(gasUsed)}`}>
              {(gasUsed / 1000).toFixed(1)}
              <span className="text-xs ml-1 opacity-70">K</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
          <div className="flex items-center mb-1">
            <Zap className="h-3 w-3 text-blue-400 mr-1.5" />
            <span className="text-slate-400 text-[10px]">Parallel Speedup</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base font-bold ${getSpeedupColor(parallelSpeedup)}`}>
              {parallelSpeedup.toFixed(1)}
              <span className="text-xs ml-1 opacity-70">x</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
          <div className="flex items-center mb-1">
            <Server className="h-3 w-3 text-blue-400 mr-1.5" />
            <span className="text-slate-400 text-[10px]">Network Latency</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base font-bold text-blue-400`}>
              {networkLatency}
              <span className="text-xs ml-1 opacity-70">ms</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropagationMetrics;
