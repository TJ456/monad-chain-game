import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from 'lucide-react';
import { chainReactionService, ChainEffect, ChainReactionResult } from '../services/ChainReactionService';
import GameCard from '@/components/GameCard';
import ExecutionMetrics from './ExecutionMetrics';
import { Card as GameCardType, CardRarity, CardType } from '@/types/game';

interface ChainReactionVisualizerProps {
  effectId?: string;
  onComplete?: (result: any) => void;
}

const ChainReactionVisualizer: React.FC<ChainReactionVisualizerProps> = ({
  effectId = 'blockchain-hack',
  onComplete
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [chainEffects, setChainEffects] = useState<ChainEffect[]>([]);
  const [cards, setCards] = useState<GameCardType[]>([]);
  const [visualizationResult, setVisualizationResult] = useState<ChainReactionResult | null>(null);

  // Initialize with the chain effect and its chained effects
  useEffect(() => {
    const mainEffect = chainReactionService.getEffect(effectId);
    if (!mainEffect) return;

    const effects = [mainEffect];

    // Add chained effects
    if (mainEffect.chainedEffects) {
      for (const chainedId of mainEffect.chainedEffects) {
        const chainedEffect = chainReactionService.getEffect(chainedId);
        if (chainedEffect) {
          effects.push(chainedEffect);
        }
      }
    }

    setChainEffects(effects);

    // Create sample cards for visualization
    const sampleCards: GameCardType[] = effects.map((effect, index) => ({
      id: `card-${effect.id}`,
      name: effect.name,
      description: effect.description,
      image: `/cards/${effect.id}.png`,
      rarity: index === 0 ? CardRarity.EPIC : (index === 1 ? CardRarity.RARE : CardRarity.UNCOMMON),
      type: index === 0 ? CardType.ATTACK : (index === 1 ? CardType.UTILITY : CardType.DEFENSE),
      mana: 3 + index,
      attack: 2 + index * 2,
      defense: 1 + index,
      monadId: `0x${Math.random().toString(16).substring(2, 10)}`,
      specialEffect: {
        description: effect.description,
        effectType: effect.effectType.toUpperCase(),
        chainReaction: {
          canTriggerChain: effect.chainable,
          chainedEffects: effect.chainedEffects,
          triggerProbability: effect.triggerProbability,
          parallelExecution: true,
          executionTimeMs: 300
        }
      },
      onChainMetadata: {
        creator: "0xMonadChainReaction",
        creationBlock: 1400000 + index * 1000,
        evolutionStage: 1,
        battleHistory: []
      }
    }));

    setCards(sampleCards);
  }, [effectId]);

  const startAnimation = () => {
    setIsAnimating(true);
    setCurrentStep(0);

    // Animate through each step
    const animateSteps = async () => {
      for (let i = 0; i < chainEffects.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Animation complete
      setIsAnimating(false);
      // Create a more detailed result object
      const executionTime = chainEffects.length * 300; // Simulated execution time
      const result: ChainReactionResult = {
        success: true,
        effects: chainEffects.map((effect, index) => ({
          effectId: effect.id,
          targetId: `target-${index}`,
          success: true,
          result: { magnitude: effect.magnitude },
          executionTimeMs: 100 + (index * 50) // Varying execution times
        })),
        totalEffectsTriggered: chainEffects.length,
        executionTimeMs: executionTime,
        parallelSpeedup: parseFloat((chainEffects.length / (executionTime / 1000)).toFixed(2)),
        gasUsed: 50000 + (chainEffects.length * 15000),
        networkLatency: 25,
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Date.now() / 1000)
      };

      // Store the result
      setVisualizationResult(result);

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(result);
      }
    };

    animateSteps();
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 p-5 overflow-hidden shadow-xl relative">
      {/* Circuit board pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none circuit-board-pattern"></div>

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center mr-3 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-md transform rotate-45"></div>
            <Zap className="h-5 w-5 text-white relative z-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Monad Parallel Execution</h3>
            <p className="text-xs text-slate-400">Visualizing blockchain operations in real-time</p>
          </div>
        </div>
        <Badge className="bg-slate-800 text-blue-400 border border-blue-500/50 px-3 py-1">Monad Technology</Badge>
      </div>

      <div className="relative bg-slate-950/50 p-4 rounded-lg border border-slate-700/50 mb-4">
        <div className="absolute inset-0 overflow-hidden">
          {/* Data flow lines */}
          {isAnimating && [
            { top: '20%', delay: '0s', duration: '3s' },
            { top: '40%', delay: '0.5s', duration: '2.5s' },
            { top: '60%', delay: '0.2s', duration: '2.8s' },
            { top: '80%', delay: '0.7s', duration: '2.2s' }
          ].map((line, i) => (
            <div
              key={i}
              className="absolute h-px bg-blue-500/30 data-flow-line"
              style={{
                top: line.top,
                left: 0,
                right: 0,
                animationDelay: line.delay,
                animationDuration: line.duration
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-5 overflow-x-auto py-2 chain-cards-container relative z-10">
          {cards.map((card, index) => (
            <div key={card.id} className="relative mx-3 first:ml-0 last:mr-0">
              <div className="relative">
                {/* Card container with tech frame */}
                <div className={`card-tech-frame ${isAnimating && index <= currentStep ? 'active' : ''}`}>
                  <div className="absolute -inset-1 border border-slate-600/50 rounded-lg"></div>
                  <div className="absolute -inset-1 border-2 border-transparent rounded-lg tech-frame-highlight"></div>

                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/70 rounded-tl-md"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/70 rounded-tr-md"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/70 rounded-bl-md"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/70 rounded-br-md"></div>

                  <div className={`transition-all duration-500 transform ${isAnimating && index <= currentStep ? 'scale-105' : ''} ${isAnimating && index < currentStep ? 'opacity-80' : ''}`}>
                    <GameCard
                      card={card}
                      className="shadow-lg"
                      showDetails={false}
                    />
                  </div>
                </div>

                {/* Processing indicator */}
                {isAnimating && index === currentStep && (
                  <div className="absolute -inset-1 border-2 border-blue-500/70 rounded-lg tech-processing-indicator"></div>
                )}

                {/* Execution status indicator */}
                {isAnimating && (
                  <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center z-20">
                    <div className={`h-4 w-4 rounded-full ${index < currentStep ? 'bg-green-500' : (index === currentStep ? 'bg-blue-500 animate-pulse' : 'bg-slate-700')}`}></div>
                  </div>
                )}
              </div>

              {/* Connection lines between cards */}
              {index < cards.length - 1 && (
                <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 flex items-center">
                  <div className={`h-px w-6 transition-colors duration-300 ${isAnimating && index < currentStep ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-3 w-3 rounded-full transition-colors duration-300 ${isAnimating && index < currentStep ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Execution progress bar */}
        {isAnimating && (
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-linear rounded-full"
              style={{ width: `${(currentStep + 1) / chainEffects.length * 100}%` }}
            ></div>
          </div>
        )}

        {/* Parallel execution indicators */}
        {isAnimating && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {chainEffects.map((effect, index) => (
              <div
                key={effect.id}
                className={`h-1 rounded-full transition-all duration-300 ${index <= currentStep ? 'bg-blue-500' : 'bg-slate-700'}`}
              ></div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
        <div className="flex-1">
          {isAnimating ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping mr-2"></div>
                <span className="text-sm font-medium text-blue-400">Processing on Monad Blockchain</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
                  Step {currentStep + 1}/{chainEffects.length}
                </div>
                <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
                  Parallel Execution
                </div>
                <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
                  ~{Math.round(chainEffects.length * 300)}ms
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-300 font-medium">Monad Parallel Execution Technology</p>
              <p className="text-xs text-slate-500 mt-1">Visualize how Monad processes multiple blockchain operations simultaneously</p>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 shadow-md"
          disabled={isAnimating || chainEffects.length === 0}
          onClick={startAnimation}
        >
          {isAnimating ? (
            <div className="flex items-center">
              <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Zap className="h-3 w-3 mr-2" />
              <span>Execute Chain Reaction</span>
            </div>
          )}
        </Button>
      </div>

      {isAnimating && (
        <div className="mt-3 bg-blue-900/20 border border-blue-500/20 rounded p-2">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-1 rounded mr-2">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-400 font-medium">Monad Parallel Execution Active</p>
              <p className="text-xs text-slate-400 mt-1">All chain reaction effects are being processed simultaneously instead of sequentially</p>
            </div>
          </div>
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/50 monad-execution-indicator"></div>
          </div>
        </div>
      )}

      {/* Show execution metrics after animation completes */}
      {!isAnimating && visualizationResult && (
        <div className="mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center mb-2">
            <div className="h-6 w-6 bg-slate-800 rounded-md flex items-center justify-center mr-2">
              <Zap className="h-3 w-3 text-blue-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-300">Execution Results</h4>
          </div>
          <ExecutionMetrics result={visualizationResult} className="bg-slate-950/50 p-2 rounded border border-slate-800" />
        </div>
      )}
    </Card>
  );
};

export default ChainReactionVisualizer;
