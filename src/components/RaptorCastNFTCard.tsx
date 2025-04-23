import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);

  // Check if this NFT has already been propagated when component mounts
  useEffect(() => {
    const checkExistingPropagation = async () => {
      try {
        // Make sure RaptorCast service is initialized
        if (!raptorCastService['isInitialized']) {
          await raptorCastService.initialize();
        }

        // Check if this NFT has already been propagated
        const existingPropagations = raptorCastService.getAllNFTPropagations();
        const existingPropagation = existingPropagations.find(p => p.nft.tokenId === nft.tokenId);

        if (existingPropagation) {
          console.log(`Found existing propagation for NFT ${nft.tokenId}:`, existingPropagation);
          setPropagationResult(existingPropagation);
        }
      } catch (error) {
        console.error('Error checking existing propagation:', error);
      }
    };

    checkExistingPropagation();
  }, [nft.tokenId]);

  const handlePropagationComplete = (result: NFTPropagationResult) => {
    console.log('Propagation complete:', result);
    setPropagationResult(result);

    if (onPropagationComplete) {
      onPropagationComplete(result);
    }
  };

  const handleEvolve = (evolvedNFT: MintedNFT) => {
    console.log('NFT evolved:', evolvedNFT);
    if (onEvolve) {
      onEvolve(evolvedNFT);
    }
  };

  const handleOpenPropagation = () => {
    console.log('Opening propagation dialog for NFT:', nft.tokenId);
    setIsLoading(true); // Set loading state when opening dialog
    setShowPropagation(true);

    // Reset loading state after a short delay to allow dialog to open
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleClosePropagation = () => {
    console.log('Closing propagation dialog');
    setShowPropagation(false);
  };

  // Handle propagation completion
  const handlePropagationStart = () => {
    console.log('Propagation starting for NFT:', nft.tokenId);
    setIsLoading(true);
  };

  const handlePropagationEnd = () => {
    console.log('Propagation ended for NFT:', nft.tokenId);
    setIsLoading(false);
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

          <Dialog open={showPropagation} onOpenChange={(open) => {
            // Only allow closing if not in loading state
            if (!isLoading || !open) {
              console.log('Dialog open state changing to:', open);
              setShowPropagation(open);
              if (!open) {
                handleClosePropagation();
              }
            } else {
              console.log('Preventing dialog from closing during loading state');
            }
          }}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 whitespace-nowrap min-w-0 flex-shrink-0"
                onClick={handleOpenPropagation}
                disabled={isLoading}
              >
                <Share2 className="w-3 h-3 mr-1" />
                {isLoading ? 'Loading...' : 'Propagate'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Network className="w-5 h-5 mr-2 text-blue-400" />
                  RaptorCast NFT Propagation - {nft.name}
                </DialogTitle>
                <DialogDescription>
                  Propagate your NFT through the Monad network using RaptorCast technology
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <NFTPropagationVisualizer
                  nft={nft}
                  propagationId={propagationResult?.messageId}
                  onComplete={(result) => {
                    handlePropagationComplete(result);
                    handlePropagationEnd();
                    // Don't automatically close the dialog so user can see the result
                  }}
                  onEvolve={handleEvolve}
                  onPropagationStart={handlePropagationStart}
                  onPropagationError={handlePropagationEnd}
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
