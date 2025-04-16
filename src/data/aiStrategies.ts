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
    defensiveThreshold: 0.4, // Increased from 0.3 for better survivability
    aggressiveThreshold: 0.6, // Lowered from 0.7 for more balanced gameplay
    manaEfficiency: 0.6, // Improved from 0.5 for slightly better mana usage
    plansTurnsAhead: 1, // Now plans 1 turn ahead instead of 0
    specialMoveFrequency: 0.3, // Increased from 0.2 for more interesting gameplay
    adaptsToPreviousPlayerMoves: false
  },
  [AIDifficultyTier.VETERAN]: {
    name: "Veteran AI",
    description: "An experienced AI that uses value-based decision making",
    thinkingTime: 1200,
    cardSelectionStrategy: 'value',
    usesCombo: true,
    recognizesPlayerPatterns: true, // Now recognizes patterns
    defensiveThreshold: 0.45,
    aggressiveThreshold: 0.65,
    manaEfficiency: 0.8, // Improved from 0.7
    plansTurnsAhead: 2, // Increased from 1
    specialMoveFrequency: 0.6,
    adaptsToPreviousPlayerMoves: true
  },
  [AIDifficultyTier.LEGEND]: {
    name: "Legend AI",
    description: "A masterful AI that uses advanced situational strategies",
    thinkingTime: 1500,
    cardSelectionStrategy: 'situational',
    usesCombo: true,
    recognizesPlayerPatterns: true,
    defensiveThreshold: 0.5,
    aggressiveThreshold: 0.7,
    manaEfficiency: 0.95, // Improved from 0.9
    plansTurnsAhead: 3, // Increased from 2
    specialMoveFrequency: 0.9, // Increased from 0.8
    adaptsToPreviousPlayerMoves: true
  }
};

// Enhanced AI card selection strategies
export const selectCardNovice = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number
): GameCardType => {
  // Novice AI now uses basic strategy instead of pure random
  if (opponentHealth < 8) {
    // When low on health, 70% chance to pick defense card if available
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    if (defenseCards.length > 0 && Math.random() < 0.7) {
      return defenseCards[Math.floor(Math.random() * defenseCards.length)];
    }
  }
  
  if (playerHealth < 5) {
    // When player is low, 60% chance to pick attack card if available
    const attackCards = playableCards.filter(card => card.type === 'attack');
    if (attackCards.length > 0 && Math.random() < 0.6) {
      return attackCards[Math.floor(Math.random() * attackCards.length)];
    }
  }
  
  // Otherwise pick random card with basic weighting
  return playableCards.reduce((best, current) => {
    const currentValue = (current.attack || 0) + (current.defense || 0);
    const bestValue = (best.attack || 0) + (best.defense || 0);
    return Math.random() < 0.7 ? (currentValue > bestValue ? current : best) : current;
  }, playableCards[0]);
};

export const selectCardVeteran = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number,
  opponentMana: number,
  playerLastCards?: GameCardType[]
): GameCardType => {
  // Enhanced veteran AI with pattern recognition
  const healthRatio = opponentHealth / 20;
  
  // Counter strategy based on player's last cards
  if (playerLastCards && playerLastCards.length > 0) {
    const lastCard = playerLastCards[0];
    // If player used high attack cards consecutively, prioritize defense
    if (lastCard.attack && lastCard.attack > 5) {
      const defenseCards = playableCards.filter(card => card.type === 'defense');
      if (defenseCards.length > 0) {
        return defenseCards.reduce((best, current) => 
          (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
      }
    }
  }
  
  // Enhanced scoring system
  return playableCards.reduce((best, current) => {
    let score = 0;
    
    // Base score from card stats
    score += (current.attack || 0) * 1.3;
    score += (current.defense || 0) * 1.4;
    
    // Situational bonuses
    if (healthRatio < 0.4) score += (current.defense || 0) * 1.5;
    if (playerHealth < 8) score += (current.attack || 0) * 1.3;
    if (current.mana <= opponentMana * 0.8) score += 15; // Mana efficiency bonus
    if (current.specialEffect) score += 20;
    
    // Compare with best card
    const bestScore = (best.attack || 0) * 1.3 + (best.defense || 0) * 1.4;
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
  // Enhanced Legend AI with advanced situational strategy
  
  // If lethal damage is possible, go for the win
  const attackCards = playableCards.filter(card => card.type === 'attack');
  const potentialDamage = attackCards.reduce((total, card) => total + (card.attack || 0), 0);
  if (potentialDamage >= playerHealth) {
    return attackCards.reduce((best, current) => 
      (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
  }
  
  // Advanced defensive logic when needed
  if (opponentHealth <= 10) {
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    const utilityCards = playableCards.filter(card => card.type === 'utility');
    
    // Consider both defense and utility cards for survival
    const survivalCards = [...defenseCards, ...utilityCards];
    if (survivalCards.length > 0) {
      return survivalCards.reduce((best, current) => {
        let currentValue = (current.defense || 0) * 2 + (current.specialEffect ? 15 : 0);
        let bestValue = (best.defense || 0) * 2 + (best.specialEffect ? 15 : 0);
        return currentValue > bestValue ? current : best;
      }, survivalCards[0]);
    }
  }
  
  // Counter strategy based on player's deck and last card
  if (playerLastCard && playerDeck.length > 0) {
    // If player used a high-value card, try to counter it
    if (playerLastCard.attack && playerLastCard.attack > 6) {
      const counterCards = playableCards.filter(card => 
        card.type === 'defense' || 
        (card.specialEffect?.type === 'stun' || card.specialEffect?.type === 'leech')
      );
      if (counterCards.length > 0) {
        return counterCards.reduce((best, current) => {
          let score = (current.defense || 0) * 1.5;
          if (current.specialEffect) score += 25;
          let bestScore = (best.defense || 0) * 1.5 + (best.specialEffect ? 25 : 0);
          return score > bestScore ? current : best;
        }, counterCards[0]);
      }
    }
  }
  
  // Advanced scoring system
  return playableCards.reduce((best, current) => {
    let score = 0;
    
    // Enhanced base scoring
    score += (current.attack || 0) * 1.4;
    score += (current.defense || 0) * 1.6;
    score += (current.specialEffect ? 30 : 0);
    
    // Situational scoring
    if (playerHealth <= (current.attack || 0)) score += 100;
    if (opponentHealth < 12) score += (current.defense || 0) * 2.5;
    if (current.mana <= opponentMana * 0.6) score += 25;
    if (playerDeck.length <= 2) score += (current.attack || 0) * 1.5; // End game pressure
    
    // Special effect synergy
    if (current.specialEffect && playerLastCard?.type === 'defense') {
      score += 20; // Bonus for breaking through defense
    }
    
    // Compare with best card
    let bestScore = (best.attack || 0) * 1.4 + (best.defense || 0) * 1.6;
    bestScore += (best.specialEffect ? 30 : 0);
    
    return score > bestScore ? current : best;
  }, playableCards[0]);
};

// Function to enhance AI cards based on difficulty
export const enhanceAICards = (cards: GameCardType[], difficulty: AIDifficultyTier): GameCardType[] => {
  switch (difficulty) {
    case AIDifficultyTier.NOVICE:
      return cards.map(card => ({
        ...card,
        attack: card.attack ? Math.max(1, Math.floor(card.attack * 0.85)) : undefined, // Slightly stronger than before
        defense: card.defense ? Math.max(1, Math.floor(card.defense * 0.85)) : undefined
      }));
      
    case AIDifficultyTier.VETERAN:
      return cards.map(card => ({
        ...card,
        attack: card.attack ? Math.floor(card.attack * 1.1) : undefined, // 10% boost
        defense: card.defense ? Math.floor(card.defense * 1.1) : undefined,
        specialEffect: card.specialEffect || (Math.random() > 0.8 ? {
          description: "Veteran's Enhancement",
          effectType: 'BUFF',
          value: Math.floor(Math.random() * 2) + 1,
          duration: 1
        } : undefined)
      }));
      
    case AIDifficultyTier.LEGEND:
      return cards.map(card => ({
        ...card,
        attack: card.attack ? Math.floor(card.attack * 1.25) : undefined, // 25% boost
        defense: card.defense ? Math.floor(card.defense * 1.25) : undefined,
        specialEffect: card.specialEffect || (Math.random() > 0.6 ? {
          description: getLegendarySpecialEffect(card),
          effectType: getRandomEffectType(),
          value: Math.floor(Math.random() * 3) + 2,
          duration: Math.floor(Math.random() * 2) + 1
        } : undefined)
      }));
      
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
const getLegendarySpecialEffect = (card: GameCardType): string => {
  const effects = [
    "Enhances all subsequent attacks",
    "Reduces opponent's next attack",
    "Grants temporary invulnerability",
    "Drains opponent's mana",
    "Has a chance to stun",
    "Heals based on damage dealt"
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
