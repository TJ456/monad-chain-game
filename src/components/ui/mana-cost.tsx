import React from 'react';
import { cn } from "@/lib/utils";

interface ManaCostProps {
  cost: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAnimation?: boolean;
  isAffordable?: boolean;
  variant?: 'default' | 'crystal' | 'tech' | 'minimal';
  cardRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const ManaCost: React.FC<ManaCostProps> = ({
  cost,
  size = 'md',
  className,
  showAnimation = false,
  isAffordable = true,
  variant = 'default',
  cardRarity = 'common'
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Rarity-based colors
  const rarityColors = {
    common: {
      from: 'from-blue-500',
      to: 'to-blue-600',
      glow: 'bg-blue-500/30',
      border: 'border-blue-400/50',
      symbol: 'bg-blue-300'
    },
    rare: {
      from: 'from-cyan-500',
      to: 'to-blue-600',
      glow: 'bg-cyan-500/30',
      border: 'border-cyan-400/50',
      symbol: 'bg-cyan-300'
    },
    epic: {
      from: 'from-purple-500',
      to: 'to-fuchsia-600',
      glow: 'bg-purple-500/30',
      border: 'border-purple-400/50',
      symbol: 'bg-purple-300'
    },
    legendary: {
      from: 'from-amber-500',
      to: 'to-orange-600',
      glow: 'bg-amber-500/30',
      border: 'border-amber-400/50',
      symbol: 'bg-amber-300'
    }
  };

  // Variant styles
  const variantStyles = {
    default: {
      base: 'rounded-full',
      bg: `bg-gradient-to-br ${rarityColors[cardRarity].from} ${rarityColors[cardRarity].to}`,
      text: 'text-white',
      border: ''
    },
    crystal: {
      base: 'rounded-lg rotate-45',
      bg: `bg-gradient-to-br ${rarityColors[cardRarity].from} ${rarityColors[cardRarity].to}`,
      text: 'text-white -rotate-45',
      border: `border-2 ${rarityColors[cardRarity].border}`
    },
    tech: {
      base: 'rounded-md',
      bg: 'bg-black/80 backdrop-blur-sm',
      text: `text-${cardRarity === 'legendary' ? 'amber' : cardRarity === 'epic' ? 'fuchsia' : cardRarity === 'rare' ? 'cyan' : 'blue'}-400 font-mono`,
      border: `border ${rarityColors[cardRarity].border}`
    },
    minimal: {
      base: 'rounded-full',
      bg: 'bg-black/70 backdrop-blur-sm',
      text: `text-${cardRarity === 'legendary' ? 'amber' : cardRarity === 'epic' ? 'fuchsia' : cardRarity === 'rare' ? 'cyan' : 'blue'}-400`,
      border: `border ${rarityColors[cardRarity].border}`
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold relative",
        sizeClasses[size],
        variantStyles[variant].base,
        variantStyles[variant].bg,
        variantStyles[variant].text,
        variantStyles[variant].border,
        isAffordable
          ? ""
          : "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300 border-gray-500/30",
        showAnimation && isAffordable && "animate-pulse-slow",
        className
      )}
    >
      {/* Glow effect for affordable cards */}
      {isAffordable && variant !== 'minimal' && (
        <div className={cn(
          "absolute inset-0 blur-sm -z-10",
          variantStyles[variant].base,
          rarityColors[cardRarity].glow
        )}></div>
      )}

      {/* Mana cost number */}
      <span className={variant === 'crystal' ? '-rotate-45' : ''}>{cost}</span>

      {/* Mana symbol - different for each variant */}
      {variant === 'default' && (
        <div className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-70",
          isAffordable ? rarityColors[cardRarity].symbol : 'bg-gray-400'
        )}></div>
      )}

      {variant === 'tech' && (
        <div className="absolute -top-1 -right-1 text-[8px] opacity-80">
          ⚡
        </div>
      )}

      {variant === 'crystal' && (
        <div className={cn(
          "absolute top-0 left-0 w-2 h-2 rounded-full opacity-70 -translate-x-1/2 -translate-y-1/2",
          isAffordable ? rarityColors[cardRarity].symbol : 'bg-gray-400'
        )}></div>
      )}
    </div>
  );
};

export default ManaCost;
