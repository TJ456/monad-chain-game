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
    defensiveThreshold: 0.3, // 30% health
    aggressiveThreshold: 0.7, // 70% health
    manaEfficiency: 0.5,
    plansTurnsAhead: 0,
    specialMoveFrequency: 0.2,
    adaptsToPreviousPlayerMoves: false
  },
  [AIDifficultyTier.VETERAN]: {
    name: "Veteran AI",
    description: "An experienced AI that uses value-based decision making",
    thinkingTime: 1200,
    cardSelectionStrategy: 'value',
    usesCombo: true,
    recognizesPlayerPatterns: false,
    defensiveThreshold: 0.4, // 40% health
    aggressiveThreshold: 0.6, // 60% health
    manaEfficiency: 0.7,
    plansTurnsAhead: 1,
    specialMoveFrequency: 0.5,
    adaptsToPreviousPlayerMoves: true
  },
  [AIDifficultyTier.LEGEND]: {
    name: "Legend AI",
    description: "A masterful AI that uses advanced situational strategies",
    thinkingTime: 1500,
    cardSelectionStrategy: 'situational',
    usesCombo: true,
    recognizesPlayerPatterns: true,
    defensiveThreshold: 0.5, // 50% health
    aggressiveThreshold: 0.7, // 70% health
    manaEfficiency: 0.9,
    plansTurnsAhead: 2,
    specialMoveFrequency: 0.8,
    adaptsToPreviousPlayerMoves: true
  }
};

// AI card selection strategies
export const selectCardNovice = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number
): GameCardType => {
  // Novice AI just picks a random card
  return playableCards[Math.floor(Math.random() * playableCards.length)];
};

export const selectCardVeteran = (
  playableCards: GameCardType[],
  playerHealth: number,
  opponentHealth: number,
  opponentMana: number
): GameCardType => {
  // Veteran AI uses a value-based approach
  const healthRatio = opponentHealth / 30; // Assuming max health is 30
  
  // If low health, prioritize defense
  if (healthRatio < 0.4) {
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    if (defenseCards.length > 0) {
      // Find the defense card with the highest value
      return defenseCards.reduce((best, current) => 
        (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
    }
  }
  
  // If opponent is low on health, prioritize attack
  if (playerHealth < 8) {
    const attackCards = playableCards.filter(card => card.type === 'attack');
    if (attackCards.length > 0) {
      // Find the attack card with the highest value
      return attackCards.reduce((best, current) => 
        (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
    }
  }
  
  // Otherwise, pick the card with the best overall value
  return playableCards.reduce((best, current) => {
    const currentValue = (current.attack || 0) + (current.defense || 0) * 1.2;
    const bestValue = (best.attack || 0) + (best.defense || 0) * 1.2;
    return currentValue > bestValue ? current : best;
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
  // Legend AI uses situational strategy
  
  // If player can be defeated this turn, go for the kill
  const attackCards = playableCards.filter(card => card.type === 'attack');
  const canKill = attackCards.some(card => (card.attack || 0) >= playerHealth);
  
  if (canKill) {
    return attackCards.find(card => (card.attack || 0) >= playerHealth) || attackCards[0];
  }
  
  // If AI is low on health, prioritize healing
  if (opponentHealth < 10) {
    const defenseCards = playableCards.filter(card => card.type === 'defense');
    if (defenseCards.length > 0) {
      return defenseCards.reduce((best, current) => 
        (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
    }
  }
  
  // Counter strategy based on player's last card
  if (playerLastCard) {
    // If player used a high attack card, play defense
    if (playerLastCard.attack && playerLastCard.attack > 5) {
      const defenseCards = playableCards.filter(card => card.type === 'defense');
      if (defenseCards.length > 0) {
        return defenseCards.reduce((best, current) => 
          (current.defense || 0) > (best.defense || 0) ? current : best, defenseCards[0]);
      }
    }
    
    // If player used a defense card, use a high attack card
    if (playerLastCard.type === 'defense') {
      const attackCards = playableCards.filter(card => card.type === 'attack');
      if (attackCards.length > 0) {
        return attackCards.reduce((best, current) => 
          (current.attack || 0) > (best.attack || 0) ? current : best, attackCards[0]);
      }
    }
  }
  
  // Advanced scoring system
  return playableCards.reduce((best, current) => {
    let score = 0;
    
    // Base score from card stats
    score += (current.attack || 0) * 1.2;
    score += (current.defense || 0) * 1.5;
    
    // Situational bonuses
    if (playerHealth <= (current.attack || 0)) score += 100; // Can kill player
    if (opponentHealth < 8) score += (current.defense || 0) * 2; // Low health bonus for defense
    if (current.mana <= opponentMana * 0.7) score += 10; // Mana efficiency bonus
    
    // Special effect bonus
    if (current.specialEffect) score += 15;
    
    // Compare with best card so far
    let bestScore = (best.attack || 0) * 1.2 + (best.defense || 0) * 1.5;
    if (playerHealth <= (best.attack || 0)) bestScore += 100;
    if (opponentHealth < 8) bestScore += (best.defense || 0) * 2;
    if (best.mana <= opponentMana * 0.7) bestScore += 10;
    if (best.specialEffect) bestScore += 15;
    
    return score > bestScore ? current : best;
  }, playableCards[0]);
};

// Helper function to get AI thinking message based on difficulty
export const getAIThinkingMessage = (difficulty: AIDifficultyTier): string => {
  const messages = {
    [AIDifficultyTier.NOVICE]: [
      "The novice opponent considers their move...",
      "The novice opponent looks at their cards...",
      "The novice opponent thinks about what to play..."
    ],
    [AIDifficultyTier.VETERAN]: [
      "The veteran opponent calculates their strategy...",
      "The veteran opponent analyzes the battlefield...",
      "The veteran opponent weighs their options carefully..."
    ],
    [AIDifficultyTier.LEGEND]: [
      "The legendary opponent unleashes advanced battle algorithms...",
      "The legendary opponent predicts your next move...",
      "The legendary opponent executes a complex strategy..."
    ]
  };
  
  const difficultyMessages = messages[difficulty];
  return difficultyMessages[Math.floor(Math.random() * difficultyMessages.length)];
};

// Function to enhance AI cards based on difficulty
export const enhanceAICards = (cards: GameCardType[], difficulty: AIDifficultyTier): GameCardType[] => {
  switch (difficulty) {
    case AIDifficultyTier.NOVICE:
      return cards.map(card => ({
        ...card,
        attack: card.attack ? Math.max(1, Math.floor(card.attack * 0.8)) : undefined,
        defense: card.defense ? Math.max(1, Math.floor(card.defense * 0.8)) : undefined
      }));
      
    case AIDifficultyTier.VETERAN:
      return cards.map(card => ({
        ...card,
        // Veteran cards are at normal strength
      }));
      
    case AIDifficultyTier.LEGEND:
      return cards.map(card => ({
        ...card,
        attack: card.attack ? Math.floor(card.attack * 1.2) : undefined,
        defense: card.defense ? Math.floor(card.defense * 1.2) : undefined,
        // Add special effects to some cards for Legend difficulty
        specialEffect: card.specialEffect || (Math.random() > 0.7 ? {
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
const getRandomEffectType = (): 'BUFF' | 'DEBUFF' | 'SHIELD' | 'DRAIN' => {
  const effects: ('BUFF' | 'DEBUFF' | 'SHIELD' | 'DRAIN')[] = ['BUFF', 'DEBUFF', 'SHIELD', 'DRAIN'];
  return effects[Math.floor(Math.random() * effects.length)];
};

// Helper function to generate legendary special effect description
const getLegendarySpecialEffect = (card: GameCardType): string => {
  if (card.type === 'attack') {
    return `Inflicts ${Math.floor(Math.random() * 3) + 2} bonus damage`;
  } else if (card.type === 'defense') {
    return `Provides a shield that absorbs ${Math.floor(Math.random() * 3) + 2} damage`;
  } else {
    return `Grants a special blockchain advantage`;
  }
};
