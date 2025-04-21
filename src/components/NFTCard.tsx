import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MintedNFT, monadNFTService } from '../services/MonadNFTService';
import { ExternalLink, Sparkles, Shield, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getElementImage, getQualityImage, getAbilityImage } from '../utils/nftImages';

interface NFTCardProps {
  nft: MintedNFT;
  className?: string;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, className = '' }) => {
  // Get color based on quality
  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-orange-400';
    if (quality >= 60) return 'text-purple-400';
    if (quality >= 40) return 'text-blue-400';
    if (quality >= 20) return 'text-green-400';
    return 'text-gray-400';
  };

  // Get background based on quality
  const getQualityBackground = (quality: number) => {
    if (quality >= 80) return 'bg-gradient-to-br from-orange-900/30 to-yellow-900/30 border-orange-500/30';
    if (quality >= 60) return 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30';
    if (quality >= 40) return 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30';
    if (quality >= 20) return 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30';
    return 'bg-gradient-to-br from-gray-900/30 to-slate-900/30 border-gray-500/30';
  };

  // Get rarity badge color
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'uncommon': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Find rarity attribute
  const rarityAttribute = nft.attributes.find(attr => attr.trait_type === 'Rarity');
  const rarity = rarityAttribute ? rarityAttribute.value.toString() : 'Common';

  // Find element attribute
  const elementAttribute = nft.attributes.find(attr => attr.trait_type === 'Element');
  const element = elementAttribute ? elementAttribute.value.toString() : 'Unknown';

  // Find power level attribute
  const powerAttribute = nft.attributes.find(attr => attr.trait_type === 'Power Level');
  const powerLevel = powerAttribute ? Number(powerAttribute.value) : 0;

  // Find special ability attribute
  const abilityAttribute = nft.attributes.find(attr => attr.trait_type === 'Special Ability');
  const specialAbility = abilityAttribute ? abilityAttribute.value.toString() : 'None';

  return (
    <Card className={`p-4 ${getQualityBackground(nft.quality)} border ${className}`}>
      <div className="flex flex-col">
        {/* NFT Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className={`text-lg font-bold ${getQualityColor(nft.quality)}`}>{nft.name}</h3>
            <div className="text-xs text-gray-400 mt-1">Token ID: {nft.tokenId}</div>
          </div>
          <Badge className={`${getRarityColor(rarity)}`}>
            {rarity}
          </Badge>
        </div>

        {/* NFT Image */}
        <div className="relative mb-3 rounded-md overflow-hidden border border-gray-700/50">
          {/* Comic-style image with gradient background */}
          <div className="aspect-square bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
            {/* Comic image based on element */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
              {/* Large element emoji as fallback */}
              <div className={`text-6xl ${getQualityColor(nft.quality)}`}>
                {element === 'Fire' && '🔥'}
                {element === 'Water' && '💧'}
                {element === 'Earth' && '🌍'}
                {element === 'Air' && '💨'}
                {element === 'Lightning' && '⚡'}
                {element === 'Shadow' && '👤'}
                {element === 'Light' && '✨'}
                {!['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow', 'Light'].includes(element) && '❓'}
              </div>

              {/* Element emoji overlay */}
              <div className="absolute bottom-3 left-3 bg-black/60 rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-black/50">
                <div className={`text-3xl ${getQualityColor(nft.quality)}`}>
                  {element === 'Fire' && '🔥'}
                  {element === 'Water' && '💧'}
                  {element === 'Earth' && '🌍'}
                  {element === 'Air' && '💨'}
                  {element === 'Lightning' && '⚡'}
                  {element === 'Shadow' && '👤'}
                  {element === 'Light' && '✨'}
                  {!['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow', 'Light'].includes(element) && '❓'}
                </div>
              </div>
            </div>

            {/* Quality indicator */}
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs">
              <span className={getQualityColor(nft.quality)}>Quality: {nft.quality}/100</span>
            </div>
          </div>
        </div>

        {/* NFT Description */}
        <div className="text-sm text-gray-300 mb-3">
          {nft.description}
        </div>

        {/* NFT Attributes */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center text-xs">
            <Zap className="h-3 w-3 text-yellow-400 mr-1" />
            <span className="text-gray-400">Element:</span>
            <span className="ml-auto text-white">{element}</span>
          </div>
          <div className="flex items-center text-xs">
            <Shield className="h-3 w-3 text-blue-400 mr-1" />
            <span className="text-gray-400">Power:</span>
            <span className="ml-auto text-white">{powerLevel}</span>
          </div>
          <div className="flex items-center text-xs col-span-2">
            <Sparkles className="h-3 w-3 text-purple-400 mr-1" />
            <span className="text-gray-400">Special:</span>
            <span className="ml-auto text-white">{specialAbility}</span>
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="mt-auto pt-2 border-t border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Minted on Monad</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => window.open(monadNFTService.getExplorerUrl(nft.transactionHash), '_blank')}
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">View transaction on Monad Explorer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NFTCard;
