
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Player, AIDifficultyTier, TierRequirement, NFTRedemptionRule, CardRarity } from '@/types/game';
import { monadGameState } from '@/data/gameData';

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
  const canRedeem = player.shards >= nftRedemptionRules.shardsRequired;
  const cooldownActive = player.lastTrialTime && 
    (Date.now() - player.lastTrialTime < nftRedemptionRules.cooldownPeriod);
  const hasEnoughGas = player.monad >= nftRedemptionRules.gasCost;
  
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
    
    // If all checks pass, proceed with redemption
    toast.loading("Processing NFT redemption on MONAD chain...");
    
    // Simulate blockchain confirmation
    setTimeout(() => {
      onRedeemShards();
      toast.success("NFT Redeemed!", { 
        description: `Your new card has been added to your collection.`
      });
    }, 2000);
  };

  return (
    <Card className="glassmorphism border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Shard Manager</span>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-emerald-500/30 rounded-full mr-2 flex items-center justify-center">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-mono text-emerald-400">On-Chain</span>
          </div>
        </CardTitle>
        <CardDescription>
          Collect shards from battles to mint new NFT cards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Shard Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Shards: {player.shards}/{nftRedemptionRules.shardsRequired}</span>
            <span className="text-emerald-400">{Math.floor((player.shards / nftRedemptionRules.shardsRequired) * 100)}%</span>
          </div>
          <Progress 
            value={(player.shards / nftRedemptionRules.shardsRequired) * 100} 
            className="h-2 bg-black/50"
          />
        </div>
        
        {/* Shard Tiers Table */}
        <div className="border border-white/10 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/30">
              <tr>
                <th className="py-2 px-3 text-left">AI Tier</th>
                <th className="py-2 px-3 text-center">Win Rate</th>
                <th className="py-2 px-3 text-center">Reward</th>
                <th className="py-2 px-3 text-right">NFT Rarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tierRequirements.map((tier) => (
                <tr key={tier.tier} className="bg-black/20">
                  <td className="py-2 px-3 capitalize">{tier.tier}</td>
                  <td className="py-2 px-3 text-center">{tier.requiredWinRate * 100}%</td>
                  <td className="py-2 px-3 text-center">{tier.shardReward} Shards</td>
                  <td className="py-2 px-3 text-right capitalize">{tier.nftRarity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Anti-Farming Info */}
        <div className="text-sm space-y-2 bg-black/20 p-3 rounded-md border border-white/10">
          <h3 className="font-semibold">Anti-Farming Rules:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Maximum {nftRedemptionRules.maxDailyTrials} NFT trials per day</li>
            <li>Each redemption costs {nftRedemptionRules.gasCost} MONAD gas</li>
            <li>24-hour cooldown between redemptions</li>
            <li>Shards expire after 24 hours</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleRedeemClick}
          disabled={!canRedeem || cooldownActive || !hasEnoughGas || player.dailyTrialsRemaining <= 0}
          className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
        >
          {!canRedeem ? `Need ${nftRedemptionRules.shardsRequired - player.shards} more shards` :
            cooldownActive ? `Cooldown: ${getTimeRemaining()}` :
            !hasEnoughGas ? `Need ${nftRedemptionRules.gasCost} MONAD for gas` :
            player.dailyTrialsRemaining <= 0 ? 'Daily limit reached' :
            'Redeem NFT Card'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShardManager;
