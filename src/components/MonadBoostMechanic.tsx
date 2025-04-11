
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MonadBoostMechanicProps {
  playerMonad: number;
  onBoost?: (amount: number, boostEffect: number, duration: number) => void;
}

const MonadBoostMechanic: React.FC<MonadBoostMechanicProps> = ({ 
  playerMonad = 1000,
  onBoost = () => {} 
}) => {
  const [boostAmount, setBoostAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBoost, setActiveBoost] = useState<{
    amount: number;
    effect: number;
    duration: number;
    timeLeft: number;
  } | null>(null);
  
  // Calculate boost effect
  const calculateBoostEffect = (amount: number) => {
    // Non-linear scaling for more strategic decisions
    if (amount < 10) return amount * 2; // 200% return for small amounts
    if (amount < 50) return Math.round(amount * 1.8); // 180% return for medium amounts
    return Math.round(amount * 1.5); // 150% return for large amounts (prevents pay-to-win)
  };
  
  // Calculate boost duration
  const calculateBoostDuration = (amount: number) => {
    // Base duration plus scaling
    return Math.min(5, Math.max(3, Math.floor(amount / 10) + 3)); // 3-5 turns
  };
  
  const boostEffect = calculateBoostEffect(boostAmount);
  const boostDuration = calculateBoostDuration(boostAmount);
  
  const handleBoost = () => {
    if (boostAmount > playerMonad) {
      toast.error("Insufficient MONAD tokens");
      return;
    }
    
    setIsProcessing(true);
    
    toast.loading("Staking MONAD tokens for power boost...", {
      id: "boost-tx"
    });
    
    // Simulate transaction processing
    setTimeout(() => {
      const effect = calculateBoostEffect(boostAmount);
      const duration = calculateBoostDuration(boostAmount);
      
      // Set active boost
      setActiveBoost({
        amount: boostAmount,
        effect,
        duration,
        timeLeft: duration
      });
      
      toast.success("Boost activated!", {
        id: "boost-tx",
        description: `+${effect}% power to all cards for ${duration} turns`
      });
      
      // Call parent component callback
      onBoost(boostAmount, effect, duration);
      
      setIsProcessing(false);
    }, 1000);
  };
  
  // Count down boost timer
  useEffect(() => {
    if (!activeBoost) return;
    
    const timer = setTimeout(() => {
      if (activeBoost.timeLeft > 1) {
        setActiveBoost({
          ...activeBoost,
          timeLeft: activeBoost.timeLeft - 1
        });
      } else {
        toast.info("Boost effect expired", {
          description: "Your cards have returned to normal power"
        });
        setActiveBoost(null);
      }
    }, 5000); // Simulate turn-based gameplay with 5-second intervals
    
    return () => clearTimeout(timer);
  }, [activeBoost]);
  
  return (
    <Card className="glassmorphism border-indigo-500/30 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-md font-bold text-white">MONAD Boost</h3>
          <p className="text-xs text-gray-400">Stake tokens to amplify card power</p>
        </div>
        
        {activeBoost && (
          <Badge className="ml-auto bg-indigo-600/50 text-white animate-pulse">
            Active: {activeBoost.timeLeft} turns left
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        {activeBoost ? (
          <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/50">
            <div className="text-center mb-2">
              <span className="text-indigo-400 font-bold text-lg">+{activeBoost.effect}% Power</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Staked MONAD</span>
              <span className="text-indigo-300 font-bold">{activeBoost.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration</span>
              <span className="text-indigo-300 font-bold">{activeBoost.timeLeft}/{activeBoost.duration} turns</span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full mt-2">
              <div 
                className="h-2 bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
                style={{ width: `${(activeBoost.timeLeft / activeBoost.duration) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Boost Amount</span>
              <span className="text-indigo-400 font-bold">{boostAmount} MONAD</span>
            </div>
            
            <Slider
              value={[boostAmount]}
              min={1}
              max={Math.min(100, playerMonad)}
              step={1}
              onValueChange={(value) => setBoostAmount(value[0])}
            />
            
            <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/20">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Effect</span>
                <span className="text-indigo-400 font-bold">+{boostEffect}% Power</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Duration</span>
                <span className="text-indigo-400 font-bold">{boostDuration} Turns</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Efficiency</span>
                <span className={`font-bold ${boostAmount < 10 ? 'text-green-400' : 
                  boostAmount < 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {boostAmount < 10 ? '200%' : boostAmount < 50 ? '180%' : '150%'}
                </span>
              </div>
            </div>
          </>
        )}
        
        {!activeBoost && (
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600"
            disabled={isProcessing || boostAmount > playerMonad}
            onClick={handleBoost}
          >
            {isProcessing ? (
              <>Processing...</>
            ) : boostAmount > playerMonad ? (
              <>Insufficient MONAD</>
            ) : (
              <>Activate Boost</>
            )}
          </Button>
        )}
        
        <div className="text-center text-xs text-gray-500">
          Powered by Monad's sub-second finality
        </div>
      </div>
      
      {/* Card preview with boost effect */}
      {activeBoost && (
        <div className="mt-4 p-3 bg-black/20 rounded-lg">
          <div className="text-xs text-center text-gray-400 mb-2">
            Card Power Preview with Boost
          </div>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-xs text-gray-500">Attack</div>
              <div className="flex items-center">
                <span className="text-white">5</span>
                <span className="text-green-400 text-xs ml-1">+{Math.round(5 * activeBoost.effect/100)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Defense</div>
              <div className="flex items-center">
                <span className="text-white">3</span>
                <span className="text-green-400 text-xs ml-1">+{Math.round(3 * activeBoost.effect/100)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Mana</div>
              <div className="flex items-center">
                <span className="text-white">4</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonadBoostMechanic;
