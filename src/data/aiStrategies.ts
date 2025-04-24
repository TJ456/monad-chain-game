import { AIBehavior, AIDifficultyTier, Card as GameCardType } from '@/types/game';

// Define AI behaviors for each difficulty tier
export const aiStrategies: Record<AIDifficultyTier, AIBehavior> = {
  [AIDifficultyTier.NOVICE]: {
    name: "Novice AI",
    description: "A beginner-friendly AI that makes simple decisions",
    thinkingTime: 800,
    cardSelectionStrategy: 'random',
    usesCombo: false,
    recognizesPlayerPatterns: false,
    defensiveThreshold: 0.4, // Becomes defensive at 40% health
    aggressiveThreshold: 0.6, // Becomes aggressive at 60% health
    manaEfficiency: 0.6, // Uses 60% of available mana efficiently
    plansTurnsAhead: 1, // Plans 1 turn ahead
    specialMoveFrequency: 0.3, // 30% chance to use special moves
    adaptsToPreviousPlayerMoves: false,
    mistakeChance: 0.25, // 25% chance to make a suboptimal move
    prioritizesLethal: false, // Doesn't recognize lethal opportunities
    usesSynergies: false, // Doesn't use card synergies
    counterplayAbility: 0.2, // Poor ability to counter player strategies
    healingPriority: 0.3 // Low priority for healing when low on health
  },
  [AIDifficultyTier.VETERAN]: {
    name: "Veteran AI",
    description: "An experienced AI that uses value-based decision making",
    thinkingTime: 1200,
    cardSelectionStrategy: 'value',
    usesCombo: true,
    recognizesPlayerPatterns: true,
    defensiveThreshold: 0.45, // Becomes defensive at 45% health
    aggressiveThreshold: 0.65, // Becomes aggressive at 65% health
    manaEfficiency: 0.8, // Uses 80% of available mana efficiently
    plansTurnsAhead: 2, // Plans 2 turns ahead
    specialMoveFrequency: 0.6, // 60% chance to use special moves
    adaptsToPreviousPlayerMoves: true,
    mistakeChance: 0.1, // 10% chance to make a suboptimal move
    prioritizesLethal: true, // Recognizes and prioritizes lethal opportunities
    usesSynergies: true, // Uses card synergies
    counterplayAbility: 0.6, // Good ability to counter player strategies
    healingPriority: 0.6 // Medium priority for healing when low on health
  },
  [AIDifficultyTier.LEGEND]: {
    name: "Legend AI",
    description: "A masterful AI that uses advanced situational strategies",
    thinkingTime: 1500,
    cardSelectionStrategy: 'situational',
    usesCombo: true,
    recognizesPlayerPatterns: true,
    defensiveThreshold: 0.5, // Becomes defensive at 50% health
    aggressiveThreshold: 0.7, // Becomes aggressive at 70% health
    manaEfficiency: 0.95, // Uses 95% of available mana efficiently
    plansTurnsAhead: 3, // Plans 3 turns ahead
    specialMoveFrequency: 0.9, // 90% chance to use special moves
    adaptsToPreviousPlayerMoves: true,
    mistakeChance: 0.02, // Only 2% chance to make a suboptimal move
    prioritizesLethal: true, // Always recognizes and prioritizes lethal opportunities
    usesSynergies: true, // Uses complex card synergies
    counterplayAbility: 0.9, // Excellent ability to counter player strategies
    healingPriority: 0.8 // High priority for healing when low on health
  }
};

// Enhanced AI card selection strategies with unpredictability
export const selectCardNovice = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number
): GameCardType => {
  // Add randomness factor to make AI less predictable
  const randomFactor = Math.random();

  // Occasionally make completely random choices (25% of the time)
  if (randomFactor < 0.25) {
    return playableCards[Math.floor(Math.random() * playableCards.length)];
  }

  // Situational strategy with randomness
  if (opponentHealth < 8) {
    // When low on health, variable chance to pick defense card
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    const defenseChance = 0.5 + (Math.random() * 0.3); // 50-80% chance
    if (defenseCards.length > 0 && Math.random() < defenseChance) {
      return defenseCards[Math.floor(Math.random() * defenseCards.length)];
    }
  }

  if (playerHealth < 5) {
    // When player is low, variable chance to pick attack card
    const attackCards = playableCards.filter(card => card.type === 'attack');
    const attackChance = 0.4 + (Math.random() * 0.3); // 40-70% chance
    if (attackCards.length > 0 && Math.random() < attackChance) {
      return attackCards[Math.floor(Math.random() * attackCards.length)];
    }
  }

  // Sometimes prefer high mana cards, sometimes low mana cards
  if (randomFactor > 0.75) {
    return playableCards.reduce((best, current) =>
      current.mana > best.mana ? current : best, playableCards[0]);
  } else if (randomFactor > 0.5) {
    return playableCards.reduce((best, current) =>
      current.mana < best.mana ? current : best, playableCards[0]);
  }

  // Otherwise pick card with basic weighting but with randomness
  return playableCards.reduce((best, current) => {
    const currentValue = (current.attack || 0) + (current.defense || 0) + (Math.random() * 3); // Add random bonus
    const bestValue = (best.attack || 0) + (best.defense || 0) + (Math.random() * 3); // Add random bonus
    return currentValue > bestValue ? current : best;
  }, playableCards[0]);
};

export const selectCardVeteran = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number,
  opponentMana: number,
  playerLastCards?: GameCardType[]
): GameCardType => {
  // Add unpredictability with random factor
  const randomFactor = Math.random();
  const healthRatio = opponentHealth / 20;

  // Occasionally make suboptimal choices (15% of the time)
  if (randomFactor < 0.15) {
    // Pick a random card but with some bias toward better cards
    return playableCards.sort(() => Math.random() - 0.5)[0];
  }

  // Counter strategy based on player's last cards with randomness
  if (playerLastCards && playerLastCards.length > 0 && Math.random() > 0.3) {
    const lastCard = playerLastCards[0];
    // If player used high attack cards, prioritize defense with some randomness
    if (lastCard.attack && lastCard.attack > 5 && Math.random() > 0.2) {
      const defenseCards = playableCards.filter(card => card.type === 'defense');
      if (defenseCards.length > 0) {
        // Sometimes pick the best defense, sometimes pick a random defense
        if (Math.random() > 0.3) {
          return defenseCards.reduce((best, current) =>
            (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
        } else {
          return defenseCards[Math.floor(Math.random() * defenseCards.length)];
        }
      }
    }

    // If player used defense cards, try to counter with special effects
    if (lastCard.type === 'defense' && Math.random() > 0.4) {
      const specialCards = playableCards.filter(card => card.specialEffect);
      if (specialCards.length > 0) {
        return specialCards[Math.floor(Math.random() * specialCards.length)];
      }
    }
  }

  // Sometimes focus on a specific strategy based on random factor
  if (randomFactor > 0.85) {
    // Aggressive strategy
    const attackCards = playableCards.filter(card => card.type === 'attack');
    if (attackCards.length > 0) {
      return attackCards.reduce((best, current) =>
        (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
    }
  } else if (randomFactor > 0.7) {
    // Defensive strategy
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    if (defenseCards.length > 0) {
      return defenseCards.reduce((best, current) =>
        (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
    }
  } else if (randomFactor > 0.55) {
    // Mana efficiency strategy
    return playableCards.reduce((best, current) =>
      current.mana < best.mana ? current : best, playableCards[0]);
  }

  // Enhanced scoring system with randomness
  return playableCards.reduce((best, current) => {
    let score = 0;

    // Base score from card stats with slight randomness
    score += (current.attack || 0) * (1.2 + Math.random() * 0.3);
    score += (current.defense || 0) * (1.3 + Math.random() * 0.3);

    // Situational bonuses with randomness
    if (healthRatio < 0.4) score += (current.defense || 0) * (1.3 + Math.random() * 0.5);
    if (playerHealth < 8) score += (current.attack || 0) * (1.2 + Math.random() * 0.4);
    if (current.mana <= opponentMana * 0.8) score += 10 + Math.random() * 10; // Variable mana efficiency bonus
    if (current.specialEffect) score += 15 + Math.random() * 10;

    // Compare with best card
    const bestScore = (best.attack || 0) * 1.3 + (best.defense || 0) * 1.4 + (Math.random() * 5);
    return score > bestScore ? current : best;
  }, playableCards[0]);
};

export const selectCardLegend = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number,
  opponentMana: number,
  playerDeck: GameCardType[],
  playerLastCard?: GameCardType
): GameCardType => {
  // Add unpredictability with random factors
  const randomFactor = Math.random();
  const strategyFactor = Math.random();

  // Occasionally make unexpected choices (10% of the time)
  if (randomFactor < 0.1) {
    // Pick a card that might seem suboptimal but could be part of a larger strategy
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex];
  }

  // If lethal damage is possible, go for the win (but with small chance to make a mistake)
  const attackCards = playableCards.filter(card => card.type === 'attack');
  const potentialDamage = attackCards.reduce((total, card) => total + (card.attack || 0), 0);
  if (potentialDamage >= playerHealth && Math.random() > 0.05) {
    // 95% chance to make the optimal play for lethal
    return attackCards.reduce((best, current) =>
      (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
  }

  // Advanced defensive logic when needed, with randomness
  if (opponentHealth <= 10 && Math.random() > 0.2) {
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    const utilityCards = playableCards.filter(card => card.type === 'utility');

    // Consider both defense and utility cards for survival
    const survivalCards = [...defenseCards, ...utilityCards];
    if (survivalCards.length > 0) {
      // Sometimes pick the best survival card, sometimes pick a random one
      if (Math.random() > 0.25) {
        return survivalCards.reduce((best, current) => {
          let currentValue = (current.defense || 0) * 2 + (current.specialEffect ? 15 : 0) + (Math.random() * 5);
          let bestValue = (best.defense || 0) * 2 + (best.specialEffect ? 15 : 0) + (Math.random() * 5);
          return currentValue > bestValue ? current : best;
        }, survivalCards[0]);
      } else {
        return survivalCards[Math.floor(Math.random() * survivalCards.length)];
      }
    }
  }

  // Counter strategy based on player's deck and last card, with randomness
  if (playerLastCard && playerDeck.length > 0 && Math.random() > 0.15) {
    // If player used a high-value card, try to counter it
    if (playerLastCard.attack && playerLastCard.attack > 6) {
      const counterCards = playableCards.filter(card =>
        card.type === 'defense' ||
        (card.specialEffect?.type === 'stun' || card.specialEffect?.type === 'leech')
      );
      if (counterCards.length > 0) {
        // Sometimes pick the best counter, sometimes a random one
        if (Math.random() > 0.3) {
          return counterCards.reduce((best, current) => {
            let score = (current.defense || 0) * 1.5 + (Math.random() * 8);
            if (current.specialEffect) score += 20 + (Math.random() * 10);
            let bestScore = (best.defense || 0) * 1.5 + (best.specialEffect ? 20 : 0) + (Math.random() * 8);
            return score > bestScore ? current : best;
          }, counterCards[0]);
        } else {
          return counterCards[Math.floor(Math.random() * counterCards.length)];
        }
      }
    }

    // If player used defense cards, try to counter with special effects
    if (playerLastCard.type === 'defense' && Math.random() > 0.3) {
      const specialCards = playableCards.filter(card => card.specialEffect);
      if (specialCards.length > 0) {
        return specialCards[Math.floor(Math.random() * specialCards.length)];
      }
    }
  }

  // Sometimes use a specific strategy based on random factor
  if (strategyFactor < 0.2) {
    // Mana efficiency strategy
    return playableCards.reduce((best, current) =>
      (current.mana < best.mana && current.mana >= 2) ? current : best, playableCards[0]);
  } else if (strategyFactor < 0.4) {
    // Special effect strategy
    const specialCards = playableCards.filter(card => card.specialEffect);
    if (specialCards.length > 0) {
      return specialCards[Math.floor(Math.random() * specialCards.length)];
    }
  } else if (strategyFactor < 0.6 && opponentHealth > 15) {
    // Aggressive strategy when healthy
    const attackCards = playableCards.filter(card => card.type === 'attack');
    if (attackCards.length > 0) {
      return attackCards.reduce((best, current) =>
        (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
    }
  }

  // Advanced scoring system with randomness
  return playableCards.reduce((best, current) => {
    let score = 0;

    // Enhanced base scoring with randomness
    score += (current.attack || 0) * (1.3 + Math.random() * 0.3);
    score += (current.defense || 0) * (1.5 + Math.random() * 0.3);
    score += (current.specialEffect ? (25 + Math.random() * 10) : 0);

    // Situational scoring with randomness
    if (playerHealth <= (current.attack || 0)) score += 90 + Math.random() * 20;
    if (opponentHealth < 12) score += (current.defense || 0) * (2.3 + Math.random() * 0.5);
    if (current.mana <= opponentMana * 0.6) score += 20 + Math.random() * 10;
    if (playerDeck.length <= 2) score += (current.attack || 0) * (1.3 + Math.random() * 0.4); // End game pressure

    // Special effect synergy with randomness
    if (current.specialEffect && playerLastCard?.type === 'defense') {
      score += 15 + Math.random() * 10; // Variable bonus for breaking through defense
    }

    // Compare with best card, adding randomness
    let bestScore = (best.attack || 0) * (1.3 + Math.random() * 0.2) +
                   (best.defense || 0) * (1.5 + Math.random() * 0.2);
    bestScore += (best.specialEffect ? (25 + Math.random() * 10) : 0);

    return score > bestScore ? current : best;
  }, playableCards[0]);
};

// Function to enhance AI cards based on difficulty
export const enhanceAICards = (cards: GameCardType[], difficulty: AIDifficultyTier): GameCardType[] => {
  const behavior = aiStrategies[difficulty];

  switch (difficulty) {
    case AIDifficultyTier.NOVICE:
      return cards.map(card => {
        // Novice AI gets slightly weaker cards
        const enhancedCard = {
          ...card,
          attack: card.attack ? Math.max(1, Math.floor(card.attack * 0.85)) : undefined,
          defense: card.defense ? Math.max(1, Math.floor(card.defense * 0.85)) : undefined,
          // Add a small chance for special effects on common cards
          specialEffect: card.specialEffect || (card.rarity === 'common' && Math.random() > 0.9 ? {
            description: "Novice Enhancement",
            effectType: 'BUFF',
            value: 1,
            duration: 1
          } : undefined)
        };

        // Add a unique identifier to track AI cards
        return {
          ...enhancedCard,
          id: `${enhancedCard.id}-ai-novice`,
          aiEnhanced: true,
          aiDifficulty: AIDifficultyTier.NOVICE
        };
      });

    case AIDifficultyTier.VETERAN:
      return cards.map(card => {
        // Veteran AI gets moderately stronger cards
        const enhancedCard = {
          ...card,
          attack: card.attack ? Math.floor(card.attack * 1.15) : undefined, // 15% boost
          defense: card.defense ? Math.floor(card.defense * 1.15) : undefined,
          // Add a moderate chance for special effects
          specialEffect: card.specialEffect || (Math.random() > 0.7 ? {
            description: "Veteran's Enhancement",
            effectType: getRandomEffectType(),
            value: Math.floor(Math.random() * 2) + 1,
            duration: 1
          } : undefined),
          // Add synergy bonuses for certain card types
          synergy: Math.random() > 0.6 ? {
            type: card.type,
            bonus: Math.floor(Math.random() * 2) + 1
          } : undefined
        };

        // Add a unique identifier to track AI cards
        return {
          ...enhancedCard,
          id: `${enhancedCard.id}-ai-veteran`,
          aiEnhanced: true,
          aiDifficulty: AIDifficultyTier.VETERAN
        };
      });

    case AIDifficultyTier.LEGEND:
      return cards.map(card => {
        // Legend AI gets significantly stronger cards
        const enhancedCard = {
          ...card,
          attack: card.attack ? Math.floor(card.attack * 1.3) : undefined, // 30% boost
          defense: card.defense ? Math.floor(card.defense * 1.3) : undefined,
          // Add a high chance for powerful special effects
          specialEffect: card.specialEffect || (Math.random() > 0.5 ? {
            description: getLegendarySpecialEffect(card),
            effectType: getRandomEffectType(),
            value: Math.floor(Math.random() * 3) + 2,
            duration: Math.floor(Math.random() * 2) + 1
          } : undefined),
          // Add synergy bonuses for all cards
          synergy: {
            type: card.type,
            bonus: Math.floor(Math.random() * 3) + 2
          },
          // Add combo potential
          comboPotential: Math.random() > 0.7 ? {
            description: "Triggers a powerful combo effect when played after a matching card",
            multiplier: 1.5 + (Math.random() * 0.5)
          } : undefined
        };

        // Add a unique identifier to track AI cards
        return {
          ...enhancedCard,
          id: `${enhancedCard.id}-ai-legend`,
          aiEnhanced: true,
          aiDifficulty: AIDifficultyTier.LEGEND
        };
      });

    default:
      return cards;
  }
};

// Helper function to get a random effect type
const getRandomEffectType = (): 'BUFF' | 'DEBUFF' | 'SHIELD' | 'DRAIN' | 'STUN' | 'LEECH' => {
  const effects = ['BUFF', 'DEBUFF', 'SHIELD', 'DRAIN', 'STUN', 'LEECH'];
  return effects[Math.floor(Math.random() * effects.length)] as any;
};

// Helper function to get legendary special effects
const getLegendarySpecialEffect = (_card: GameCardType): string => {
  // We can use the card properties to determine appropriate effects in the future
  const effects = [
    "Enhances all subsequent attacks",
    "Reduces opponent's next attack",
    "Grants temporary invulnerability",
    "Drains opponent's mana",
    "Has a chance to stun",
    "Heals based on damage dealt",
    "Summons a temporary minion",
    "Creates a damage shield",
    "Boosts MONAD efficiency",
    "Enables parallel execution"
  ];
  return effects[Math.floor(Math.random() * effects.length)];
};

// Enhanced AI thinking messages
export const getAIThinkingMessage = (difficulty: AIDifficultyTier): string => {
  const messages = {
    [AIDifficultyTier.NOVICE]: [
      "The novice opponent studies their cards carefully...",
      "The novice opponent contemplates their next move...",
      "The novice opponent weighs their options..."
    ],
    [AIDifficultyTier.VETERAN]: [
      "The veteran opponent calculates possible outcomes...",
      "The veteran opponent formulates a counter-strategy...",
      "The veteran opponent analyzes the battlefield..."
    ],
    [AIDifficultyTier.LEGEND]: [
      "The legendary opponent executes complex battle algorithms...",
      "The legendary opponent predicts multiple future moves...",
      "The legendary opponent orchestrates an intricate strategy...",
      "The legendary opponent adapts their tactics to your playstyle..."
    ]
  };

  const difficultyMessages = messages[difficulty];
  return difficultyMessages[Math.floor(Math.random() * difficultyMessages.length)];
};
