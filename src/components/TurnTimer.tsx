import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Clock } from 'lucide-react';

interface TurnTimerProps {
  isActive: boolean;
  duration: number; // in seconds
  onTimeExpired: () => void;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ 
  isActive, 
  duration, 
  onTimeExpired 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Reset timer when it becomes active
    if (isActive) {
      setTimeLeft(duration);
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  }, [isActive, duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            onTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused, timeLeft, onTimeExpired]);

  // Calculate percentage for progress bar
  const progressPercentage = (timeLeft / duration) * 100;
  
  // Determine color based on time left
  const getColorClass = () => {
    if (timeLeft > duration * 0.6) return "bg-emerald-500";
    if (timeLeft > duration * 0.3) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
      <div className="flex-1">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-700"
          indicatorClassName={getColorClass()}
        />
      </div>
      <div className={`text-sm font-mono ${
        timeLeft <= 10 ? 'text-red-500 font-bold' : 'text-gray-400'
      }`}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default TurnTimer;
