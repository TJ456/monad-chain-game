import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card as UICard } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Calendar, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { MonadGameService } from '../services/MonadGameService';
import { getTransactionExplorerUrl } from '../utils/explorer';

interface Tournament {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  participants: number;
  prizePool: string;
  status: 'upcoming' | 'active' | 'completed';
  rewards: TournamentReward[];
}

interface TournamentReward {
  id: string;
  name: string;
  description: string;
  rarity: number;
  position: string; // e.g., "1st Place", "Top 10", etc.
  imageUrl: string;
  claimed: boolean;
}

interface TournamentRewardsProps {
  monadGameService: MonadGameService;
  onRewardClaimed: () => void;
}

const TournamentRewards: React.FC<TournamentRewardsProps> = ({
  monadGameService,
  onRewardClaimed
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  // Fetch tournaments and rewards
  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, we would fetch this from the blockchain
        // For this example, we'll use mock data
        const mockTournaments: Tournament[] = [
          {
            id: '1',
            name: 'Monad Launch Tournament',
            description: 'The inaugural tournament celebrating the launch of Monad Chain Game',
            startTime: Date.now() - 86400000 * 10, // 10 days ago
            endTime: Date.now() - 86400000 * 3, // 3 days ago
            participants: 128,
            prizePool: '10',
            status: 'completed',
            rewards: [
              {
                id: '1',
                name: 'Champion\'s Crown',
                description: 'Exclusive legendary card awarded to the tournament champion',
                rarity: 3, // Legendary
                position: '1st Place',
                imageUrl: '/cards/tournament_champion.png',
                claimed: false
              },
              {
                id: '2',
                name: 'Finalist\'s Edge',
                description: 'Epic card awarded to tournament finalists',
                rarity: 2, // Epic
                position: 'Top 3',
                imageUrl: '/cards/tournament_finalist.png',
                claimed: false
              }
            ]
          },
          {
            id: '2',
            name: 'Weekly Monad Showdown',
            description: 'Weekly tournament with exclusive rewards',
            startTime: Date.now() - 86400000 * 2, // 2 days ago
            endTime: Date.now() + 86400000 * 5, // 5 days from now
            participants: 64,
            prizePool: '5',
            status: 'active',
            rewards: [
              {
                id: '3',
                name: 'Showdown Victor',
                description: 'Special card for the weekly tournament winner',
                rarity: 2, // Epic
                position: '1st Place',
                imageUrl: '/cards/tournament_weekly.png',
                claimed: false
              }
            ]
          },
          {
            id: '3',
            name: 'Monad Masters Championship',
            description: 'The most prestigious tournament for elite players',
            startTime: Date.now() + 86400000 * 10, // 10 days from now
            endTime: Date.now() + 86400000 * 17, // 17 days from now
            participants: 0,
            prizePool: '25',
            status: 'upcoming',
            rewards: [
              {
                id: '4',
                name: 'Master\'s Emblem',
                description: 'The most coveted card in Monad Chain Game',
                rarity: 3, // Legendary
                position: '1st Place',
                imageUrl: '/cards/tournament_master.png',
                claimed: false
              },
              {
                id: '5',
                name: 'Elite Challenger',
                description: 'Rare card for top performers',
                rarity: 2, // Epic
                position: 'Top 10',
                imageUrl: '/cards/tournament_elite.png',
                claimed: false
              }
            ]
          }
        ];
        
        setTournaments(mockTournaments);
        
        // Set the first completed tournament as selected by default
        const completedTournament = mockTournaments.find(t => t.status === 'completed');
        if (completedTournament) {
          setSelectedTournament(completedTournament);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        toast.error('Failed to load tournament rewards');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTournaments();
  }, []);
  
  const handleClaimReward = async (reward: TournamentReward) => {
    if (!monadGameService.isConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedTournament) {
      toast.error('No tournament selected');
      return;
    }
    
    setIsClaiming(true);
    
    try {
      const toastId = 'claim-reward-toast';
      toast.loading(`Claiming ${reward.name}...`, { id: toastId });
      
      // Create card data for the tournament reward
      const cardData = {
        name: reward.name,
        rarity: reward.rarity,
        cardType: Math.floor(Math.random() * 3), // Random card type
        attack: 7 + Math.floor(Math.random() * 5) + (reward.rarity * 3),
        defense: 7 + Math.floor(Math.random() * 5) + (reward.rarity * 3),
        mana: 2 + Math.floor(Math.random() * 2),
        description: `${reward.description} - ${selectedTournament.name} (${reward.position})`
      };
      
      // Mint the card
      const result = await monadGameService.mintCard(cardData);
      
      toast.success(`Successfully claimed ${reward.name}!`, {
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
            className="text-xs bg-amber-900/50 hover:bg-amber-800/50 text-amber-400 py-1 px-2 rounded flex items-center justify-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open Explorer
          </button>
        </div>,
        {
          duration: 5000,
        }
      );
      
      // Mark the reward as claimed
      setTournaments(tournaments.map(t => 
        t.id === selectedTournament.id 
          ? {
              ...t,
              rewards: t.rewards.map(r => 
                r.id === reward.id ? { ...r, claimed: true } : r
              )
            }
          : t
      ));
      
      // Update selected tournament
      setSelectedTournament({
        ...selectedTournament,
        rewards: selectedTournament.rewards.map(r => 
          r.id === reward.id ? { ...r, claimed: true } : r
        )
      });
      
      // Notify parent component
      onRewardClaimed();
    } catch (error) {
      console.error('Error claiming tournament reward:', error);
      toast.error('Failed to claim tournament reward', {
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
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return { label: 'Upcoming', color: 'bg-blue-500 text-white' };
      case 'active': return { label: 'Active', color: 'bg-green-500 text-white' };
      case 'completed': return { label: 'Completed', color: 'bg-amber-500 text-black' };
      default: return { label: 'Unknown', color: 'bg-gray-500 text-white' };
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <UICard className="glassmorphism border-amber-500/30">
        <div className="p-6 text-center">
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2">Tournament Rewards</h2>
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      </UICard>
    );
  }
  
  if (tournaments.length === 0) {
    return (
      <UICard className="glassmorphism border-amber-500/30">
        <div className="p-6 text-center">
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Tournaments</h2>
          <p className="text-gray-400">There are no tournaments available at this time. Check back later!</p>
        </div>
      </UICard>
    );
  }
  
  return (
    <UICard className="glassmorphism border-amber-500/30">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Tournament Rewards</h2>
            <p className="text-gray-400 text-sm">Exclusive NFT rewards for tournament participants</p>
          </div>
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {tournaments.map(tournament => {
            const status = getStatusLabel(tournament.status);
            
            return (
              <div 
                key={tournament.id}
                onClick={() => setSelectedTournament(tournament)}
                className={`bg-black/30 rounded-md p-3 border cursor-pointer transition-all ${
                  selectedTournament?.id === tournament.id 
                    ? 'border-amber-500 ring-1 ring-amber-500/50' 
                    : 'border-white/10 hover:border-amber-500/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-white">{tournament.name}</h3>
                  <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(tournament.startTime)} - {formatDate(tournament.endTime)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-400">
                    <Users className="w-3 h-3 mr-1" />
                    <span>
                      {tournament.status === 'upcoming' 
                        ? 'Registration open' 
                        : `${tournament.participants} participants`}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-amber-400 font-medium">
                    <Trophy className="w-3 h-3 mr-1" />
                    <span>{tournament.prizePool} ETH prize pool</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedTournament && (
          <div className="bg-black/30 rounded-md p-4 border border-amber-500/20">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">{selectedTournament.name}</h3>
              <p className="text-sm text-gray-300">{selectedTournament.description}</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-amber-400">Available Rewards</h4>
              
              {selectedTournament.rewards.length > 0 ? (
                selectedTournament.rewards.map(reward => {
                  const rarity = getRarityLabel(reward.rarity);
                  
                  return (
                    <div key={reward.id} className="bg-black/40 rounded-md p-3 border border-white/10">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/4">
                          <div className="aspect-square rounded-md overflow-hidden border border-amber-500/30">
                            <img 
                              src={reward.imageUrl || '/cards/placeholder.png'} 
                              alt={reward.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        
                        <div className="w-full md:w-3/4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-md font-semibold text-white">{reward.name}</h3>
                              <div className="flex space-x-2 mt-1">
                                <Badge className={`${rarity.color}`}>{rarity.label}</Badge>
                                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                                  {reward.position}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-300">{reward.description}</p>
                          
                          {selectedTournament.status === 'completed' ? (
                            <Button
                              onClick={() => handleClaimReward(reward)}
                              disabled={isClaiming || reward.claimed}
                              className={reward.claimed 
                                ? "w-full bg-gray-700 text-gray-300 cursor-not-allowed"
                                : "w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                              }
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              {reward.claimed ? 'Reward Claimed' : 'Claim Reward'}
                            </Button>
                          ) : (
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-2 text-center">
                              <p className="text-xs text-blue-400">
                                {selectedTournament.status === 'upcoming' 
                                  ? 'Tournament has not started yet' 
                                  : 'Tournament is still in progress'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-400">No rewards available for this tournament</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default TournamentRewards;
