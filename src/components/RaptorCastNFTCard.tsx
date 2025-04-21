import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MintedNFT } from '../services/MonadNFTService';
import { raptorCastService, NFTPropagationResult } from '../services/RaptorCastService';
import { ExternalLink, Network, Share2, Sparkles, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NFTCard from './NFTCard';
import NFTPropagationVisualizer from './NFTPropagationVisualizer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RaptorCastNFTCardProps {
  nft: MintedNFT;
  className?: string;
  onPropagationComplete?: (result: NFTPropagationResult) => void;
  onEvolve?: (evolvedNFT: MintedNFT) => void;
  isEvolved?: boolean;
}

const RaptorCastNFTCard: React.FC<RaptorCastNFTCardProps> = ({
  nft,
  className = '',
  onPropagationComplete,
  onEvolve,
  isEvolved = false
}) => {
  const [showPropagation, setShowPropagation] = useState(false);
  const [propagationResult, setPropagationResult] = useState<NFTPropagationResult | null>(null);

  const handlePropagationComplete = (result: NFTPropagationResult) => {
    setPropagationResult(result);

    if (onPropagationComplete) {
      onPropagationComplete(result);
    }
  };

  const handleEvolve = (evolvedNFT: MintedNFT) => {
    if (onEvolve) {
      onEvolve(evolvedNFT);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Regular NFT Card */}
      <NFTCard nft={nft} />

      {/* RaptorCast Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-blue-900/80 to-transparent">
        <div className="flex justify-between items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center whitespace-nowrap text-xs">
            <Network className="w-3 h-3 mr-1" />
            RaptorCast
          </Badge>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 whitespace-nowrap min-w-0 flex-shrink-0"
                onClick={() => setShowPropagation(true)}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Propagate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Network className="w-5 h-5 mr-2 text-blue-400" />
                  RaptorCast NFT Propagation
                </DialogTitle>
                <DialogDescription>
                  Propagate your NFT through the Monad network using RaptorCast technology
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <NFTPropagationVisualizer
                  nft={nft}
                  propagationId={propagationResult?.messageId}
                  onComplete={handlePropagationComplete}
                  onEvolve={handleEvolve}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Evolution Indicator */}
      {(propagationResult?.evolutionFactor && propagationResult.evolutionFactor > 0) || isEvolved ? (
        <div className="absolute top-0 right-0 m-2">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center animate-pulse text-xs whitespace-nowrap">
            <Sparkles className="w-3 h-3 mr-1" />
            {isEvolved ? 'Evolved' : 'Evolution'}
          </Badge>
        </div>
      ) : null}
    </div>
  );
};

export default RaptorCastNFTCard;
