import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './HorizontalCardLayout.css';

interface Card {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

const HorizontalCardLayout: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Sample card data
  const cards: Card[] = [
    {
      id: "card-1",
      title: "Parallel Execution",
      description: "Execute multiple actions simultaneously across the blockchain",
      image: "/card-images/parallel-execution.jpg",
      color: "#6366f1" // Indigo
    },
    {
      id: "card-2",
      title: "Chain Reaction",
      description: "Trigger cascading effects that multiply your impact",
      image: "/card-images/chain-reaction.jpg",
      color: "#8b5cf6" // Purple
    },
    {
      id: "card-3",
      title: "Quantum Nexus",
      description: "Connect across dimensions for unique abilities",
      image: "/card-images/quantum-nexus.jpg",
      color: "#ec4899" // Pink
    }
  ];

  // Generate placeholder image URLs
  const getImageUrl = (card: Card) => {
    // Extract color without # for URL
    const colorHex = card.color.replace('#', '');
    return `https://via.placeholder.com/400x300/${colorHex}/ffffff?text=${card.title.replace(' ', '+')}`;
  };

  return (
    <div className="horizontal-card-layout">
      <div className="cards-container">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            className="card-wrapper"
            initial={{ rotateY: 0 }}
            animate={{ 
              rotateY: hoveredCard === card.id ? 180 : 0,
              z: hoveredCard === card.id ? 50 : 0
            }}
            transition={{ 
              duration: 0.7, 
              ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for smooth, elastic feel
            }}
            onHoverStart={() => setHoveredCard(card.id)}
            onHoverEnd={() => setHoveredCard(null)}
            style={{ 
              transformStyle: 'preserve-3d',
              backgroundColor: 'transparent'
            }}
          >
            {/* Front side */}
            <div 
              className="card-side card-front"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${card.color}, rgba(0, 0, 0, 0.8))`,
                transform: 'rotateY(0deg)'
              }}
            >
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="card-hover-hint">
                  <span>Hover to flip</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 15h-5a3 3 0 0 1-3-3V6" />
                    <path d="M18 10V6h-4" />
                    <path d="M7 19h5a3 3 0 0 0 3-3v-6" />
                    <path d="M4 14v4h4" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Back side */}
            <div 
              className="card-side card-back"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div 
                className="card-image" 
                style={{ backgroundImage: `url(${getImageUrl(card)})` }}
              />
              <div className="card-back-content">
                <h3>{card.title}</h3>
                <p>Discover more about {card.title.toLowerCase()} and how it can enhance your gameplay experience.</p>
                <button className="card-button">Learn More</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalCardLayout;
