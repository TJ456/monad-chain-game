import React from 'react';
import GameCard from './GameCard';
import { Card as GameCardType, CardRarity, CardType } from '@/types/game';

const CardShowcase: React.FC = () => {
  // Sample cards of different rarities
  const cards: GameCardType[] = [
    {
      id: "card-common",
      name: "Data Fragment",
      description: "A basic computational unit in the Monad ecosystem",
      image: "/data-fragment.png",
      rarity: CardRarity.COMMON,
      type: CardType.UTILITY,
      mana: 1,
      attack: 0,
      defense: 2,
      monadId: "0xCOMMON001",
      onChainMetadata: {
        creator: "0xMonadFoundation",
        creationBlock: 1420000,
        evolutionStage: 1,
        battleHistory: [1, 0, 1]
      }
    },
    {
      id: "card-rare",
      name: "Quantum Relay",
      description: "Transfers data across parallel execution paths",
      image: "/quantum-relay.png",
      rarity: CardRarity.RARE,
      type: CardType.DEFENSE,
      mana: 3,
      attack: 0,
      defense: 5,
      monadId: "0xRARE001",
      onChainMetadata: {
        creator: "0xMonadFoundation",
        creationBlock: 1420100,
        evolutionStage: 1,
        battleHistory: [1, 1, 0, 1]
      }
    },
    {
      id: "card-epic",
      name: "Neural Disruptor",
      description: "Disrupts opponent's computational resources",
      image: "/neural-disruptor.png",
      rarity: CardRarity.EPIC,
      type: CardType.ATTACK,
      mana: 5,
      attack: 7,
      defense: 0,
      monadId: "0xEPIC001",
      onChainMetadata: {
        creator: "0xMonadFoundation",
        creationBlock: 1420200,
        evolutionStage: 2,
        battleHistory: [1, 1, 1, 0, 1]
      }
    },
    {
      id: "card-legendary",
      name: "Monad Nexus",
      description: "The central hub of the Monad network, amplifies all connected cards",
      image: "/monad-nexus.png",
      rarity: CardRarity.LEGENDARY,
      type: CardType.UTILITY,
      mana: 8,
      attack: 5,
      defense: 8,
      monadId: "0xLEGENDARY001",
      boosted: true,
      originalAttack: 3,
      originalDefense: 6,
      onChainMetadata: {
        creator: "0xMonadFoundation",
        creationBlock: 1420300,
        evolutionStage: 3,
        battleHistory: [1, 1, 1, 1, 1]
      }
    }
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Card Showcase - New Design</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {cards.map(card => (
          <div key={card.id} className="mb-8">
            <GameCard card={card} />
            <p className="text-center mt-2 text-sm text-gray-400">
              {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardShowcase;
