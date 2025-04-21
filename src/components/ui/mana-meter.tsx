import React from 'react';
import { cn } from "@/lib/utils";

interface ManaMeterProps {
  currentMana: number;
  maxMana: number;
  className?: string;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'tech' | 'crystal';
  playerType?: 'player' | 'opponent';
}

const ManaMeter: React.FC<ManaMeterProps> = ({
  currentMana,
  maxMana,
  className,
  showAnimation = true,
  size = 'md',
  orientation = 'horizontal',
  variant = 'default',
  playerType = 'player'
}) => {
  // Calculate percentage of mana
  const percentage = Math.min(100, Math.max(0, (currentMana / maxMana) * 100));

  // Size classes
  const sizeClasses = {
    sm: orientation === 'horizontal' ? 'h-2' : 'w-2',
    md: orientation === 'horizontal' ? 'h-3' : 'w-3',
    lg: orientation === 'horizontal' ? 'h-4' : 'w-4'
  };

  // Text size classes
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Player-specific colors
  const playerColors = {
    player: {
      icon: 'bg-blue-500',
      text: 'text-blue-400',
      barFrom: 'from-blue-600',
      barTo: 'to-cyan-500',
      crystal: 'bg-blue-500 shadow-blue-500/50'
    },
    opponent: {
      icon: 'bg-purple-500',
      text: 'text-purple-400',
      barFrom: 'from-purple-600',
      barTo: 'to-pink-500',
      crystal: 'bg-purple-500 shadow-purple-500/50'
    }
  };

  // Variant-specific styles
  const variantStyles = {
    default: {
      container: '',
      meter: 'bg-slate-800/80 rounded-full',
      bar: `bg-gradient-to-r ${playerColors[playerType].barFrom} ${playerColors[playerType].barTo} rounded-full`,
      crystalContainer: 'flex justify-between w-full mt-1 px-0.5',
      crystal: 'w-2 h-2 rounded-full'
    },
    tech: {
      container: 'backdrop-blur-sm',
      meter: 'bg-black/50 rounded-md border border-slate-700/50',
      bar: `bg-gradient-to-r ${playerColors[playerType].barFrom} ${playerColors[playerType].barTo} rounded-sm`,
      crystalContainer: 'grid grid-cols-10 gap-1 w-full mt-1',
      crystal: 'w-2 h-2 rounded-sm'
    },
    crystal: {
      container: '',
      meter: 'bg-slate-800/60 rounded-lg backdrop-blur-sm border border-slate-600/30',
      bar: `bg-gradient-to-r ${playerColors[playerType].barFrom} ${playerColors[playerType].barTo} rounded-md`,
      crystalContainer: 'flex justify-between w-full mt-1 px-0.5',
      crystal: 'w-2 h-2 rotate-45'
    }
  };

  return (
    <div className={cn("flex items-center", orientation === 'vertical' && "flex-col", variantStyles[variant].container, className)}>
      <div className="flex items-center space-x-2 mb-1">
        {variant === 'tech' ? (
          <div className={cn("w-4 h-4 flex items-center justify-center", playerColors[playerType].text)}>
            ⚡
          </div>
        ) : (
          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", playerColors[playerType].icon)}>
            <span className="text-[10px] text-white font-bold">M</span>
          </div>
        )}
        <span className={cn("font-medium", playerColors[playerType].text, textSizeClasses[size])}>
          {currentMana}/{maxMana} Mana
        </span>
      </div>

      <div className={cn(
        "w-full overflow-hidden relative",
        variantStyles[variant].meter,
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-300",
            variantStyles[variant].bar,
            showAnimation && "animate-pulse-subtle"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Mana crystal indicators */}
      <div className={cn(variantStyles[variant].crystalContainer)}>
        {Array.from({ length: maxMana }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "transition-all duration-300",
              variantStyles[variant].crystal,
              i < currentMana
                ? cn(playerColors[playerType].crystal, "shadow-sm")
                : "bg-slate-700"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ManaMeter;
