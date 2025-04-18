import React, { useState } from 'react';
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity, CardType } from '@/types/game';
import './animations.css';

interface RotatingCard3DProps {
  className?: string;
}

const RotatingCard3D: React.FC<RotatingCard3DProps> = ({ className }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Create a sample featured card (front side)
  const featuredCard: GameCardType = {
    id: "featured-card",
    name: "Quantum Nexus",
    description: "A powerful card that bridges dimensions and amplifies chain reactions",
    image: "/quantum-nexus.png", // This will use the placeholder generator if not found
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
      battleHistory: [1, 1, 0, 1, 1] // 4 wins, 1 loss
    }
  };

  // Create a back side card
  const backSideCard: GameCardType = {
    id: "featured-card-back",
    name: "Monad Shard",
    description: "The essence of Monad's computational power, used to enhance card abilities",
    image: "/monad-shard.png", // This will use the placeholder generator if not found
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
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: '320px', height: '450px' }}
    >
      {/* Glow effect background */}
      <div
        className={`absolute inset-0 rounded-lg transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(20px)',
          transform: 'translateZ(-10px)',
          animation: isHovered ? 'card-glow 3s infinite' : 'none'
        }}
      />

      {/* Rotating card container */}
      <div
        className={`transform-gpu ${isHovered ? '' : 'card-rotate-3d'}`}
        style={{
          transition: 'transform 0.5s ease-out',
          transform: isHovered ? 'perspective(1000px) rotateY(0deg) scale(1.05)' : 'perspective(1000px) rotateY(0deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Front side */}
        <div
          style={{
            position: 'absolute',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <GameCard
            card={featuredCard}
            className="shadow-lg"
            showDetails={true}
          />
        </div>

        {/* Back side */}
        <div
          style={{
            position: 'absolute',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <GameCard
            card={backSideCard}
            className="shadow-lg"
            showDetails={true}
          />
        </div>
      </div>

      {/* Floating particles */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-indigo-500/30"
              style={{
                width: `${Math.random() * 8 + 2}px`,
                height: `${Math.random() * 8 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random() * 0.5 + 0.3
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RotatingCard3D;
