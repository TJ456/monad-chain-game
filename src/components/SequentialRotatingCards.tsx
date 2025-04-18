import React, { useState } from 'react';
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity, CardType } from '@/types/game';
import './SequentialRotatingCards.css';

const SequentialRotatingCards: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Create sample cards
  const cards: GameCardType[] = [
    {
      id: "card-1",
      name: "Quantum Nexus",
      description: "A powerful card that bridges dimensions and amplifies chain reactions",
      image: "/quantum-nexus.png",
      rarity: CardRarity.EPIC,
      type: CardType.ATTACK,
      mana: 4,
      attack: 7,
      defense: 3,
      monadId: "0xFEATURED001",
      specialEffect: {
        description: "Triggers chain reactions across parallel executions",
        effectType: "SPECIAL"
      },
      onChainMetadata: {
        creator: "0xMonadFoundation",
        creationBlock: 1420000,
        evolutionStage: 2,
        battleHistory: [1, 1, 0, 1, 1]
      }
    },
    {
      id: "card-2",
      name: "Parallel Executor",
      description: "Execute multiple actions simultaneously across the blockchain",
      image: "/parallel-executor.png",
      rarity: CardRarity.RARE,
      type: CardType.UTILITY,
      mana: 3,
      attack: 4,
      defense: 5,
      monadId: "0xFEATURED002",
      specialEffect: {
        description: "Allows execution of two additional actions in a single turn",
        effectType: "BUFF"
      },
      onChainMetadata: {
        creator: "0xMonadLabs",
        creationBlock: 1425000,
        evolutionStage: 1,
        battleHistory: [1, 1, 1, 0]
      }
    },
    {
      id: "card-3",
      name: "Monad Shard",
      description: "The essence of Monad's computational power",
      image: "/monad-shard.png",
      rarity: CardRarity.LEGENDARY,
      type: CardType.UTILITY,
      mana: 2,
      attack: 0,
      defense: 5,
      monadId: "0xSHARD001",
      specialEffect: {
        description: "Amplifies the power of adjacent cards by 50%",
        effectType: "BUFF"
      },
      onChainMetadata: {
        creator: "0xMonadCore",
        creationBlock: 1400000,
        evolutionStage: 3,
        battleHistory: []
      }
    }
  ];

  return (
    <div className="sequential-cards-container">
      {cards.map((card, index) => (
        <div 
          key={card.id}
          className={`card-wrapper card-${index + 1} ${hoveredIndex === index ? 'paused' : ''}`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="card-glow"></div>
          <GameCard 
            card={card} 
            className="shadow-lg"
            showDetails={true}
          />
        </div>
      ))}
    </div>
  );
};

export default SequentialRotatingCards;
