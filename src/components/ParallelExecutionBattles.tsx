
import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Sword, Clock, ArrowRight, Sparkles, Play, Pause, Code, Database, Layers } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface BattleCard {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'utility';
  power: number;
  executionTime: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface ParallelOperation {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  status: 'pending' | 'executing' | 'completed';
  dependsOn: string[];
}

// Mock blockchain service to simulate parallel execution
const monadBlockchainService = {
  // Simulate parallel execution of operations
  executeParallelOperations: (operations: ParallelOperation[]) => {
    return new Promise<{
      transactionHash: string;
      executionTimeMs: number;
      operationsCompleted: number;
      sequentialTimeEstimate: number;
    }>((resolve) => {
      // Simulate blockchain processing time
      const processingTime = Math.floor(Math.random() * 100) + 250;
      const sequentialEstimate = operations.reduce((total, op) => total + op.duration, 0);

      setTimeout(() => {
        resolve({
          transactionHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
          executionTimeMs: processingTime,
          operationsCompleted: operations.length,
          sequentialTimeEstimate: sequentialEstimate
        });
      }, processingTime);
    });
  },

  // Get current blockchain metrics
  getNetworkStats: () => {
    return {
      currentTPS: Math.floor(Math.random() * 1000) + 5000,
      averageBlockTime: Math.floor(Math.random() * 50) + 150,
      activeValidators: Math.floor(Math.random() * 20) + 80,
      parallelExecutionEnabled: true
    };
  }
};

const ParallelExecutionBattles: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentBattle, setCurrentBattle] = useState(0);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [activeOperations, setActiveOperations] = useState<ParallelOperation[]>([]);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState(monadBlockchainService.getNetworkStats());
  const [battleStats, setBattleStats] = useState({
    totalBattles: 0,
    totalParallelOperations: 0,
    averageExecutionTime: 0,
    totalTimesSaved: 0,
    lastSpeedup: 0
  });

  // Reference to store animation frame ID
  const animationRef = useRef<number>();

  // Battle cards data
  const battleCards: BattleCard[] = [
    {
      id: 'card-1',
      name: 'Chain Lightning',
      type: 'attack',
      power: 8,
      executionTime: 300,
      color: 'from-red-500 to-orange-600',
      icon: <Zap className="h-5 w-5 text-white" />,
      description: 'Deals damage to multiple targets in parallel'
    },
    {
      id: 'card-2',
      name: 'Multi-Shield Protocol',
      type: 'defense',
      power: 6,
      executionTime: 250,
      color: 'from-blue-500 to-cyan-600',
      icon: <Shield className="h-5 w-5 text-white" />,
      description: 'Applies defensive buffs to all friendly cards simultaneously'
    },
    {
      id: 'card-3',
      name: 'Quantum Strike',
      type: 'attack',
      power: 10,
      executionTime: 320,
      color: 'from-purple-500 to-fuchsia-600',
      icon: <Sword className="h-5 w-5 text-white" />,
      description: 'Executes a powerful attack with parallel damage calculation'
    }
  ];

  // Battle scenarios
  const battleScenarios = [
    {
      name: 'Defensive Formation',
      cards: [battleCards[0], battleCards[1]],
      parallelOps: 5,
      sequentialTime: 1800,
      parallelTime: 320
    },
    {
      name: 'Triple Threat',
      cards: [battleCards[0], battleCards[1], battleCards[2]],
      parallelOps: 8,
      sequentialTime: 2400,
      parallelTime: 380
    },
    {
      name: 'Lightning Assault',
      cards: [battleCards[0], battleCards[2]],
      parallelOps: 6,
      sequentialTime: 2100,
      parallelTime: 340
    }
  ];

  // Update network stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats(monadBlockchainService.getNetworkStats());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-play effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoPlay) {
      interval = setInterval(() => {
        simulateBattle();
      }, 5000); // Run a new battle every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoPlay, currentBattle]);

  // Generate parallel operations from battle cards
  const generateOperations = (cards: BattleCard[]): ParallelOperation[] => {
    const operations: ParallelOperation[] = [];

    // For each card, generate 2-4 operations
    cards.forEach((card, cardIndex) => {
      const numOps = Math.floor(Math.random() * 3) + 2; // 2-4 operations per card

      for (let i = 0; i < numOps; i++) {
        const opId = `${card.id}-op-${i}`;
        const dependsOn: string[] = [];

        // Some operations depend on previous ones (for realistic simulation)
        if (i > 0 && Math.random() > 0.5) {
          dependsOn.push(`${card.id}-op-${i-1}`);
        }

        // Cross-card dependencies (for more complex scenarios)
        if (cardIndex > 0 && Math.random() > 0.7) {
          const prevCard = cards[cardIndex - 1];
          dependsOn.push(`${prevCard.id}-op-0`);
        }

        operations.push({
          id: opId,
          name: `${card.name} ${['Effect', 'Calculation', 'Validation', 'Resolution'][i % 4]}`,
          startTime: 0, // Will be set during execution
          duration: Math.floor(Math.random() * 100) + 50, // 50-150ms per operation
          status: 'pending',
          dependsOn
        });
      }
    });

    return operations;
  };

  // Simulate a battle with parallel execution
  const simulateBattle = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setExecutionProgress(0);
    setTransactionHash(null);

    // Randomly select next battle scenario
    const nextBattle = (currentBattle + 1) % battleScenarios.length;
    setCurrentBattle(nextBattle);

    // Generate operations for this battle
    const operations = generateOperations(battleScenarios[nextBattle].cards);
    setActiveOperations(operations);

    // Start progress animation
    let startTime = Date.now();
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const estimatedDuration = 400; // Estimated duration for animation purposes
      const progress = Math.min(elapsed / estimatedDuration, 0.95); // Cap at 95% until complete

      setExecutionProgress(progress);
      animationRef.current = requestAnimationFrame(animateProgress);
    };

    animationRef.current = requestAnimationFrame(animateProgress);

    try {
      // Execute the parallel operations on the mock blockchain
      const result = await monadBlockchainService.executeParallelOperations(operations);

      // Cancel the animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Set progress to 100%
      setExecutionProgress(1);
      setTransactionHash(result.transactionHash);

      // Calculate speedup
      const speedup = result.sequentialTimeEstimate / result.executionTimeMs;

      // Update battle stats
      setBattleStats(prev => {
        const newTotalBattles = prev.totalBattles + 1;
        const newTotalOps = prev.totalParallelOperations + operations.length;
        const newTotalTime = prev.averageExecutionTime * prev.totalBattles + result.executionTimeMs;
        const newAvgTime = newTotalTime / newTotalBattles;
        const newTimeSaved = prev.totalTimesSaved + (result.sequentialTimeEstimate - result.executionTimeMs);

        return {
          totalBattles: newTotalBattles,
          totalParallelOperations: newTotalOps,
          averageExecutionTime: newAvgTime,
          totalTimesSaved: newTimeSaved,
          lastSpeedup: speedup
        };
      });

      // Show success toast
      toast.success(`Battle executed in ${result.executionTimeMs}ms`, {
        description: `${operations.length} operations processed in parallel`,
        duration: 3000
      });

      // Reset simulation state after a delay
      setTimeout(() => {
        setIsSimulating(false);
      }, 1000);

    } catch (error) {
      console.error('Error executing parallel operations:', error);
      toast.error('Error executing battle', {
        description: 'There was an issue with the parallel execution',
        duration: 3000
      });

      setIsSimulating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  // Calculate speedup percentage
  const getSpeedupPercentage = () => {
    const scenario = battleScenarios[currentBattle];
    return Math.round((scenario.sequentialTime - scenario.parallelTime) / scenario.sequentialTime * 100);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/40 p-6 h-full flex flex-col shadow-xl relative overflow-hidden">
      {/* Circuit board pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none circuit-board-pattern"></div>

      {/* Data flow lines */}
      {isSimulating && [
        { top: '30%', delay: '0s', duration: '2s' },
        { top: '50%', delay: '0.3s', duration: '1.8s' },
        { top: '70%', delay: '0.1s', duration: '2.2s' }
      ].map((line, i) => (
        <div
          key={i}
          className="absolute h-px bg-emerald-500/30 data-flow-line battle-line"
          style={{
            top: line.top,
            left: 0,
            right: 0,
            animationDelay: line.delay,
            animationDuration: line.duration
          }}
        />
      ))}

      <div className="flex items-center space-x-4 mb-4 relative z-10">
        <div className="h-12 w-12 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
          <Zap className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white text-shadow-glow-emerald">Parallel Execution Battles</h3>
          <p className="text-gray-300 mt-1">Multiple effects resolve simultaneously on Monad blockchain</p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 text-sm shadow-md shadow-emerald-900/30">Monad Exclusive</Badge>
      </div>

      <div className="space-y-3 flex-grow relative z-10">
        {/* Battle scenario display */}
        <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/30 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="h-5 w-5 text-emerald-400 mr-2" />
              {battleScenarios[currentBattle].name}
            </h4>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20"
                onClick={() => setAutoPlay(!autoPlay)}
              >
                {autoPlay ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Stop Auto</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Auto Play</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={simulateBattle}
                disabled={isSimulating}
              >
                {isSimulating ? 'Executing...' : 'Execute Battle'}
              </Button>
            </div>
          </div>

          {/* Cards in battle */}
          <div className="flex items-center space-x-2 mb-3 overflow-x-auto py-1 battle-cards-container">
            {battleScenarios[currentBattle].cards.map((card, index) => (
              <div key={card.id} className="relative">
                <div className={`battle-card-frame ${isSimulating ? 'active' : ''}`}>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 shadow-md min-w-[170px]">
                    <div className="flex items-center mb-2">
                      <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${card.color} flex items-center justify-center mr-2 shadow-sm`}>
                        {card.icon}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">{card.name}</h5>
                        <div className="flex items-center">
                          <Badge className="bg-slate-800 text-xs text-emerald-400 px-1.5 py-0">{card.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{card.description}</p>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Power: {card.power}</span>
                      <span>{card.executionTime}ms</span>
                    </div>
                  </div>

                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/70 rounded-tl-md"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/70 rounded-tr-md"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/70 rounded-bl-md"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/70 rounded-br-md"></div>
                </div>

                {/* Connection lines between cards */}
                {index < battleScenarios[currentBattle].cards.length - 1 && (
                  <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 flex items-center">
                    <div className={`h-px w-4 transition-colors duration-300 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                    <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execution progress */}
          {isSimulating && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Executing parallel operations...</span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.round(executionProgress * 100)}%
                </span>
              </div>
              <Progress
                value={executionProgress * 100}
                className="h-1.5 w-full bg-slate-800"
                indicatorClassName="bg-gradient-to-r from-emerald-600 to-teal-600"
              />

              {/* Active operations visualization */}
              <div className="mt-3 bg-slate-900/80 p-2 rounded border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-300 font-medium">Parallel Operations</span>
                  <span className="text-xs text-slate-400">{activeOperations.length} operations</span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {activeOperations.map((op, index) => (
                    <div key={op.id} className="flex items-center text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                      <span className="text-white truncate flex-grow">{op.name}</span>
                      <span className="text-slate-400 ml-2">{op.duration}ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction hash if available */}
              {transactionHash && (
                <div className="mt-2 p-1.5 bg-emerald-900/20 border border-emerald-500/30 rounded text-xs">
                  <div className="flex items-center">
                    <Database className="h-3 w-3 text-emerald-400 mr-1.5" />
                    <span className="text-emerald-300 font-medium">Transaction Hash:</span>
                  </div>
                  <code className="block mt-1 text-emerald-400 font-mono text-[10px] truncate">
                    {transactionHash}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Parallel operations */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-emerald-300 font-medium">Parallel Operations</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-xl font-bold text-white">{battleScenarios[currentBattle].parallelOps}</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-emerald-300 font-medium">Execution Time</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-xl font-bold text-white">{battleScenarios[currentBattle].parallelTime}<span className="text-sm ml-1 text-emerald-400">ms</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance comparison */}
        <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/30 shadow-inner">
          <h4 className="text-base font-bold text-white mb-2 flex items-center">
            <Zap className="h-5 w-5 text-emerald-400 mr-2" />
            Monad Parallel Execution Performance
          </h4>

          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">Traditional Chain</span>
              <span className="text-lg font-bold text-white">{battleScenarios[currentBattle].sequentialTime}<span className="text-xs text-slate-400 ml-1">ms</span></span>
            </div>

            <div className="h-1 flex-1 bg-slate-800 mx-4 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-900/50 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
                {getSpeedupPercentage()}% faster
              </div>
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full" style={{ width: `${(battleScenarios[currentBattle].parallelTime / battleScenarios[currentBattle].sequentialTime) * 100}%` }}></div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">Monad Chain</span>
              <span className="text-lg font-bold text-emerald-400">{battleScenarios[currentBattle].parallelTime}<span className="text-xs text-emerald-300 ml-1">ms</span></span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-1.5 text-center">
                  <p className="text-xs text-emerald-300">
                    Monad's parallel execution enables multiple battle effects to resolve simultaneously, resulting in significantly faster gameplay
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border-emerald-500/30 max-w-xs">
                <div className="text-xs">
                  <span className="text-emerald-400 font-bold">How Monad Parallel Execution Works</span>
                  <div className="text-slate-300 mt-1">
                    Traditional blockchains process transactions sequentially, one after another.
                    Monad's parallel execution allows multiple game actions to be processed simultaneously,
                    dramatically reducing wait times and enabling complex game mechanics.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Monad Network Status */}
        <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/30 shadow-inner">
          <h4 className="text-base font-bold text-white mb-2 flex items-center">
            <Layers className="h-5 w-5 text-emerald-400 mr-2" />
            Monad Network Status
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
              <span className="text-xs text-slate-400">Current TPS</span>
              <span className="text-lg font-bold text-emerald-400">{networkStats.currentTPS.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
              <span className="text-xs text-slate-400">Block Time</span>
              <span className="text-lg font-bold text-emerald-400">{networkStats.averageBlockTime}<span className="text-xs ml-1">ms</span></span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
              <span className="text-xs text-slate-400">Active Validators</span>
              <span className="text-lg font-bold text-white">{networkStats.activeValidators}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
              <span className="text-xs text-slate-400">Parallel Execution</span>
              <span className="text-lg font-bold text-emerald-400">{networkStats.parallelExecutionEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Educational Component */}
        <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/30 shadow-inner">
          <h4 className="text-base font-bold text-white mb-2 flex items-center">
            <Code className="h-5 w-5 text-emerald-400 mr-2" />
            How Parallel Execution Works
          </h4>

          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Traditional blockchains process transactions sequentially, creating bottlenecks during high activity.
              Monad's parallel execution identifies non-conflicting operations and processes them simultaneously.
            </p>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-700">
              <div className="flex items-center mb-1">
                <span className="text-emerald-400 font-medium">Key Benefits:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Higher throughput (5,000-10,000 TPS)</li>
                <li>Reduced latency for complex operations</li>
                <li>Better resource utilization</li>
                <li>Enhanced gameplay with simultaneous effects</li>
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <Button
                variant="link"
                className="text-emerald-400 text-xs p-0 h-auto"
                onClick={() => window.open('https://monad.xyz/blog/parallel-execution', '_blank')}
              >
                Learn more about Monad's parallel execution
              </Button>
            </div>
          </div>
        </div>

        {/* Battle statistics */}
        {battleStats.totalBattles > 0 && (
          <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/30 shadow-inner">
            <h4 className="text-base font-bold text-white mb-2 flex items-center">
              <Shield className="h-5 w-5 text-emerald-400 mr-2" />
              Battle Statistics
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
                <span className="text-xs text-slate-400">Total Battles</span>
                <span className="text-lg font-bold text-white">{battleStats.totalBattles}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
                <span className="text-xs text-slate-400">Parallel Operations</span>
                <span className="text-lg font-bold text-white">{battleStats.totalParallelOperations}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
                <span className="text-xs text-slate-400">Avg. Execution Time</span>
                <span className="text-lg font-bold text-emerald-400">{battleStats.averageExecutionTime.toFixed(0)}<span className="text-xs ml-1">ms</span></span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-700 flex flex-col items-center">
                <span className="text-xs text-slate-400">Time Saved</span>
                <span className="text-lg font-bold text-emerald-400">{(battleStats.totalTimesSaved / 1000).toFixed(1)}<span className="text-xs ml-1">s</span></span>
              </div>
              {battleStats.lastSpeedup > 0 && (
                <div className="col-span-2 bg-emerald-900/20 p-2 rounded border border-emerald-500/30 flex flex-col items-center">
                  <span className="text-xs text-emerald-300">Last Battle Speedup</span>
                  <span className="text-lg font-bold text-emerald-400">{battleStats.lastSpeedup.toFixed(1)}x faster</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ParallelExecutionBattles;
