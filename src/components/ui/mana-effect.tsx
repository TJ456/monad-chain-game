import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManaEffectProps {
  show: boolean;
  amount: number;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const ManaEffect: React.FC<ManaEffectProps> = ({
  show,
  amount,
  position = { x: 0, y: 0 },
  onComplete
}) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  
  useEffect(() => {
    if (show) {
      // Create particles based on mana amount
      const particleCount = Math.min(10, Math.max(3, amount));
      const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 60 - 30, // Random offset
        y: Math.random() * 60 - 30, // Random offset
        size: Math.random() * 6 + 4, // Random size
        delay: Math.random() * 0.3 // Random delay
      }));
      
      setParticles(newParticles);
      
      // Call onComplete after animation
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [show, amount, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div 
        className="absolute pointer-events-none z-50"
        style={{ 
          left: position.x, 
          top: position.y 
        }}
      >
        {/* Mana cost number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: 1, scale: 1.2, y: -20 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8 }}
          className="text-blue-400 font-bold text-lg"
        >
          -{amount}
        </motion.div>
        
        {/* Mana particles */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 0.8, 
              scale: 0, 
              x: 0, 
              y: 0,
              backgroundColor: '#3b82f6' 
            }}
            animate={{ 
              opacity: 0, 
              scale: 1, 
              x: particle.x, 
              y: particle.y,
              backgroundColor: '#60a5fa' 
            }}
            transition={{ 
              duration: 0.8, 
              delay: particle.delay,
              ease: "easeOut" 
            }}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              left: 0,
              top: 0
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default ManaEffect;
