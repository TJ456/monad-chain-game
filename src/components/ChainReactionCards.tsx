
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { monadGameService } from '../services/MonadGameService';
import { chainReactionService, ChainReactionResult } from '../services/ChainReactionService';
import { Zap, Sparkles, Shield, ChevronDown, ChevronUp, Clock, Lock, Unlock } from 'lucide-react';
import ChainReactionVisualizer from './ChainReactionVisualizer';
import ExecutionMetrics from './ExecutionMetrics';
import NFTCard from './NFTCard';
import './ChainReaction.css';
import { getElementImage, getQualityImage, getAbilityImage } from '../utils/nftImages';

const ChainReactionCards = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<ChainReactionResult | null>(null);
  const [availableEffects, setAvailableEffects] = useState(chainReactionService.getAvailableEffects());
  const [unlockedEffects, setUnlockedEffects] = useState<string[]>(['blockchain-hack', 'airdrop-strike']);
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
    <Card className="glassmorphism border-purple-500/40 p-8 h-full flex flex-col feature-box relative bg-gradient-to-br from-black/60 to-purple-950/30 shadow-xl overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="monad-parallel-lines">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="monad-parallel-line"
              style={{
                top: `${(i + 1) * 20}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-4 mb-6 relative z-10">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Zap className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white text-shadow-glow-purple">Monad Chain Reaction Cards</h3>
          <p className="text-gray-300 mt-1">Cards that trigger parallel smart contract events on Monad blockchain</p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 text-sm shadow-md shadow-purple-900/30">Monad Exclusive</Badge>
      </div>

      {/* Execution Stats */}
      {executionStats.totalExecutions > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-lg border border-blue-500/30 shadow-lg relative z-10 overflow-hidden">
          {/* Stats background effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="monad-execution-indicator"></div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mr-2 shadow-md shadow-blue-900/30">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-base font-bold text-blue-300 text-shadow-sm">Monad Execution Stats</h4>
            </div>
            <div className="flex items-center text-xs text-blue-300 bg-blue-900/40 px-2 py-1 rounded-full border border-blue-500/30">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-900/40 p-3 rounded-md border border-blue-500/30 shadow-inner">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-blue-300 font-medium">Total Executions</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-sm">{executionStats.totalExecutions}</span>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-3 rounded-md border border-indigo-500/30 shadow-inner">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-indigo-300 font-medium">Effects Triggered</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-sm">{executionStats.totalEffectsTriggered}</span>
              </div>
            </div>
            <div className="bg-blue-900/40 p-3 rounded-md border border-blue-500/30 shadow-inner">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-blue-300 font-medium">Avg. Execution Time</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-sm">{executionStats.averageExecutionTime.toFixed(2)}<span className="text-sm text-blue-300 ml-1">ms</span></span>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-3 rounded-md border border-indigo-500/30 shadow-inner">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-indigo-300 font-medium">Success Rate</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-sm">{executionStats.successRate.toFixed(1)}<span className="text-sm text-indigo-300 ml-1">%</span></span>
              </div>
            </div>
          </div>

          {/* Performance comparison */}
          <div className="mt-4 pt-4 border-t border-blue-500/30">
            <h5 className="text-sm font-bold text-blue-300 mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-400" />
              Monad Performance Comparison
            </h5>
            <div className="relative h-8 bg-black/40 rounded-md overflow-hidden border border-blue-500/20">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600/70 to-indigo-600/70 flex items-center justify-end px-3 text-xs font-bold text-white shadow-md" style={{ width: '15%' }}>
                Monad
              </div>
              <div className="absolute inset-y-0 left-0 bg-gray-700/50 flex items-center px-3 text-xs text-white" style={{ width: '100%', paddingLeft: '16%' }}>
                Other L1s (~10x slower)
              </div>
            </div>
            <div className="flex justify-between text-xs text-blue-300 mt-2 px-1">
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
        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-4 rounded-lg border-2 border-purple-500/60 shadow-lg shadow-purple-900/40 relative overflow-hidden blockchain-hack-card">
          {/* Animated particles background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="particles-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20 animate-float"
                  style={{
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 10 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                />
              ))}
            </div>
          </div>
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-lg border border-purple-500/30 glow-effect-purple"></div>
          <div className="flex items-center mb-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-purple-600/30 animate-pulse-slow">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xl text-shadow-glow-purple">Blockchain Hack</h4>
              <div className="flex items-center mt-1">
                <Badge className="bg-purple-600 text-white text-xs mr-2 shadow-sm shadow-purple-500/50">Parallel</Badge>
                <Badge className="bg-indigo-600 text-white text-xs shadow-sm shadow-indigo-500/50">Monad Exclusive</Badge>
              </div>
            </div>
          </div>
          <div className="relative z-10 mb-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-md p-3 border-l-4 border-purple-500 shadow-inner shadow-purple-900/20">
            <p className="text-sm text-white font-medium leading-relaxed">
              Steals a random NFT from opponent's wallet using Monad's parallel execution technology
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
            <div className="bg-gradient-to-r from-black/40 to-purple-900/30 p-3 rounded-md border border-purple-500/30 shadow-inner shadow-purple-900/20">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-purple-200 font-medium">Mana Cost</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-glow-purple">7</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-black/40 to-indigo-900/30 p-3 rounded-md border border-indigo-500/30 shadow-inner shadow-indigo-900/20">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-indigo-200 font-medium">Success Rate</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-glow-purple">85%</span>
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center shadow-md shadow-purple-900/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/40 border border-purple-500/50 relative z-10 h-12 text-base font-bold overflow-hidden group"
            size="lg"
            variant="default"
            disabled={isTriggering}
            onClick={() => triggerChainReaction('blockchain-hack')}
          >
            {/* Button background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isTriggering ? (
              <div className="flex items-center relative z-10">
                <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-white font-medium">Processing on Monad...</span>
              </div>
            ) : (
              <div className="flex items-center relative z-10">
                <Zap className="h-5 w-5 mr-3 animate-pulse text-white" />
                <span className="text-white font-medium">Trigger Blockchain Hack</span>
                <div className="absolute -right-1 -top-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full transform rotate-12 shadow-md shadow-purple-900/30 border border-white/20">Monad</div>
              </div>
            )}
          </Button>
          {lastResult && lastResult.effects.some(e => e.effectId === 'blockchain-hack' && e.success) && (
            <div className="mt-4 space-y-3 relative z-10">
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-3 rounded-md border border-green-500/40 shadow-md">
                <h5 className="text-sm font-bold text-green-400 mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-green-300" />
                  <span className="text-shadow-sm">Blockchain Hack Successful!</span>
                </h5>
                <ExecutionMetrics result={lastResult} className="bg-black/20 p-2 rounded-md" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-4 rounded-lg border-2 border-pink-500/60 shadow-lg shadow-pink-900/40 relative overflow-hidden airdrop-strike-card">
          {/* Comic picture background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 opacity-30"></div>
            <div className="particles-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20 animate-float"
                  style={{
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 10 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                />
              ))}
            </div>
          </div>
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-lg border border-pink-500/30 glow-effect"></div>
          <div className="flex items-center mb-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-3 shadow-lg shadow-pink-600/30 animate-pulse-slow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xl text-shadow-glow">Airdrop Strike</h4>
              <div className="flex items-center mt-1">
                <Badge className="bg-pink-600 text-white text-xs mr-2 shadow-sm shadow-pink-500/50">NFT</Badge>
                <Badge className="bg-purple-600 text-white text-xs shadow-sm shadow-purple-500/50">Monad Exclusive</Badge>
              </div>
            </div>
          </div>
          <div className="relative z-10 mb-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-md p-3 border-l-4 border-pink-500 shadow-inner shadow-pink-900/20">
            <p className="text-sm text-white font-medium leading-relaxed">
              Mints a surprise token directly to player's wallet with random attributes and properties stored on the Monad blockchain
            </p>
            <div className="mt-2 flex justify-center">
              <div className="h-24 w-32 rounded-md border border-pink-500/30 shadow-md shadow-pink-900/30 transform hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                <div className="text-4xl">🎁</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
            <div className="bg-gradient-to-r from-black/40 to-pink-900/30 p-3 rounded-md border border-pink-500/30 shadow-inner shadow-pink-900/20">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-pink-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-pink-200 font-medium">Mana Cost</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-glow">5</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-black/40 to-purple-900/30 p-3 rounded-md border border-purple-500/30 shadow-inner shadow-purple-900/20">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2 animate-pulse"></div>
                <span className="text-xs text-purple-200 font-medium">Token Quality</span>
              </div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl font-bold text-white text-shadow-glow">1-100</span>
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center justify-center shadow-md shadow-pink-900/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-900/40 border border-pink-500/50 relative z-10 h-12 text-base font-bold overflow-hidden group"
            size="lg"
            variant="default"
            disabled={isTriggering}
            onClick={() => triggerChainReaction('airdrop-strike')}
          >
            {/* Button background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isTriggering ? (
              <div className="flex items-center relative z-10">
                <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-white font-medium">Minting NFT on Monad...</span>
              </div>
            ) : (
              <div className="flex items-center relative z-10">
                <Sparkles className="h-5 w-5 mr-3 animate-pulse text-white" />
                <span className="text-white font-medium">Mint Surprise NFT Token</span>
                <div className="absolute -right-1 -top-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full transform rotate-12 shadow-md shadow-pink-900/30 border border-white/20">Monad</div>
              </div>
            )}
          </Button>
          {lastResult && lastResult.effects.some(e => e.effectId === 'airdrop-strike' && e.success) && (
            <div className="mt-4 space-y-3 relative z-10">
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-3 rounded-md border border-green-500/40 shadow-md">
                <h5 className="text-sm font-bold text-green-400 mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-green-300" />
                  <span className="text-shadow-sm">NFT Minted Successfully on Monad!</span>
                </h5>
                <ExecutionMetrics result={lastResult} className="bg-black/20 p-2 rounded-md" />
              </div>
              {lastResult.mintedNFT && (
                <div className="mt-4 bg-gradient-to-br from-purple-900/30 to-black/40 p-3 rounded-md border border-purple-500/30 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-pink-500 to-purple-500 text-white text-xs px-3 py-1 font-bold">
                    Monad NFT
                  </div>
                  <h5 className="text-sm font-medium text-white mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-pink-400" /> Your New NFT Token
                  </h5>
                  <NFTCard nft={lastResult.mintedNFT} className="border-pink-500/30 shadow-lg shadow-pink-900/20" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-5 rounded-lg border border-purple-500/30 shadow-lg relative z-10 overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-md shadow-purple-900/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-bold text-white text-shadow-glow-purple">How Monad Chain Reactions Work</h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-purple-300 hover:text-purple-200 border-purple-500/50 bg-purple-900/30 hover:bg-purple-900/50 shadow-md transition-all duration-300"
            onClick={() => setShowVisualizer(!showVisualizer)}
          >
            {showVisualizer ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Hide Visualizer</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Show Visualizer</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gradient-to-r from-purple-900/20 to-black/30 p-3 rounded-lg border border-purple-500/30 shadow-inner transition-all duration-300 hover:shadow-md hover:border-purple-500/50 group">
            <div className="flex items-center">
              <div className="flex-none h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-purple-900/30 group-hover:shadow-lg group-hover:shadow-purple-900/40 transition-all duration-300">1</div>
              <p className="text-sm text-white font-medium">Initial card effect triggers a smart contract function call on the Monad blockchain</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/20 to-black/30 p-3 rounded-lg border border-purple-500/30 shadow-inner transition-all duration-300 hover:shadow-md hover:border-purple-500/50 group">
            <div className="flex items-center">
              <div className="flex-none h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-purple-900/30 group-hover:shadow-lg group-hover:shadow-purple-900/40 transition-all duration-300">2</div>
              <p className="text-sm text-white font-medium">Monad's parallel execution processes multiple effects simultaneously in &lt;1 second</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/20 to-black/30 p-3 rounded-lg border border-purple-500/30 shadow-inner transition-all duration-300 hover:shadow-md hover:border-purple-500/50 group">
            <div className="flex items-center">
              <div className="flex-none h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-purple-900/30 group-hover:shadow-lg group-hover:shadow-purple-900/40 transition-all duration-300">3</div>
              <p className="text-sm text-white font-medium">Each effect in the chain can trigger additional effects on other cards in parallel</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/20 to-black/30 p-3 rounded-lg border border-purple-500/30 shadow-inner transition-all duration-300 hover:shadow-md hover:border-purple-500/50 group">
            <div className="flex items-center">
              <div className="flex-none h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-purple-900/30 group-hover:shadow-lg group-hover:shadow-purple-900/40 transition-all duration-300">4</div>
              <p className="text-sm text-white font-medium">Real blockchain state changes affect gameplay and NFT ownership instantly</p>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-lg border border-blue-500/30 shadow-md">
          <h5 className="text-base font-bold text-blue-300 mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-400" /> Monad Technology Advantages
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/20 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
              <span className="text-sm text-white">Up to 10,000x faster execution than traditional blockchains</span>
            </div>
            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/20 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
              <span className="text-sm text-white">Parallel processing allows multiple chain reactions simultaneously</span>
            </div>
            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/20 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
              <span className="text-sm text-white">Lower gas fees make complex card interactions economically viable</span>
            </div>
            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/20 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
              <span className="text-sm text-white">Atomic transactions ensure all chain effects complete or none do</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChainReactionCards;
