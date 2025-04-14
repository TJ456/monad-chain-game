import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MonadBoostMechanicProps {
  playerMonad?: number;
  playerMonadBalance?: number; // Added for compatibility
  onBoost?: (amount: number, boostEffect: number, duration: number) => void;
  onActivateBoost?: (amount: number, boostEffect: number, duration: number) => void; // Added for compatibility
  boostActive?: boolean;
  boostDetails?: {effect: number, remainingTurns: number} | null;
}

const MonadBoostMechanic: React.FC<MonadBoostMechanicProps> = ({
  playerMonad = 1000,
  playerMonadBalance,
  onBoost = () => {},
  onActivateBoost,
  boostActive = false,
  boostDetails = null
}) => {
  // Use playerMonadBalance if provided, otherwise use playerMonad
  const actualMonad = playerMonadBalance !== undefined ? playerMonadBalance : playerMonad;
  const [boostAmount, setBoostAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBoost, setActiveBoost] = useState<{
    amount: number;
    effect: number;
    duration: number;
    timeLeft: number;
  } | null>(null);

  // Improved smooth logarithmic scaling for boost effect
  const calculateBoostEffect = (amount: number) => {
    // Base effect with diminishing returns
    const baseEffect = amount * 2; // Base 200%
    const diminishingFactor = Math.log10(amount + 1); // +1 to avoid log(0)
    return Math.round(baseEffect / (1 + diminishingFactor * 0.2));
  };

  const calculateBoostDuration = (amount: number): number => {
    if (amount <= 1) return 2;
    if (amount >= 32) return 6;
    return 2 + Math.floor(Math.log2(amount));
  };
  // Calculate current efficiency percentage
  const calculateEfficiency = (amount: number) => {
    const effect = calculateBoostEffect(amount);
    return (effect / amount) * 100;
  };

  const boostEffect = calculateBoostEffect(boostAmount);
  const boostDuration = calculateBoostDuration(boostAmount);
  const currentEfficiency = calculateEfficiency(boostAmount);

  const handleBoost = async () => {
    if (boostAmount > actualMonad) {
      toast.error("Insufficient MONAD tokens");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing on Monad chain...", { id: "boost-tx" });

    try {
      // Simulate Monad's fast finality (500ms instead of 1000ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      const effect = calculateBoostEffect(boostAmount);
      const duration = calculateBoostDuration(boostAmount);

      setActiveBoost({
        amount: boostAmount,
        effect,
        duration,
        timeLeft: duration
      });

      toast.success("Boost confirmed!", {
        id: "boost-tx",
        description: `+${effect}% power (Monad tx confirmed in 500ms)`
      });

      // Call the appropriate boost handler function
      if (onActivateBoost) {
        onActivateBoost(boostAmount, effect, duration);
      } else {
        onBoost(boostAmount, effect, duration);
      }
    } catch (error) {
      toast.error("Boost failed", {
        id: "boost-tx",
        description: "Monad chain transaction reverted"
      });
    } finally {
      setIsProcessing(false);
    }
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
    }, 5000); // 5-second intervals for turn-based gameplay

    return () => clearTimeout(timer);
  }, [activeBoost]);

  // Get efficiency color based on current value
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency > 180) return 'text-green-400';
    if (efficiency > 160) return 'text-yellow-400';
    return 'text-red-400';
  };

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

        {(activeBoost || (boostActive && boostDetails)) && (
          <Badge className="ml-auto bg-indigo-600/50 text-white animate-pulse">
            Active: {activeBoost ? activeBoost.timeLeft : boostDetails?.remainingTurns} turns left
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {(activeBoost || (boostActive && boostDetails)) ? (
          <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/50">
            <div className="text-center mb-2">
              <span className="text-indigo-400 font-bold text-lg">
                +{activeBoost ? activeBoost.effect : boostDetails?.effect}% Power
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Staked MONAD</span>
              <span className="text-indigo-300 font-bold">
                {activeBoost ? activeBoost.amount : boostAmount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration</span>
              <span className="text-indigo-300 font-bold">
                {activeBoost
                  ? `${activeBoost.timeLeft}/${activeBoost.duration} turns`
                  : `${boostDetails?.remainingTurns} turns`
                }
              </span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full mt-2">
              <div
                className="h-2 bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
                style={{
                  width: activeBoost
                    ? `${(activeBoost.timeLeft / activeBoost.duration) * 100}%`
                    : boostDetails
                      ? `${(boostDetails.remainingTurns / 5) * 100}%` // Assuming 5 turns max
                      : '0%'
                }}
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
              max={Math.min(100, actualMonad)}
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
                <span className={`font-bold ${getEfficiencyColor(currentEfficiency)}`}>
                  {currentEfficiency.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Efficiency curve visualization */}
            <div className="mt-2">
              <div className="text-xs text-gray-400 mb-1">Boost Efficiency Curve</div>
              <div className="h-20 w-full bg-black/20 rounded-md p-1 flex">
                {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((amount) => {
                  if (amount > actualMonad) return null;
                  const efficiency = calculateEfficiency(amount);
                  return (
                    <div
                      key={amount}
                      className="flex-1 flex flex-col justify-end"
                      title={`${amount} MONAD → ${efficiency.toFixed(0)}% efficiency`}
                    >
                      <div
                        className={`w-full ${amount === boostAmount ? 'border border-yellow-400' : ''}`}
                        style={{
                          height: `${Math.min(100, efficiency)}%`,
                          background: efficiency > 180 ? 'linear-gradient(to top, #10b981, #34d399)' :
                                   efficiency > 160 ? 'linear-gradient(to top, #f59e0b, #fbbf24)' :
                                   'linear-gradient(to top, #ef4444, #f87171)'
                        }}
                      />
                      <div className="text-[8px] text-center text-gray-400 truncate">
                        {amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!(activeBoost || (boostActive && boostDetails)) && (
          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            disabled={isProcessing || boostAmount > actualMonad}
            onClick={handleBoost}
          >
            {isProcessing ? (
              <>Processing...</>
            ) : boostAmount > actualMonad ? (
              <>Insufficient MONAD</>
            ) : (
              <>Activate Boost</>
            )}
          </Button>
        )}

        <div className="text-center text-xs text-gray-500">
          Powered by Monad's sub-second finality • {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Enhanced card preview with boost effect */}
      {(activeBoost || (boostActive && boostDetails)) && (
        <div className="mt-4 p-3 bg-black/20 rounded-lg border border-indigo-500/30">
          <div className="text-xs text-center text-gray-400 mb-2">
            Card Power Preview with Boost
          </div>
          <div className="flex justify-between space-x-2">
            <div className="text-center flex-1 p-2 bg-black/30 rounded">
              <div className="text-xs text-gray-500">Attack</div>
              <div className="flex items-center justify-center">
                <span className="text-white">5</span>
                <span className="text-green-400 text-xs ml-1">+{Math.round(5 * (activeBoost ? activeBoost.effect : boostDetails?.effect || 0)/100)}</span>
              </div>
              <div className="text-[10px] text-green-400 mt-1">
                ({activeBoost ? activeBoost.effect : boostDetails?.effect}% boost)
              </div>
            </div>
            <div className="text-center flex-1 p-2 bg-black/30 rounded">
              <div className="text-xs text-gray-500">Defense</div>
              <div className="flex items-center justify-center">
                <span className="text-white">3</span>
                <span className="text-green-400 text-xs ml-1">+{Math.round(3 * (activeBoost ? activeBoost.effect : boostDetails?.effect || 0)/100)}</span>
              </div>
              <div className="text-[10px] text-green-400 mt-1">
                ({activeBoost ? activeBoost.effect : boostDetails?.effect}% boost)
              </div>
            </div>
            <div className="text-center flex-1 p-2 bg-black/30 rounded">
              <div className="text-xs text-gray-500">Special</div>
              <div className="flex items-center justify-center">
                <span className="text-white">2</span>
                <span className="text-green-400 text-xs ml-1">+{Math.round(2 * (activeBoost ? activeBoost.effect : boostDetails?.effect || 0)/100)}</span>
              </div>
              <div className="text-[10px] text-green-400 mt-1">
                ({activeBoost ? activeBoost.effect : boostDetails?.effect}% boost)
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-center text-indigo-400">
            All active cards receive this boost
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonadBoostMechanic;