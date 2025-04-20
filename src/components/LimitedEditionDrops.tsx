import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card as UICard } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { MonadGameService } from '../services/MonadGameService';
import { getTransactionExplorerUrl } from '../utils/explorer';

interface LimitedEditionDrop {
  id: string;
  name: string;
  description: string;
  rarity: number;
  totalSupply: number;
  remainingSupply: number;
  price: string;
  endTime: number;
  imageUrl: string;
}

interface LimitedEditionDropsProps {
  monadGameService: MonadGameService;
  onDropClaimed: () => void;
}

const LimitedEditionDrops: React.FC<LimitedEditionDropsProps> = ({
  monadGameService,
  onDropClaimed
}) => {
  const [drops, setDrops] = useState<LimitedEditionDrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Fetch available drops
  useEffect(() => {
    const fetchDrops = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, we would fetch this from a backend API
        // For this example, we'll use mock data
        const mockDrops: LimitedEditionDrop[] = [
          {
            id: '1',
            name: 'Monad Genesis Card',
            description: 'Limited edition card celebrating the launch of Monad Chain Game',
            rarity: 3, // Legendary
            totalSupply: 100,
            remainingSupply: 37,
            price: '0.05',
            endTime: Date.now() + 86400000 * 3, // 3 days from now
            imageUrl: '/cards/legendary_special.png'
          },
          {
            id: '2',
            name: 'Parallel Execution Master',
            description: 'Harness the power of Monad\'s parallel execution',
            rarity: 2, // Epic
            totalSupply: 500,
            remainingSupply: 213,
            price: '0.02',
            endTime: Date.now() + 86400000 * 7, // 7 days from now
            imageUrl: '/cards/epic_special.png'
          },
          {
            id: '3',
            name: 'Monad Founder\'s Card',
            description: 'Exclusive card for early adopters of Monad Chain Game',
            rarity: 3, // Legendary
            totalSupply: 50,
            remainingSupply: 8,
            price: '0.1',
            endTime: Date.now() + 86400000 * 2, // 2 days from now
            imageUrl: '/cards/legendary_founder.png'
          }
        ];
        
        setDrops(mockDrops);
      } catch (error) {
        console.error('Error fetching limited edition drops:', error);
        toast.error('Failed to load limited edition drops');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrops();
  }, []);
  
  const handleClaimDrop = async (drop: LimitedEditionDrop) => {
    if (!monadGameService.isConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setIsClaiming(true);
    
    try {
      const toastId = 'claim-drop-toast';
      toast.loading(`Claiming ${drop.name}...`, { id: toastId });
      
      // Create card data for the limited edition drop
      const cardData = {
        name: drop.name,
        rarity: drop.rarity,
        cardType: Math.floor(Math.random() * 3), // Random card type
        attack: 5 + Math.floor(Math.random() * 5) + (drop.rarity * 2),
        defense: 5 + Math.floor(Math.random() * 5) + (drop.rarity * 2),
        mana: 2 + Math.floor(Math.random() * 3),
        description: drop.description
      };
      
      // Mint the card
      const result = await monadGameService.mintCard(cardData);
      
      toast.success(`Successfully claimed ${drop.name}!`, {
        id: toastId,
        description: `Transaction confirmed in block #${result.blockNumber}`
      });
      
      // Add a button to view the transaction in the explorer
      const explorerUrl = getTransactionExplorerUrl(result.txHash);
      toast.success(
        <div className="flex flex-col space-y-2">
          <span>View claim on MONAD Explorer</span>
          <button
            onClick={() => window.open(explorerUrl, '_blank')}
            className="text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-400 py-1 px-2 rounded flex items-center justify-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open Explorer
          </button>
        </div>,
        {
          duration: 5000,
        }
      );
      
      // Update the drop's remaining supply
      setDrops(drops.map(d => 
        d.id === drop.id 
          ? { ...d, remainingSupply: Math.max(0, d.remainingSupply - 1) }
          : d
      ));
      
      // Notify parent component
      onDropClaimed();
    } catch (error) {
      console.error('Error claiming drop:', error);
      toast.error('Failed to claim limited edition drop', {
        description: error.message || 'Transaction failed. Please try again.'
      });
    } finally {
      setIsClaiming(false);
    }
  };
  
  const getRarityLabel = (rarity: number) => {
    switch (rarity) {
      case 3: return { label: 'Legendary', color: 'bg-amber-500 text-black' };
      case 2: return { label: 'Epic', color: 'bg-purple-500 text-white' };
      case 1: return { label: 'Rare', color: 'bg-blue-500 text-white' };
      default: return { label: 'Common', color: 'bg-gray-500 text-white' };
    }
  };
  
  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const timeRemaining = endTime - now;
    
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };
  
  if (isLoading) {
    return (
      <UICard className="glassmorphism border-purple-500/30">
        <div className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2">Limited Edition Drops</h2>
          <p className="text-gray-400">Loading available drops...</p>
        </div>
      </UICard>
    );
  }
  
  if (drops.length === 0) {
    return (
      <UICard className="glassmorphism border-purple-500/30">
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Active Drops</h2>
          <p className="text-gray-400">There are no limited edition drops available at this time. Check back later!</p>
        </div>
      </UICard>
    );
  }
  
  return (
    <UICard className="glassmorphism border-purple-500/30">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Limited Edition Drops</h2>
            <p className="text-gray-400 text-sm">Exclusive NFT cards with limited supply</p>
          </div>
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        
        <div className="space-y-4">
          {drops.map(drop => {
            const rarity = getRarityLabel(drop.rarity);
            const isLowSupply = drop.remainingSupply <= drop.totalSupply * 0.1;
            
            return (
              <div key={drop.id} className="bg-black/30 rounded-md p-4 border border-purple-500/20">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <div className="aspect-square rounded-md overflow-hidden border border-purple-500/30">
                      <img 
                        src={drop.imageUrl || '/cards/placeholder.png'} 
                        alt={drop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-3/4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{drop.name}</h3>
                        <Badge className={`${rarity.color} mt-1`}>{rarity.label}</Badge>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-amber-400 mr-1" />
                        <span className="text-xs text-amber-400">{formatTimeRemaining(drop.endTime)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300">{drop.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">Supply</p>
                        <p className={`text-sm font-medium ${isLowSupply ? 'text-red-400' : 'text-white'}`}>
                          {drop.remainingSupply} / {drop.totalSupply} remaining
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400 text-right">Price</p>
                        <p className="text-sm font-medium text-white">{drop.price} ETH</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleClaimDrop(drop)}
                      disabled={isClaiming || drop.remainingSupply === 0}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {drop.remainingSupply === 0 ? 'Sold Out' : 'Claim Drop'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </UICard>
  );
};

export default LimitedEditionDrops;
