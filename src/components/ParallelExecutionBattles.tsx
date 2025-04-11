
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ParallelExecutionBattles: React.FC = () => {
  return (
    <Card className="glassmorphism border-emerald-500/30 p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-10 w-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Parallel Execution Battles</h3>
          <p className="text-gray-400">Multiple effects resolve simultaneously on Monad</p>
        </div>
        <Badge className="ml-auto bg-emerald-600 text-white">Monad Exclusive</Badge>
      </div>
      
      <div className="space-y-4">
        <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
          <div className="flex items-start space-x-4">
            <div className="flex-none">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold">
                A1
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="text-white font-medium">Chain Lightning</h4>
              <p className="text-sm text-gray-400">Deals damage to multiple targets in parallel</p>
              <div className="mt-2 flex items-center">
                <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full mr-2"></div>
                <span className="text-xs text-emerald-400">3 parallel transactions, 300ms total</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
          <div className="flex items-start space-x-4">
            <div className="flex-none">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                A2
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="text-white font-medium">Multi-Shield Protocol</h4>
              <p className="text-sm text-gray-400">Applies defensive buffs to all friendly cards simultaneously</p>
              <div className="mt-2 flex items-center">
                <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full mr-2"></div>
                <span className="text-xs text-emerald-400">4 parallel operations, 250ms total</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Traditional Chain</span>
            <span className="text-emerald-400 font-bold">2100ms</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-gray-700 mx-4 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-900/50 text-emerald-400 text-xs px-2 py-1 rounded-full">
              87% faster
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Monad Chain</span>
            <span className="text-emerald-400 font-bold">280ms</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ParallelExecutionBattles;
