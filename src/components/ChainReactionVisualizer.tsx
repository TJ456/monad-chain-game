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
    <Card className="glassmorphism border-purple-500/30 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Zap className="h-5 w-5 text-purple-400 mr-2" />
          <h3 className="text-lg font-bold text-white">Monad Chain Reaction</h3>
        </div>
        <Badge className="bg-purple-600 text-white">Parallel Execution</Badge>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4 overflow-x-auto py-2 chain-cards-container">
          {cards.map((card, index) => (
            <div key={card.id} className="relative mx-2 first:ml-0 last:mr-0">
              <div className={`transition-all duration-500 transform ${
                isAnimating && index <= currentStep ? 'scale-110 -translate-y-2' : ''
              } ${
                isAnimating && index < currentStep ? 'opacity-70' : ''
              }`}>
                <GameCard
                  card={card}
                  className="shadow-lg"
                  showDetails={false}
                />
              </div>

              {index < cards.length - 1 && (
                <div className="absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <ArrowRight className={`h-4 w-4 ${
                    isAnimating && index < currentStep ? 'text-green-400' : 'text-gray-600'
                  }`} />
                </div>
              )}

              {isAnimating && index === currentStep && (
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg animate-pulse pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {isAnimating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-green-400">
            <div
              className="h-full bg-white transition-all duration-500 ease-linear"
              style={{
                width: `${(currentStep + 1) / chainEffects.length * 100}%`,
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5)'
              }}
            ></div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {isAnimating ? (
            <span>Processing on Monad: Step {currentStep + 1} of {chainEffects.length}</span>
          ) : (
            <span>Visualize how Monad processes chain reactions in parallel</span>
          )}
        </div>

        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-indigo-600"
          disabled={isAnimating || chainEffects.length === 0}
          onClick={startAnimation}
        >
          {isAnimating ? 'Processing...' : 'Visualize Chain Reaction'}
        </Button>
      </div>

      {isAnimating && (
        <div className="mt-3 text-xs text-blue-400 animate-pulse">
          Monad's parallel execution allows all effects to be processed simultaneously
        </div>
      )}

      {/* Show execution metrics after animation completes */}
      {!isAnimating && visualizationResult && (
        <div className="mt-3">
          <ExecutionMetrics result={visualizationResult} />
        </div>
      )}
    </Card>
  );
};

export default ChainReactionVisualizer;
