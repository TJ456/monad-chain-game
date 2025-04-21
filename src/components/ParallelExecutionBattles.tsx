
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Sword, Clock, ArrowRight, Sparkles, Play, Pause } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const ParallelExecutionBattles: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentBattle, setCurrentBattle] = useState(0);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [battleStats, setBattleStats] = useState({
    totalBattles: 0,
    totalParallelOperations: 0,
    averageExecutionTime: 0,
    totalTimesSaved: 0
  });

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

  // Simulate a battle with parallel execution
  const simulateBattle = () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setExecutionProgress(0);

    // Randomly select next battle scenario
    const nextBattle = (currentBattle + 1) % battleScenarios.length;
    setCurrentBattle(nextBattle);

    // Animate execution progress
    const duration = battleScenarios[nextBattle].parallelTime;
    const startTime = Date.now();
    const endTime = startTime + duration;

    const progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setExecutionProgress(progress);

      if (now >= endTime) {
        clearInterval(progressInterval);

        // Update battle stats
        setBattleStats(prev => {
          const newTotalBattles = prev.totalBattles + 1;
          const newTotalOps = prev.totalParallelOperations + battleScenarios[nextBattle].parallelOps;
          const newTotalTime = prev.averageExecutionTime * prev.totalBattles + duration;
          const newAvgTime = newTotalTime / newTotalBattles;
          const newTimeSaved = prev.totalTimesSaved + (battleScenarios[nextBattle].sequentialTime - duration);

          return {
            totalBattles: newTotalBattles,
            totalParallelOperations: newTotalOps,
            averageExecutionTime: newAvgTime,
            totalTimesSaved: newTimeSaved
          };
        });

        setIsSimulating(false);
      }
    }, 50);
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
                  {Math.round(executionProgress * battleScenarios[currentBattle].parallelTime)}ms
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"
                  style={{ width: `${executionProgress * 100}%` }}
                ></div>
              </div>
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
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ParallelExecutionBattles;
