import { monadGameService } from './MonadGameService';
import { monadChainReactionService } from './MonadChainReactionService';
import { monadNFTService, MintedNFT } from './MonadNFTService';
import { toast } from "sonner";
import { Card as GameCardType } from '@/types/game';

export interface ChainEffect {
  id: string;
  name: string;
  description: string;
  targetType: 'card' | 'player' | 'nft' | 'global';
  effectType: 'buff' | 'debuff' | 'transform' | 'mint' | 'burn' | 'transfer';
  magnitude: number;
  duration: number;
  chainable: boolean;
  triggerProbability: number;
  chainedEffects?: string[];
}

export interface ChainReactionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  effects: {
    effectId: string;
    targetId: string;
    success: boolean;
    result: any;
    executionTimeMs?: number; // Individual effect execution time
  }[];
  totalEffectsTriggered: number;
  executionTimeMs: number;
  parallelSpeedup?: number; // How much faster than sequential execution
  gasUsed?: number; // Simulated gas usage
  networkLatency?: number; // Network latency in ms
  mintedNFT?: MintedNFT; // NFT minted during the chain reaction
}

class ChainReactionService {
  // Store the last copied card for reference
  private lastCopiedCard: any = null;

  // Get opponent cards - in a real implementation, this would fetch from the blockchain
  private async getOpponentCards(): Promise<any[]> {
    try {
      // In a real implementation, this would query the blockchain for opponent's cards
      // For now, we'll use a simulated set of opponent cards
      const opponentCards = [
        {
          id: "opponent-card-1",
          name: "Quantum Entangler",
          description: "A powerful card that entangles quantum states",
          image: "/quantum-entangler.png",
          rarity: "LEGENDARY",
          type: "ATTACK",
          attack: 8,
          defense: 5,
          mana: 7,
          monadId: "0xMONAD101",
          onChainMetadata: {
            creator: "0xOpponentAddress",
            creationBlock: 1420500,
            evolutionStage: 2,
            battleHistory: [1, 1, 1, 0]
          }
        },
        {
          id: "opponent-card-2",
          name: "Parallel Processor",
          description: "Executes multiple operations simultaneously",
          image: "/parallel-processor.png",
          rarity: "EPIC",
          type: "UTILITY",
          attack: 5,
          defense: 7,
          mana: 6,
          monadId: "0xMONAD102",
          onChainMetadata: {
            creator: "0xOpponentAddress",
            creationBlock: 1420550,
            evolutionStage: 1,
            battleHistory: [1, 0, 1, 1]
          }
        },
        {
          id: "opponent-card-3",
          name: "Merkle Guardian",
          description: "Protects data integrity with Merkle proofs",
          image: "/merkle-guardian.png",
          rarity: "RARE",
          type: "DEFENSE",
          attack: 3,
          defense: 9,
          mana: 5,
          monadId: "0xMONAD103",
          onChainMetadata: {
            creator: "0xOpponentAddress",
            creationBlock: 1420600,
            evolutionStage: 1,
            battleHistory: [0, 1, 1, 1]
          }
        }
      ];

      return opponentCards;
    } catch (error) {
      console.error('Error fetching opponent cards:', error);
      return [];
    }
  }

  // Get the last copied card
  public getLastCopiedCard(): any {
    return this.lastCopiedCard;
  }
  private readonly effects: Record<string, ChainEffect> = {
    'blockchain-hack': {
      id: 'blockchain-hack',
      name: 'Blockchain Hack',
      description: 'Steals a random NFT from opponent\'s wallet',
      targetType: 'nft',
      effectType: 'transfer',
      magnitude: 1,
      duration: 1,
      chainable: true,
      triggerProbability: 0.85,
      chainedEffects: ['data-corruption']
    },
    'data-corruption': {
      id: 'data-corruption',
      name: 'Data Corruption',
      description: 'Reduces opponent card stats temporarily',
      targetType: 'card',
      effectType: 'debuff',
      magnitude: 2,
      duration: 2,
      chainable: true,
      triggerProbability: 0.7,
      chainedEffects: ['parallel-boost']
    },
    'parallel-boost': {
      id: 'parallel-boost',
      name: 'Parallel Boost',
      description: 'Boosts your card stats using Monad\'s parallel execution',
      targetType: 'card',
      effectType: 'buff',
      magnitude: 3,
      duration: 2,
      chainable: false,
      triggerProbability: 0.9
    },
    'airdrop-strike': {
      id: 'airdrop-strike',
      name: 'Airdrop Strike',
      description: 'Mints a surprise token directly to player\'s wallet',
      targetType: 'player',
      effectType: 'mint',
      magnitude: 1,
      duration: 1,
      chainable: true,
      triggerProbability: 0.8,
      chainedEffects: ['monad-amplifier']
    },
    'monad-amplifier': {
      id: 'monad-amplifier',
      name: 'Monad Amplifier',
      description: 'Increases the power of all your cards using Monad\'s parallel processing',
      targetType: 'global',
      effectType: 'buff',
      magnitude: 1,
      duration: 3,
      chainable: false,
      triggerProbability: 0.75
    }
  };

  /**
   * Get all available chain reaction effects
   */
  public getAvailableEffects(): ChainEffect[] {
    return Object.values(this.effects);
  }

  /**
   * Get a specific chain reaction effect by ID
   */
  public getEffect(effectId: string): ChainEffect | undefined {
    return this.effects[effectId];
  }

  /**
   * Trigger a chain reaction starting with the specified effect
   * @param effectId The ID of the initial effect to trigger
   * @param sourceCardId The ID of the card triggering the effect (optional)
   * @param targetId The ID of the target (card, player, etc.)
   */
  public async triggerChainReaction(
    effectId: string,
    sourceCardId?: string,
    targetId?: string
  ): Promise<ChainReactionResult> {
    const startTime = Date.now();
    const effect = this.effects[effectId];

    if (!effect) {
      throw new Error(`Chain reaction effect ${effectId} not found`);
    }

    const toastId = `chain-reaction-${effectId}-${Date.now()}`;
    toast.loading(`Initiating Monad chain reaction: ${effect.name}`, { id: toastId });

    try {
      // Try to use the real Monad blockchain implementation
      console.log('Attempting to trigger chain reaction on Monad blockchain...');
      const result = await monadChainReactionService.triggerChainReaction(
        effect.id,
        targetId || 'player',
        effect.magnitude,
        effect.duration
      );

      // If successful, return the result
      if (result.success) {
        console.log('Chain reaction successfully executed on Monad blockchain');
        return result;
      }

      // If the blockchain transaction failed, fall back to simulation
      console.warn('Blockchain transaction failed, falling back to simulation');
      toast.loading('Blockchain transaction failed, using simulation instead', { id: toastId });
    } catch (error) {
      // If there was an error with the blockchain, fall back to simulation
      console.error('Error triggering chain reaction on blockchain:', error);
      toast.loading('Error connecting to Monad blockchain, using simulation instead', { id: toastId });
    }

    // Fallback to simulation if blockchain transaction failed
    return this.simulateChainReaction(effect, startTime, toastId, sourceCardId, targetId);
  }

  /**
   * Simulate a chain reaction (fallback when blockchain is not available)
   */
  private async simulateChainReaction(
    effect: ChainEffect,
    startTime: number,
    toastId: string,
    sourceCardId?: string,
    targetId?: string
  ): Promise<ChainReactionResult> {
    console.log('Simulating chain reaction locally...');

    // Track all effects that were triggered
    const triggeredEffects: ChainReactionResult['effects'] = [];
    let totalEffectsTriggered = 0;

    // Simulate blockchain delay (would be much faster on Monad)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Execute the initial effect
    const initialSuccess = Math.random() < effect.triggerProbability;

    if (initialSuccess) {
      totalEffectsTriggered++;
      triggeredEffects.push({
        effectId: effect.id,
        targetId: targetId || 'unknown',
        success: true,
        result: {
          magnitude: effect.magnitude,
          duration: effect.duration
        }
      });

      toast.loading(`Chain reaction progressing: ${effect.name} activated`, { id: toastId });

      // If the effect is chainable and has chained effects, trigger those
      if (effect.chainable && effect.chainedEffects && effect.chainedEffects.length > 0) {
        // In a real Monad implementation, these would be processed in parallel
        // For demo, we'll process them sequentially with small delays
        for (const chainedEffectId of effect.chainedEffects) {
          const chainedEffect = this.effects[chainedEffectId];

          if (!chainedEffect) continue;

          // Simulate Monad's parallel execution delay (very short)
          await new Promise(resolve => setTimeout(resolve, 500));

          const chainedSuccess = Math.random() < chainedEffect.triggerProbability;

          if (chainedSuccess) {
            totalEffectsTriggered++;
            triggeredEffects.push({
              effectId: chainedEffect.id,
              targetId: targetId || 'unknown',
              success: true,
              result: {
                magnitude: chainedEffect.magnitude,
                duration: chainedEffect.duration
              }
            });

            toast.loading(`Chain reaction continuing: ${chainedEffect.name} activated`, { id: toastId });

            // For demo purposes, we'll only go one level deep in the chain
            // A real implementation could go deeper or have more complex chains
          } else {
            triggeredEffects.push({
              effectId: chainedEffect.id,
              targetId: targetId || 'unknown',
              success: false,
              result: null
            });
          }
        }
      }

      // Handle special effects based on the effect type
      if (totalEffectsTriggered > 0) {
        try {
          let txResult;
          let mintedNFT;

          // Handle Airdrop Strike effect - mint an NFT
          if (effect.id === 'airdrop-strike') {
            console.log('Airdrop Strike activated - minting NFT on Monad blockchain');
            toast.loading(`Minting surprise NFT token to your wallet...`, { id: toastId });

            // Generate a random quality between 1-100
            const tokenQuality = Math.floor(Math.random() * 100) + 1;

            try {
              // Try to mint the NFT on the real blockchain
              mintedNFT = await monadNFTService.mintSurpriseToken(tokenQuality);
              txResult = {
                txHash: mintedNFT.transactionHash,
                blockNumber: mintedNFT.blockNumber
              };

              toast.loading(`NFT minted successfully! Adding to your wallet...`, { id: toastId });
            } catch (error) {
              console.error('Error minting NFT on blockchain:', error);
              // Fallback to simulation
              mintedNFT = monadNFTService.simulateMintedNFT();
              txResult = {
                txHash: mintedNFT.transactionHash,
                blockNumber: mintedNFT.blockNumber
              };
            }
          }
          // Handle Blockchain Hack effect - copy an opponent's card
          else if (effect.id === 'blockchain-hack') {
            // Get a random opponent card to copy
            const opponentCards = await this.getOpponentCards();

            if (opponentCards && opponentCards.length > 0) {
              // Select a random card from opponent's collection
              const randomIndex = Math.floor(Math.random() * opponentCards.length);
              const cardToCopy = opponentCards[randomIndex];

              // Create a copy with modified properties to show it's a copy
              const copiedCard = {
                ...cardToCopy,
                name: `Copied ${cardToCopy.name}`,
                description: `Copied from opponent's wallet using Monad's parallel execution technology`,
                // Add a special property to indicate this is a temporary copy
                isCopied: true,
                // Set expiration in turns
                expiresInTurns: effect.duration + 2,
                originalOwner: cardToCopy.onChainMetadata?.creator || 'opponent'
              };

              // Add the copied card to player's deck
              txResult = await monadGameService.addCopiedCardToPlayerDeck(copiedCard);

              // Store the copied card information for display
              this.lastCopiedCard = copiedCard;
            } else {
              // Fallback if no opponent cards are available
              txResult = await monadGameService.mintCard({
                name: "Blockchain Hack Fallback",
                description: "No opponent cards were available to copy",
                rarity: 2, // Epic
                cardType: 2, // Special
                attack: effect.magnitude * 2,
                defense: effect.magnitude,
                mana: 5,
                special: effect.triggerProbability * 100
              });
            }
          } else {
            // Simulate a transaction result for other effects
            txResult = {
              txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
              blockNumber: Math.floor(Date.now() / 1000)
            };
          }

          toast.success(`Chain Reaction Complete! (Simulation)`, {
            id: toastId,
            description: `${totalEffectsTriggered} effects triggered in ${Date.now() - startTime}ms on Monad blockchain`
          });

          // Calculate additional metrics
          const executionTime = Date.now() - startTime;
          const networkLatency = Math.floor(Math.random() * 50) + 10; // Simulate 10-60ms network latency
          const gasUsed = 50000 + (totalEffectsTriggered * 15000); // Base gas + per effect gas
          const sequentialTime = totalEffectsTriggered * 300; // Simulate sequential execution time
          const parallelSpeedup = sequentialTime / (executionTime - networkLatency);

          // Add execution time to each effect
          const effectsWithTiming = triggeredEffects.map(effect => ({
            ...effect,
            executionTimeMs: Math.floor(Math.random() * 200) + 100 // 100-300ms per effect
          }));

          return {
            success: true,
            transactionHash: txResult.txHash,
            blockNumber: txResult.blockNumber,
            effects: effectsWithTiming,
            totalEffectsTriggered,
            executionTimeMs: executionTime,
            parallelSpeedup: parseFloat(parallelSpeedup.toFixed(2)),
            gasUsed,
            networkLatency,
            mintedNFT: mintedNFT // Include the minted NFT if available
          };
        } catch (error) {
          console.error('Error in chain reaction simulation:', error);
          toast.error(`Chain reaction simulation encountered an error`, { id: toastId });

          const executionTime = Date.now() - startTime;
          return {
            success: false,
            effects: triggeredEffects,
            totalEffectsTriggered,
            executionTimeMs: executionTime,
            networkLatency: Math.floor(Math.random() * 50) + 10,
            gasUsed: 25000 // Base gas for failed transaction
          };
        }
      }
    } else {
      triggeredEffects.push({
        effectId: effect.id,
        targetId: targetId || 'unknown',
        success: false,
        result: null
      });

      toast.error(`Chain reaction failed: ${effect.name} did not activate`, { id: toastId });
    }

    const executionTime = Date.now() - startTime;
    return {
      success: initialSuccess && totalEffectsTriggered > 0,
      effects: triggeredEffects,
      totalEffectsTriggered,
      executionTimeMs: executionTime,
      networkLatency: Math.floor(Math.random() * 50) + 10,
      gasUsed: initialSuccess ? 35000 : 25000 // Different gas usage based on success
    };
  }

  /**
   * Simulate a blockchain transaction
   * This is used as a fallback when the real blockchain transaction fails
   */
  private async simulateBlockchainTransaction(numEffects: number = 1): Promise<{ txHash: string, blockNumber: number }> {
    try {
      // Try to use the Monad blockchain explorer URL for the transaction hash
      const explorerUrl = monadChainReactionService.getExplorerUrl('');
      const baseUrl = explorerUrl.split('/tx/')[0];

      // Generate a realistic transaction hash
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Simulate blockchain delay based on number of effects (would be much faster on Monad)
      const delay = Math.min(1000, 200 * numEffects);
      await new Promise(resolve => setTimeout(resolve, delay));

      return {
        txHash,
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    } catch (error) {
      console.error('Error simulating blockchain transaction:', error);

      // Fallback to completely simulated transaction
      return {
        txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Date.now() / 1000)
      };
    }
  }

  /**
   * Apply a chain reaction effect to a card
   * This would modify the card's stats based on the effect
   */
  public applyEffectToCard(card: GameCardType, effect: ChainEffect): GameCardType {
    const updatedCard = { ...card };

    switch (effect.effectType) {
      case 'buff':
        updatedCard.attack = (updatedCard.attack || 0) + effect.magnitude;
        updatedCard.defense = (updatedCard.defense || 0) + effect.magnitude;
        break;
      case 'debuff':
        updatedCard.attack = Math.max(0, (updatedCard.attack || 0) - effect.magnitude);
        updatedCard.defense = Math.max(0, (updatedCard.defense || 0) - effect.magnitude);
        break;
      case 'transform':
        // Would transform the card into something else
        updatedCard.name = `Transformed ${updatedCard.name}`;
        updatedCard.rarity = 'LEGENDARY';
        break;
      // Other effect types would be implemented here
    }

    // Add the effect to the card's metadata
    if (!updatedCard.activeEffects) {
      updatedCard.activeEffects = [];
    }

    updatedCard.activeEffects.push({
      id: effect.id,
      name: effect.name,
      duration: effect.duration,
      magnitude: effect.magnitude
    });

    return updatedCard;
  }
}

export const chainReactionService = new ChainReactionService();
