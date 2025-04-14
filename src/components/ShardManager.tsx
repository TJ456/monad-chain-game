import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Player, AIDifficultyTier, TierRequirement, NFTRedemptionRule, CardRarity } from '@/types/game';
import { monadGameState } from '@/data/gameData';
import { Sparkles, Clock, AlertCircle, Flame, Gift, BadgeCheck } from "lucide-react";

interface ShardManagerProps {
  player: Player;
  onRedeemShards: () => void;
}

// Define tier requirements
const tierRequirements: TierRequirement[] = [
  {
    tier: AIDifficultyTier.NOVICE,
    requiredWinRate: 0.5, // 50%
    shardReward: 1,
    nftRarity: CardRarity.COMMON
  },
  {
    tier: AIDifficultyTier.VETERAN,
    requiredWinRate: 0.65, // 65%
    shardReward: 3,
    nftRarity: CardRarity.RARE
  },
  {
    tier: AIDifficultyTier.LEGEND,
    requiredWinRate: 0.8, // 80%
    shardReward: 5,
    nftRarity: CardRarity.EPIC
  }
];

// Define NFT redemption rules
const nftRedemptionRules: NFTRedemptionRule = {
  shardsRequired: 10,
  cooldownPeriod: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxDailyTrials: 3,
  gasCost: 0.01 // MONAD tokens
};

const ShardManager: React.FC<ShardManagerProps> = ({ player, onRedeemShards }) => {
  const [redeemHover, setRedeemHover] = useState(false);
  const [redemptionInProgress, setRedemptionInProgress] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [recentRedemption, setRecentRedemption] = useState(false);
  
  const canRedeem = player.shards >= nftRedemptionRules.shardsRequired;
  const cooldownActive = player.lastTrialTime && 
    (Date.now() - player.lastTrialTime < nftRedemptionRules.cooldownPeriod);
  const hasEnoughGas = player.monad >= nftRedemptionRules.gasCost;
  
  // Reset success animation when player data changes
  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAnimation]);
  
  // Check for recent redemption
  useEffect(() => {
    if (player.lastTrialTime && Date.now() - player.lastTrialTime < 5000) {
      setRecentRedemption(true);
      setTimeout(() => setRecentRedemption(false), 5000);
    }
  }, [player.lastTrialTime]);
  
  // Calculate time remaining in cooldown
  const getTimeRemaining = () => {
    if (!player.lastTrialTime || !cooldownActive) return '';
    
    const timeRemaining = player.lastTrialTime + nftRedemptionRules.cooldownPeriod - Date.now();
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  };
  
  const handleRedeemClick = () => {
    if (!canRedeem) {
      toast.error("Not enough shards", { 
        description: `You need ${nftRedemptionRules.shardsRequired} shards to redeem an NFT.` 
      });
      return;
    }
    
    if (cooldownActive) {
      toast.error("Cooldown active", { 
        description: `Try again in ${getTimeRemaining()}.` 
      });
      return;
    }
    
    if (!hasEnoughGas) {
      toast.error("Insufficient MONAD for gas", { 
        description: `You need ${nftRedemptionRules.gasCost} MONAD for transaction fees.` 
      });
      return;
    }
    
    if (player.dailyTrialsRemaining <= 0) {
      toast.error("Daily limit reached", { 
        description: `Maximum ${nftRedemptionRules.maxDailyTrials} NFT trials per day.`
      });
      return;
    }
    
    setRedemptionInProgress(true);
    
    // Call the parent component's handler
    onRedeemShards();
    
    // Show success animation
    setTimeout(() => {
      setRedemptionInProgress(false);
      setShowSuccessAnimation(true);
    }, 2000);
  };

  return (
    <Card className={`glassmorphism ${showSuccessAnimation ? 'border-amber-500/50 animate-pulse' : 'border-emerald-500/30'}`}>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span className="flex items-center">
            {showSuccessAnimation ? (
              <>
                <Gift className="h-5 w-5 mr-2 text-amber-400" /> 
                NFT Redeemed!
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2 text-emerald-400" /> 
                Shard Manager
              </>
            )}
          </span>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-emerald-500/30 rounded-full mr-2 flex items-center justify-center">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-mono text-emerald-400">On-Chain</span>
          </div>
        </CardTitle>
        <CardDescription>
          {showSuccessAnimation ? (
            "Your new NFT card has been added to your collection!"
          ) : (
            "Collect shards from battles to mint new NFT cards"
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${showSuccessAnimation ? 'animate-fade-in' : ''}`}>
        {/* Shard Progress with Animation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <div className={`w-6 h-6 mr-2 rounded-full bg-emerald-500/20 flex items-center justify-center ${player.shards > 0 ? 'shard-animation' : ''}`}>
                <Sparkles className="h-3 w-3 text-emerald-400" />
              </div>
              <span>Shards: <span className="font-bold text-emerald-400">{player.shards}</span>/{nftRedemptionRules.shardsRequired}</span>
            </div>
            <Badge variant="outline" className={player.shards >= nftRedemptionRules.shardsRequired ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}>
              {Math.floor((player.shards / nftRedemptionRules.shardsRequired) * 100)}% Complete
            </Badge>
          </div>
          <Progress 
            value={(player.shards / nftRedemptionRules.shardsRequired) * 100} 
            className="h-2 bg-black/50"
          />
        </div>
        
        {showSuccessAnimation ? (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center">
                <BadgeCheck className="h-8 w-8 text-amber-400" />
              </div>
            </div>
            <div className="text-lg font-semibold text-amber-400">NFT Successfully Minted!</div>
            <div className="text-sm text-gray-300">
              Your new card has been added to your collection and registered on the MONAD blockchain.
            </div>
            <div className="text-xs text-amber-400/70 font-mono">
              Transaction hash: 0x{Math.random().toString(16).slice(2, 14)}...
            </div>
          </div>
        ) : (
          <>
            {/* Shard Tiers Table with Visual Indicators */}
            <div className="border border-white/10 rounded-md overflow-hidden">
              <div className="bg-black/30 px-3 py-2 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">AI Difficulty Tiers</h3>
                <p className="text-xs text-gray-400">Higher difficulty = better rewards</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-black/30">
                  <tr>
                    <th className="py-2 px-3 text-left">Tier</th>
                    <th className="py-2 px-3 text-center">Win Rate</th>
                    <th className="py-2 px-3 text-center">Reward</th>
                    <th className="py-2 px-3 text-right">NFT Rarity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tierRequirements.map((tier, index) => {
                    // Calculate if this tier is active based on player win rate
                    const playerWinRate = player.wins > 0 ? player.wins / (player.wins + player.losses) : 0;
                    const isTierActive = playerWinRate >= tier.requiredWinRate;
                    const isCurrentTier = 
                      (tier.tier === AIDifficultyTier.NOVICE && playerWinRate < tierRequirements[1].requiredWinRate) ||
                      (tier.tier === AIDifficultyTier.VETERAN && playerWinRate >= tierRequirements[1].requiredWinRate && playerWinRate < tierRequirements[2].requiredWinRate) ||
                      (tier.tier === AIDifficultyTier.LEGEND && playerWinRate >= tierRequirements[2].requiredWinRate);
                    
                    return (
                      <tr 
                        key={tier.tier} 
                        className={`${isCurrentTier ? 'bg-emerald-900/20' : 'bg-black/20'} hover:bg-black/40 transition-colors`}
                      >
                        <td className="py-2 px-3 capitalize">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isTierActive ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                            {tier.tier}
                            {isCurrentTier && (
                              <Badge variant="outline" className="ml-2 py-0 px-1 bg-emerald-900/30 text-emerald-400 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {(tier.requiredWinRate * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <Sparkles className="h-3 w-3 mr-1 text-emerald-400" />
                            <span className={`${isTierActive ? 'text-emerald-400 font-semibold' : 'text-gray-400'}`}>
                              {tier.shardReward} 
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right capitalize">
                          <Badge className={`
                            ${tier.nftRarity === CardRarity.COMMON ? 'bg-gray-700/50 text-gray-300' : ''}
                            ${tier.nftRarity === CardRarity.RARE ? 'bg-blue-900/50 text-blue-300' : ''}
                            ${tier.nftRarity === CardRarity.EPIC ? 'bg-purple-900/50 text-purple-300' : ''}
                            ${tier.nftRarity === CardRarity.LEGENDARY ? 'bg-amber-900/50 text-amber-300' : ''}
                          `}>
                            {tier.nftRarity}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Anti-Farming Info with Icons */}
            <div className="text-sm space-y-3 bg-black/20 p-3 rounded-md border border-white/10">
              <h3 className="font-semibold text-white flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-400" />
                Anti-Farming Rules
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center mr-2 flex-shrink-0">
                    <Clock className="h-3 w-3 text-gray-400" />
                  </div>
                  <span>Maximum <span className="text-amber-400 font-semibold">{nftRedemptionRules.maxDailyTrials}</span> NFT trials per day</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center mr-2 flex-shrink-0">
                    <div className="h-3 w-3 text-gray-400 flex items-center justify-center">
                      M
                    </div>
                  </div>
                  <span>Each redemption costs <span className="text-amber-400 font-semibold">{nftRedemptionRules.gasCost}</span> MONAD gas</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center mr-2 flex-shrink-0">
                    <Clock className="h-3 w-3 text-gray-400" />
                  </div>
                  <span>24-hour cooldown between redemptions</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center mr-2 flex-shrink-0">
                    <Flame className="h-3 w-3 text-gray-400" />
                  </div>
                  <span>Shards expire after 24 hours</span>
                </li>
              </ul>
              
              {/* Player Stats */}
              <div className="bg-black/30 rounded p-2 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Daily Trials:</span>
                  <span className="text-xs font-mono">{player.dailyTrialsRemaining}/{nftRedemptionRules.maxDailyTrials}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">MONAD Balance:</span>
                  <span className="text-xs font-mono">{player.monad.toFixed(2)} MONAD</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter>
        {showSuccessAnimation ? (
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white"
            onClick={() => setShowSuccessAnimation(false)}
          >
            Continue
          </Button>
        ) : (
          <Button 
            onClick={handleRedeemClick}
            onMouseEnter={() => setRedeemHover(true)}
            onMouseLeave={() => setRedeemHover(false)}
            disabled={!canRedeem || cooldownActive || !hasEnoughGas || player.dailyTrialsRemaining <= 0 || redemptionInProgress}
            className={`w-full ${redeemHover && canRedeem && !cooldownActive && hasEnoughGas && player.dailyTrialsRemaining > 0 ? 'redeem-animation' : ''} 
              ${redemptionInProgress ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'} text-white flex items-center justify-center`}
          >
            {redemptionInProgress ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Processing on MONAD...
              </>
            ) : canRedeem && !cooldownActive && hasEnoughGas && player.dailyTrialsRemaining > 0 ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Redeem NFT Card
              </>
            ) : !canRedeem ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Need {nftRedemptionRules.shardsRequired - player.shards} more shards
              </>
            ) : cooldownActive ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Cooldown: {getTimeRemaining()}
              </>
            ) : !hasEnoughGas ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Need {nftRedemptionRules.gasCost} MONAD for gas
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Daily limit reached
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ShardManager;
