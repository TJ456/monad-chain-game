
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { monadGameService } from '../services/MonadGameService';
import { chainReactionService, ChainReactionResult } from '../services/ChainReactionService';
import { Zap, Sparkles, Shield, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import ChainReactionVisualizer from './ChainReactionVisualizer';
import ExecutionMetrics from './ExecutionMetrics';
import './ChainReaction.css';

const ChainReactionCards = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<ChainReactionResult | null>(null);
  const [availableEffects, setAvailableEffects] = useState(chainReactionService.getAvailableEffects());
  const [unlockedEffects, setUnlockedEffects] = useState<string[]>(['blockchain-hack']);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [activeEffect, setActiveEffect] = useState('blockchain-hack');
  const [executionStats, setExecutionStats] = useState({
    totalExecutions: 0,
    totalEffectsTriggered: 0,
    averageExecutionTime: 0,
    fastestExecution: Infinity,
    successRate: 0
  });

  // Load any previously unlocked effects from localStorage
  useEffect(() => {
    try {
      const savedUnlocked = localStorage.getItem('monad-chain-unlocked-effects');
      if (savedUnlocked) {
        setUnlockedEffects(JSON.parse(savedUnlocked));
      }

      const savedStats = localStorage.getItem('monad-chain-execution-stats');
      if (savedStats) {
        setExecutionStats(JSON.parse(savedStats));
      }
    } catch (e) {
      console.error('Error loading saved chain reaction data:', e);
    }
  }, []);

  const triggerChainReaction = async (effectId: string = 'blockchain-hack') => {
    setIsTriggering(true);
    setActiveEffect(effectId);

    try {
      // Use our chain reaction service to trigger the effect
      const result = await chainReactionService.triggerChainReaction(effectId);
      setLastResult(result);

      // Show the visualizer after a successful chain reaction
      if (result.success && !showVisualizer) {
        setShowVisualizer(true);
      }

      // Update stats
      const newStats = {
        totalExecutions: executionStats.totalExecutions + 1,
        totalEffectsTriggered: executionStats.totalEffectsTriggered + result.totalEffectsTriggered,
        averageExecutionTime: (
          (executionStats.averageExecutionTime * executionStats.totalExecutions) +
          result.executionTimeMs
        ) / (executionStats.totalExecutions + 1),
        fastestExecution: Math.min(executionStats.fastestExecution, result.executionTimeMs),
        successRate: (
          (executionStats.successRate * executionStats.totalExecutions) +
          (result.success ? 100 : 0)
        ) / (executionStats.totalExecutions + 1)
      };

      setExecutionStats(newStats);
      localStorage.setItem('monad-chain-execution-stats', JSON.stringify(newStats));

      // If successful and triggered at least 2 effects, unlock the next effect
      if (result.success && result.totalEffectsTriggered >= 2 && !unlockedEffects.includes('airdrop-strike')) {
        const newUnlocked = [...unlockedEffects, 'airdrop-strike'];
        setUnlockedEffects(newUnlocked);
        localStorage.setItem('monad-chain-unlocked-effects', JSON.stringify(newUnlocked));

        toast.success("New chain reaction effect unlocked!", {
          description: "You've unlocked the Airdrop Strike effect!"
        });
      }

      // Show a toast with execution stats to highlight Monad's speed
      if (result.success) {
        const speedupText = result.parallelSpeedup
          ? ` (${result.parallelSpeedup}x faster with parallel execution)`
          : '';

        toast.success(`Monad Chain Reaction Complete`, {
          description: `Executed ${result.totalEffectsTriggered} effects in ${result.executionTimeMs}ms${speedupText}`
        });
      }
    } catch (error) {
      console.error('Chain reaction error:', error);
      toast.error("Chain reaction failed", {
        description: "There was an error executing the chain reaction on Monad"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card className="glassmorphism border-purple-500/30 p-6 h-full flex flex-col min-h-[600px] feature-box relative">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-10 w-10 rounded-full bg-purple-500/30 flex items-center justify-center">
          <Zap className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Monad Chain Reaction Cards</h3>
          <p className="text-gray-400">Cards that trigger parallel smart contract events on Monad</p>
        </div>
        <Badge className="ml-auto bg-purple-600 text-white">Monad Exclusive</Badge>
      </div>

      {/* Execution Stats */}
      {executionStats.totalExecutions > 0 && (
        <div className="mb-4 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-400">Monad Execution Stats</h4>
            <div className="flex items-center text-xs text-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-400">Total Executions:</span>
              <span className="ml-auto text-white">{executionStats.totalExecutions}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-400">Effects Triggered:</span>
              <span className="ml-auto text-white">{executionStats.totalEffectsTriggered}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-400">Avg. Execution Time:</span>
              <span className="ml-auto text-white">{executionStats.averageExecutionTime.toFixed(2)}ms</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-400">Success Rate:</span>
              <span className="ml-auto text-white">{executionStats.successRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Performance comparison */}
          <div className="mt-3 pt-3 border-t border-blue-500/20">
            <h5 className="text-xs font-medium text-blue-400 mb-2">Performance Comparison</h5>
            <div className="relative h-6 bg-gray-800/50 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-blue-600/50 flex items-center justify-end px-1 text-[10px] text-white" style={{ width: '15%' }}>
                Monad
              </div>
              <div className="absolute inset-y-0 left-0 bg-gray-600/50 flex items-center px-1 text-[10px] text-white" style={{ width: '100%', paddingLeft: '16%' }}>
                Other L1s (~10x slower)
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0ms</span>
              <span>500ms</span>
              <span>1000ms</span>
              <span>1500ms</span>
              <span>2000ms+</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center mb-2">
            <Zap className="h-4 w-4 text-purple-400 mr-2" />
            <h4 className="text-white font-medium">Blockchain Hack</h4>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Steals a random NFT from opponent's wallet using Monad's parallel execution
          </p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mana Cost: 7</span>
            <span>Success Rate: 85%</span>
          </div>
          <Button
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600"
            size="sm"
            disabled={isTriggering}
            onClick={() => triggerChainReaction('blockchain-hack')}
          >
            {isTriggering ? "Processing on Monad..." : "Trigger Chain Reaction"}
          </Button>
          {lastResult && lastResult.effects.some(e => e.effectId === 'blockchain-hack' && e.success) && (
            <ExecutionMetrics result={lastResult} className="mt-2" />
          )}
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center mb-2">
            <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
            <h4 className="text-white font-medium">Airdrop Strike</h4>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Mints a surprise token directly to player's wallet with random attributes
          </p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mana Cost: 5</span>
            <span>Token Quality: 1-100</span>
          </div>
          <Button
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600"
            size="sm"
            variant={unlockedEffects.includes('airdrop-strike') ? "default" : "outline"}
            disabled={!unlockedEffects.includes('airdrop-strike') || isTriggering}
            onClick={() => {
              if (unlockedEffects.includes('airdrop-strike')) {
                triggerChainReaction('airdrop-strike');
              } else {
                toast.info("This feature will be available soon", {
                  description: "Trigger a successful Blockchain Hack chain reaction first"
                });
              }
            }}
          >
            {unlockedEffects.includes('airdrop-strike')
              ? (isTriggering ? "Processing on Monad..." : "Trigger Chain Reaction")
              : "Locked - Trigger Blockchain Hack First"}
          </Button>
          {lastResult && lastResult.effects.some(e => e.effectId === 'airdrop-strike' && e.success) && (
            <ExecutionMetrics result={lastResult} className="mt-2" />
          )}
        </div>
      </div>

      <div className="mt-6 bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
        <div className="flex justify-between items-center">
          <h4 className="text-white font-medium">How Monad Chain Reactions Work</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-purple-400 hover:text-purple-300"
            onClick={() => setShowVisualizer(!showVisualizer)}
          >
            {showVisualizer ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                <span className="text-xs">Hide Visualizer</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                <span className="text-xs">Show Visualizer</span>
              </>
            )}
          </Button>
        </div>

        {showVisualizer && (
          <div className="my-4">
            <ChainReactionVisualizer
              effectId={activeEffect}
              onComplete={(result) => {
                toast.success(`Monad Chain Reaction Visualization Complete`, {
                  description: `${result.effectsTriggered} effects processed in ${result.executionTimeMs}ms using Monad's parallel execution`
                });
              }}
            />
          </div>
        )}

        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">1</div>
          <p className="text-sm text-gray-300">Initial card effect triggers a smart contract function call on the Monad blockchain</p>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">2</div>
          <p className="text-sm text-gray-300">Monad's parallel execution processes multiple effects simultaneously in &lt;1 second</p>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">3</div>
          <p className="text-sm text-gray-300">Each effect in the chain can trigger additional effects on other cards in parallel</p>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-none h-8 w-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 mr-3">4</div>
          <p className="text-sm text-gray-300">Real blockchain state changes affect gameplay and NFT ownership instantly</p>
        </div>

        <div className="mt-4 bg-blue-900/30 p-3 rounded border border-blue-500/30">
          <h5 className="text-sm font-medium text-blue-400 mb-1 flex items-center">
            <Shield className="h-3 w-3 mr-1" /> Monad Technology Advantages
          </h5>
          <ul className="text-xs text-gray-300 space-y-1 pl-5 list-disc">
            <li>Up to 10,000x faster execution than traditional blockchains</li>
            <li>Parallel processing allows multiple chain reactions simultaneously</li>
            <li>Lower gas fees make complex card interactions economically viable</li>
            <li>Atomic transactions ensure all chain effects complete or none do</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ChainReactionCards;
