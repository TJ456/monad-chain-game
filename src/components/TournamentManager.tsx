import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { monadGameService } from '@/services/MonadGameService';
import { Trophy, Users, Clock, ChevronRight, Zap, Award, Star, Shield, Sword, Gift, Sparkles, Crown,
         Flame, Coins, Medal, Gem, Target, Bolt, Skull, Swords, Waves, Mountain, Wind, Sun, Moon,
         Hourglass, Gauge, Rocket, Landmark, Hexagon, Dices } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TournamentReward {
  type: 'shards' | 'card' | 'experience' | 'token' | 'nft';
  name: string;
  amount: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl?: string;
  description?: string;
}

interface TournamentTier {
  name: string;
  position: string; // e.g., "1st Place", "Top 3", "Top 10"
  rewards: TournamentReward[];
  color: string;
}

interface Tournament {
  id: number;
  name: string;
  description?: string;
  prizePool: number;
  entryFee: number;
  startTime: number;
  endTime: number;
  minLevel: number;
  active: boolean;
  participantCount?: number;
  winner?: string;
  isVerified?: boolean;
  canComplete?: boolean;
  featured?: boolean;
  // Enhanced properties
  tournamentType: 'standard' | 'elimination' | 'quickplay' | 'championship' | 'special' | 'seasonal';
  theme: 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light' | 'cosmic' | 'void' | 'tech';
  progress: number; // 0-100
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  maxParticipants?: number;
  entryRequirements?: string[];
  specialRules?: string[];
  tiers: TournamentTier[];
  rewards: {
    shards: number;
    cards: number;
    experience: number;
    specialReward?: string;
  };
  leaderboard?: {
    playerAddress: string;
    playerName?: string;
    playerAvatar?: string;
    rank?: number;
    wins: number;
    score: number;
    isCurrentPlayer?: boolean;
  }[];
  matches?: {
    id: string;
    player1: string;
    player2: string;
    winner?: string;
    timestamp: number;
    score?: [number, number];
  }[];
}

// Helper function to generate random player names
const generatePlayerName = () => {
  const prefixes = ['Crypto', 'Monad', 'Chain', 'Block', 'Pixel', 'Neon', 'Cyber', 'Quantum', 'Void', 'Stellar'];
  const suffixes = ['Warrior', 'Hunter', 'Master', 'Knight', 'Wizard', 'Ninja', 'Samurai', 'Titan', 'Legend', 'Phoenix'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
};

// Generate a random avatar URL
const generateAvatarUrl = () => {
  const avatarIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  return `/avatars/avatar-${avatarIds[Math.floor(Math.random() * avatarIds.length)]}.png`;
};

const TournamentManager: React.FC = () => {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showTournamentDetails, setShowTournamentDetails] = useState(false);
  const [newTournament, setNewTournament] = useState({
    entryFee: 0.1,
    duration: 24,
    minLevel: 1,
    tournamentType: 'standard' as const,
    theme: 'fire' as const,
    rewards: {
      shards: 100,
      cards: 2,
      experience: 500
    }
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        // Get wallet address if connected
        if (monadGameService.checkConnection()) {
          const address = await monadGameService.getWalletAddress();
          setWalletAddress(address);
        }
      } catch (error) {
        console.error("Failed to get wallet address:", error);
      }

      loadTournaments();
    };

    init();

    // Set up periodic refresh
    const interval = setInterval(loadTournaments, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadTournaments = async () => {
    try {
      // In a real implementation, we would fetch tournaments from the blockchain
      // For this example, we'll use our mock data
      import('../data/mockTournaments').then(({ generateMockTournaments }) => {
        const mockTournaments = generateMockTournaments();

        // Add some randomization to make it feel dynamic
        const updatedTournaments = mockTournaments.map(tournament => {
          // Randomly update participant count
          const participantDelta = Math.floor(Math.random() * 5);
          const newParticipantCount = Math.min(
            tournament.maxParticipants || 128,
            (tournament.participantCount || 0) + participantDelta
          );

          // Update progress based on time elapsed
          const totalDuration = tournament.endTime - tournament.startTime;
          const elapsed = Math.min(Date.now()/1000 - tournament.startTime, totalDuration);
          const progress = Math.floor((elapsed / totalDuration) * 100);

          // Add the current player to a random position in the leaderboard if not already there
          let leaderboard = [...(tournament.leaderboard || [])];
          if (walletAddress && !leaderboard.some(player => player.isCurrentPlayer)) {
            const playerPosition = Math.floor(Math.random() * 3) + 1; // Position 1-3
            const playerEntry = {
              playerAddress: walletAddress,
              playerName: 'You',
              playerAvatar: '/avatars/player.png',
              rank: playerPosition,
              wins: Math.floor(Math.random() * 10) + 5,
              score: Math.floor(Math.random() * 500) + (1000 - playerPosition * 100),
              isCurrentPlayer: true
            };

            // Insert player at the correct position
            leaderboard = [
              ...leaderboard.slice(0, playerPosition - 1),
              playerEntry,
              ...leaderboard.slice(playerPosition - 1)
            ].slice(0, 10); // Keep only top 10

            // Re-rank everyone
            leaderboard = leaderboard
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => ({ ...player, rank: idx + 1 }));
          }

          return {
            ...tournament,
            participantCount: newParticipantCount,
            progress,
            leaderboard
          };
        });

        setActiveTournaments(updatedTournaments);

        // If a tournament was selected, update it with the new data
        if (selectedTournament) {
          const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
          if (updatedTournament) {
            setSelectedTournament(updatedTournament);
          }
        }
      }).catch(error => {
        console.error("Failed to load mock tournaments:", error);
        toast.error("Failed to load tournaments");
      });
    } catch (error) {
      console.error("Failed to load tournaments:", error);
      toast.error("Failed to load tournaments");
    }
  };

  const handleCreateTournament = async () => {
    try {
      setIsCreating(true);
      await monadGameService.createTournament(
        newTournament.entryFee,
        newTournament.duration * 3600, // Convert hours to seconds
        newTournament.minLevel
      );
      toast.success("Tournament created successfully!");
      loadTournaments();
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create tournament:", error);
      toast.error("Failed to create tournament");
      setIsCreating(false);
    }
  };

  const handleJoinTournament = async (tournamentId: number, entryFee: number) => {
    try {
      setIsJoining(tournamentId);

      // Show joining toast with loading animation
      toast.loading("Joining tournament...", { id: `join-${tournamentId}` });

      // Add a slight delay to build anticipation
      await new Promise(resolve => setTimeout(resolve, 1500));

      await monadGameService.joinTournament(tournamentId);

      // Get tournament details
      const tournament = activeTournaments.find(t => t.id === tournamentId);
      if (!tournament) throw new Error("Tournament not found");

      // Success toast with animated confetti effect
      toast.success("Successfully joined tournament!", {
        id: `join-${tournamentId}`,
        description: "You're now competing for rewards!",
        duration: 5000
      });

      // Show welcome bonus toast with shards reward
      const welcomeBonus = Math.floor(Math.random() * 50) + 50; // 50-100 shards
      toast.success(`Welcome Bonus: ${welcomeBonus} Shards!`, {
        description: "Bonus shards added to your account",
        duration: 4000,
        icon: <Coins className="h-5 w-5 text-amber-400" />
      });

      // Show tournament tier rewards toast
      if (tournament.tiers && tournament.tiers.length > 0) {
        // Show the top tier rewards
        const topTier = tournament.tiers[0];
        const shardReward = topTier.rewards.find(r => r.type === 'shards');
        const cardReward = topTier.rewards.find(r => r.type === 'card');

        setTimeout(() => {
          toast("First Place Rewards", {
            description: (
              <div className="space-y-3">
                <div className="p-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-md border border-amber-500/30">
                  <div className="text-center mb-2">
                    <span className="text-amber-400 font-bold text-sm">{topTier.name} - {topTier.position}</span>
                  </div>
                  {shardReward && (
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 text-amber-400 mr-2" />
                      <span className="text-amber-400 font-medium">{shardReward.amount} Shards</span>
                    </div>
                  )}
                  {cardReward && (
                    <div className="flex items-center mt-1">
                      <Gift className="h-4 w-4 text-emerald-400 mr-2" />
                      <span className="text-emerald-400 font-medium">
                        {cardReward.name}
                        {cardReward.rarity && (
                          <span className={`ml-1 ${cardReward.rarity === 'legendary' ? 'text-amber-400' : cardReward.rarity === 'epic' ? 'text-purple-400' : 'text-blue-400'}`}>
                            ({cardReward.rarity})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-gray-400 text-xs">Win the tournament to claim these rewards!</span>
                </div>
              </div>
            ),
            action: {
              label: "View All Rewards",
              onClick: () => {
                setSelectedTournament(tournament);
                setShowTournamentDetails(true);
              }
            },
            duration: 8000
          });
        }, 2000);
      }

      // Update tournaments list
      loadTournaments();

      // Show tournament details
      setTimeout(() => {
        const updatedTournament = activeTournaments.find(t => t.id === tournamentId);
        if (updatedTournament) {
          setSelectedTournament(updatedTournament);
          setShowTournamentDetails(true);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to join tournament:", error);
      toast.error("Failed to join tournament", {
        id: `join-${tournamentId}`,
        description: "Please try again"
      });
    } finally {
      setIsJoining(null);
    }
  };

  const handleEndTournament = async (tournamentId: number) => {
    try {
      const status = await monadGameService.getTournamentStatus(tournamentId);
      if (!status.isVerified) {
        toast.error("Cannot end tournament - some games are not verified");
        return;
      }

      // Show loading toast
      toast.loading("Finalizing tournament results...", { id: `end-${tournamentId}` });

      // Add a slight delay to build anticipation
      await new Promise(resolve => setTimeout(resolve, 2000));

      await monadGameService.endTournament(tournamentId);

      // Get tournament details for rewards
      const tournament = activeTournaments.find(t => t.id === tournamentId);

      // Success toast with animated celebration effect
      toast.success("Tournament completed successfully!", {
        id: `end-${tournamentId}`,
        description: "Rewards have been distributed to winners!",
        duration: 5000
      });

      // Show rewards distribution toast
      if (tournament?.rewards) {
        // Simulate player winning position
        const playerPosition = Math.floor(Math.random() * 3) + 1; // 1st, 2nd, or 3rd place
        const rewardMultiplier = playerPosition === 1 ? 1 : playerPosition === 2 ? 0.6 : 0.3;

        const playerRewards = {
          shards: Math.floor(tournament.rewards.shards * rewardMultiplier),
          cards: Math.floor(tournament.rewards.cards * rewardMultiplier),
          experience: Math.floor(tournament.rewards.experience * rewardMultiplier)
        };

        // Show rewards toast with celebration
        toast("Tournament Rewards Earned!", {
          description: (
            <div className="space-y-2">
              <div className="text-center mb-2">
                <span className="text-amber-400 font-bold">{playerPosition === 1 ? '🏆 1st Place!' : playerPosition === 2 ? '🥈 2nd Place!' : '🥉 3rd Place!'}</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-amber-400 mr-2" />
                <span className="text-amber-400 font-bold">+{playerRewards.shards} Shards</span>
              </div>
              <div className="flex items-center">
                <Gift className="h-4 w-4 text-emerald-400 mr-2" />
                <span className="text-emerald-400 font-bold">+{playerRewards.cards} Cards</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-blue-400 font-bold">+{playerRewards.experience} XP</span>
              </div>
            </div>
          ),
          action: {
            label: "Claim Rewards",
            onClick: () => {
              setShowRewards(true);
              toast.success("Rewards claimed successfully!", {
                description: "Added to your inventory"
              });
            }
          },
          duration: 10000
        });
      }

      // Update tournaments list
      loadTournaments();
    } catch (error) {
      console.error("Failed to end tournament:", error);
      toast.error("Failed to end tournament", {
        id: `end-${tournamentId}`,
        description: "Please try again"
      });
    }
  };

  // Helper functions for tournament visuals
  const getTournamentTypeIcon = (type?: string) => {
    switch (type) {
      case 'elimination':
        return <Sword className="w-4 h-4 text-red-400" />;
      case 'quickplay':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'championship':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'special':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'seasonal':
        return <Landmark className="w-4 h-4 text-emerald-400" />;
      default: // standard
        return <Trophy className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getTournamentTypeLabel = (type?: string) => {
    switch (type) {
      case 'elimination':
        return 'Elimination';
      case 'quickplay':
        return 'Quick Play';
      case 'championship':
        return 'Championship';
      case 'special':
        return 'Special Event';
      case 'seasonal':
        return 'Seasonal';
      default: // standard
        return 'Standard';
    }
  };

  const getThemeColor = (theme?: string) => {
    switch (theme) {
      case 'fire':
        return 'from-red-600 to-orange-600';
      case 'water':
        return 'from-blue-600 to-cyan-600';
      case 'earth':
        return 'from-green-600 to-emerald-600';
      case 'air':
        return 'from-sky-600 to-indigo-600';
      case 'shadow':
        return 'from-purple-600 to-violet-600';
      case 'light':
        return 'from-amber-500 to-yellow-500';
      case 'cosmic':
        return 'from-indigo-400 via-purple-500 to-pink-500';
      case 'void':
        return 'from-slate-700 to-slate-900';
      case 'tech':
        return 'from-cyan-500 to-blue-600';
      default:
        return 'from-indigo-600 to-violet-600';
    }
  };

  const getThemeIcon = (theme?: string) => {
    switch (theme) {
      case 'fire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'water':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'earth':
        return <Mountain className="w-4 h-4 text-green-400" />;
      case 'air':
        return <Wind className="w-4 h-4 text-sky-400" />;
      case 'shadow':
        return <Moon className="w-4 h-4 text-purple-400" />;
      case 'light':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'cosmic':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'void':
        return <Hexagon className="w-4 h-4 text-slate-400" />;
      case 'tech':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      default:
        return <Trophy className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTimeLeft = (endTime: number) => {
    const secondsLeft = Math.max(0, endTime - Date.now()/1000);
    if (secondsLeft <= 0) return 'Ended';

    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }

    return `${minutes}m left`;
  };

  return (
    <Card className="glassmorphism border-indigo-500/30">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-900/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          Monad Tournaments
        </CardTitle>
        <CardDescription className="text-gray-300 mt-1">
          Compete in blockchain-verified tournaments for MONAD rewards and exclusive cards
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create Tournament Section */}
        <div className="bg-black/30 p-4 rounded-lg border border-indigo-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Create Tournament</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Entry Fee (MONAD)</label>
              <Input
                type="number"
                value={newTournament.entryFee}
                onChange={(e) => setNewTournament(prev => ({...prev, entryFee: parseFloat(e.target.value)}))}
                className="bg-black/50 border-indigo-500/30"
                min={0.1}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Duration (hours)</label>
              <Input
                type="number"
                value={newTournament.duration}
                onChange={(e) => setNewTournament(prev => ({...prev, duration: parseInt(e.target.value)}))}
                className="bg-black/50 border-indigo-500/30"
                min={1}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Min Level Required</label>
              <Input
                type="number"
                value={newTournament.minLevel}
                onChange={(e) => setNewTournament(prev => ({...prev, minLevel: parseInt(e.target.value)}))}
                className="bg-black/50 border-indigo-500/30"
                min={1}
              />
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600"
            onClick={handleCreateTournament}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>

        {/* Tournament Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="active" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Active Tournaments
            </TabsTrigger>
            <TabsTrigger value="featured" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              Featured Events
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Upcoming
            </TabsTrigger>
          </TabsList>

          {/* Active Tournaments Tab */}
          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[500px] rounded-md border border-indigo-500/20 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTournaments.length > 0 ? (
                  activeTournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className={`bg-black/30 p-4 rounded-lg border ${tournament.featured ? 'border-amber-500/50' : 'border-indigo-500/20'} hover:border-indigo-500/50 transition-colors relative overflow-hidden`}
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setShowTournamentDetails(true);
                      }}
                    >
                      {/* Tournament type badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`bg-gradient-to-r ${getThemeColor(tournament.theme)} text-white text-xs px-2 py-0.5`}>
                          {getTournamentTypeLabel(tournament.tournamentType)}
                        </Badge>
                      </div>

                      {/* Featured badge */}
                      {tournament.featured && (
                        <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden">
                          <div className="absolute top-0 left-0 w-24 transform rotate-[-45deg] translate-y-2 -translate-x-6 bg-amber-500 text-center text-xs font-bold text-black py-1">
                            FEATURED
                          </div>
                        </div>
                      )}

                      {/* Tournament header */}
                      <div className="flex items-start mb-3 mt-2">
                        <div className={`h-10 w-10 rounded-md bg-gradient-to-r ${getThemeColor(tournament.theme)} flex items-center justify-center mr-3 shadow-md`}>
                          {getThemeIcon(tournament.theme)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-lg">{tournament.name}</h4>
                          <p className="text-gray-400 text-xs line-clamp-1">
                            {tournament.description}
                          </p>
                        </div>
                      </div>

                      {/* Prize and rewards */}
                      <div className="mb-3 bg-black/20 p-2 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-indigo-400 text-sm font-medium">Prize Pool:</span>
                          <span className="text-white font-bold">{tournament.prizePool} MONAD</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="flex items-center text-amber-400">
                            <Coins className="w-3 h-3 mr-1" />
                            {tournament.rewards.shards} Shards
                          </div>
                          <div className="flex items-center text-emerald-400">
                            <Gift className="w-3 h-3 mr-1" />
                            {tournament.rewards.cards} Cards
                          </div>
                          <div className="flex items-center text-blue-400">
                            <Star className="w-3 h-3 mr-1" />
                            {tournament.rewards.experience} XP
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{tournament.progress}%</span>
                        </div>
                        <Progress value={tournament.progress} className="h-1.5" />
                      </div>

                      {/* Tournament details */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center text-gray-400">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {tournament.participantCount || 0}/{tournament.maxParticipants || '∞'} Players
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatTimeLeft(tournament.endTime)}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Trophy className="w-3.5 h-3.5 mr-1" />
                          {tournament.difficulty} Difficulty
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          Entry: {tournament.entryFee} MONAD
                        </div>
                      </div>

                      {/* Join button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinTournament(tournament.id, tournament.entryFee);
                        }}
                        className={`w-full bg-gradient-to-r ${getThemeColor(tournament.theme)} text-white`}
                        disabled={!tournament.active || isJoining === tournament.id}
                      >
                        {isJoining === tournament.id ? 'Joining...' : 'Join Tournament'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8 col-span-2">
                    No active tournaments. Create one to get started!
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Featured Events Tab */}
          <TabsContent value="featured" className="mt-0">
            <ScrollArea className="h-[500px] rounded-md border border-amber-500/20 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTournaments.filter(t => t.featured).length > 0 ? (
                  activeTournaments.filter(t => t.featured).map((tournament) => (
                    <div
                      key={tournament.id}
                      className="bg-black/30 p-4 rounded-lg border border-amber-500/30 hover:border-amber-500/60 transition-colors relative overflow-hidden"
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setShowTournamentDetails(true);
                      }}
                    >
                      {/* Tournament type badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`bg-gradient-to-r ${getThemeColor(tournament.theme)} text-white text-xs px-2 py-0.5`}>
                          {getTournamentTypeLabel(tournament.tournamentType)}
                        </Badge>
                      </div>

                      {/* Tournament header */}
                      <div className="flex items-start mb-3 mt-2">
                        <div className={`h-10 w-10 rounded-md bg-gradient-to-r ${getThemeColor(tournament.theme)} flex items-center justify-center mr-3 shadow-md`}>
                          {getThemeIcon(tournament.theme)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-lg">{tournament.name}</h4>
                          <p className="text-gray-400 text-xs line-clamp-1">
                            {tournament.description}
                          </p>
                        </div>
                      </div>

                      {/* Prize and rewards */}
                      <div className="mb-3 bg-black/20 p-2 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-amber-400 text-sm font-medium">Prize Pool:</span>
                          <span className="text-white font-bold">{tournament.prizePool} MONAD</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="flex items-center text-amber-400">
                            <Coins className="w-3 h-3 mr-1" />
                            {tournament.rewards.shards} Shards
                          </div>
                          <div className="flex items-center text-emerald-400">
                            <Gift className="w-3 h-3 mr-1" />
                            {tournament.rewards.cards} Cards
                          </div>
                          {tournament.rewards.specialReward && (
                            <div className="flex items-center text-purple-400">
                              <Crown className="w-3 h-3 mr-1" />
                              Special Reward
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{tournament.progress}%</span>
                        </div>
                        <Progress value={tournament.progress} className="h-1.5" />
                      </div>

                      {/* Tournament details */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center text-gray-400">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {tournament.participantCount || 0}/{tournament.maxParticipants || '∞'} Players
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatTimeLeft(tournament.endTime)}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Trophy className="w-3.5 h-3.5 mr-1" />
                          {tournament.difficulty} Difficulty
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          Entry: {tournament.entryFee} MONAD
                        </div>
                      </div>

                      {/* Join button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinTournament(tournament.id, tournament.entryFee);
                        }}
                        className={`w-full bg-gradient-to-r ${getThemeColor(tournament.theme)} text-white`}
                        disabled={!tournament.active || isJoining === tournament.id}
                      >
                        {isJoining === tournament.id ? 'Joining...' : 'Join Tournament'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8 col-span-2">
                    No featured tournaments available at this time.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upcoming Tab - Shows tournaments that haven't started yet */}
          <TabsContent value="upcoming" className="mt-0">
            <ScrollArea className="h-[500px] rounded-md border border-emerald-500/20 p-4">
              <div className="text-center text-gray-400 py-8">
                No upcoming tournaments scheduled at this time.
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Tournament Details Dialog */}
      <Dialog open={showTournamentDetails} onOpenChange={setShowTournamentDetails}>
        {selectedTournament && (
          <DialogContent className="bg-black/90 border-none max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-md bg-gradient-to-r ${getThemeColor(selectedTournament.theme)} flex items-center justify-center mr-3 shadow-md`}>
                  {getThemeIcon(selectedTournament.theme)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">{selectedTournament.name}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {selectedTournament.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {/* Left column - Tournament details */}
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Trophy className="w-4 h-4 text-amber-400 mr-2" />
                    Tournament Details
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{getTournamentTypeLabel(selectedTournament.tournamentType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Theme:</span>
                      <span className="text-white capitalize">{selectedTournament.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-white capitalize">{selectedTournament.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-white">{selectedTournament.entryFee} MONAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prize Pool:</span>
                      <span className="text-white">{selectedTournament.prizePool} MONAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white">{selectedTournament.participantCount || 0}/{selectedTournament.maxParticipants || '∞'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Level:</span>
                      <span className="text-white">{selectedTournament.minLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Left:</span>
                      <span className="text-white">{formatTimeLeft(selectedTournament.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Requirements and Rules */}
                {(selectedTournament.entryRequirements?.length > 0 || selectedTournament.specialRules?.length > 0) && (
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    {selectedTournament.entryRequirements?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-white font-medium mb-2 flex items-center">
                          <Shield className="w-4 h-4 text-blue-400 mr-2" />
                          Entry Requirements
                        </h3>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                          {selectedTournament.entryRequirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedTournament.specialRules?.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center">
                          <Sword className="w-4 h-4 text-red-400 mr-2" />
                          Special Rules
                        </h3>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                          {selectedTournament.specialRules.map((rule, idx) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Middle column - Rewards */}
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Gift className="w-4 h-4 text-emerald-400 mr-2" />
                    Rewards
                  </h3>

                  <div className="space-y-4">
                    {selectedTournament.tiers.map((tier, idx) => (
                      <div key={idx} className={`p-3 rounded-lg bg-gradient-to-r ${tier.color} bg-opacity-20 border border-white/10`}>
                        <h4 className="text-white font-medium text-sm mb-1">{tier.name} - {tier.position}</h4>
                        <div className="space-y-2">
                          {tier.rewards.map((reward, rewardIdx) => (
                            <div key={rewardIdx} className="flex items-center text-xs">
                              {reward.type === 'shards' && <Coins className="w-3 h-3 text-amber-400 mr-1.5" />}
                              {reward.type === 'card' && <Gift className="w-3 h-3 text-emerald-400 mr-1.5" />}
                              {reward.type === 'experience' && <Star className="w-3 h-3 text-blue-400 mr-1.5" />}
                              {reward.type === 'token' && <Gem className="w-3 h-3 text-indigo-400 mr-1.5" />}
                              {reward.type === 'nft' && <Crown className="w-3 h-3 text-purple-400 mr-1.5" />}
                              <span className="text-white">
                                {reward.amount} {reward.name}
                                {reward.rarity && <span className={`ml-1 ${reward.rarity === 'legendary' ? 'text-amber-400' : reward.rarity === 'epic' ? 'text-purple-400' : reward.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'}`}>({reward.rarity})</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Clock className="w-4 h-4 text-blue-400 mr-2" />
                    Tournament Progress
                  </h3>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{selectedTournament.progress}%</span>
                    </div>
                    <Progress value={selectedTournament.progress} className="h-2" />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Started: {new Date(selectedTournament.startTime * 1000).toLocaleString()}</span>
                    <span>Ends: {new Date(selectedTournament.endTime * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right column - Leaderboard */}
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Award className="w-4 h-4 text-amber-400 mr-2" />
                    Leaderboard
                  </h3>

                  <div className="space-y-2">
                    {selectedTournament.leaderboard?.map((player, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center p-2 rounded-md ${player.isCurrentPlayer ? 'bg-indigo-900/30 border border-indigo-500/30' : idx < 3 ? 'bg-slate-800/50' : 'bg-slate-900/50'}`}
                      >
                        <div className="w-6 text-center">
                          {idx === 0 ? <Trophy className="w-4 h-4 text-amber-400 mx-auto" /> :
                           idx === 1 ? <Trophy className="w-4 h-4 text-slate-300 mx-auto" /> :
                           idx === 2 ? <Trophy className="w-4 h-4 text-amber-700 mx-auto" /> :
                           <span className="text-gray-400 text-xs">{idx + 1}</span>}
                        </div>
                        <div className="flex items-center ml-2">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={player.playerAvatar} />
                            <AvatarFallback className="bg-slate-700 text-xs">{player.playerName?.substring(0, 2) || '??'}</AvatarFallback>
                          </Avatar>
                          <span className={`text-sm truncate ${player.isCurrentPlayer ? 'text-indigo-400 font-medium' : 'text-white'}`}>
                            {player.playerName || player.playerAddress}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center space-x-3 text-xs">
                          <span className="text-gray-400">{player.wins} wins</span>
                          <span className="text-amber-400 font-medium">{player.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join Tournament Button */}
                <Button
                  onClick={() => handleJoinTournament(selectedTournament.id, selectedTournament.entryFee)}
                  className={`w-full bg-gradient-to-r ${getThemeColor(selectedTournament.theme)} text-white py-6`}
                  disabled={!selectedTournament.active || isJoining === selectedTournament.id}
                >
                  {isJoining === selectedTournament.id ? 'Joining...' : 'Join Tournament'}
                </Button>

                {/* Tournament Rewards Preview */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                    Total Rewards
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-900/30 p-2 rounded-lg border border-amber-500/30">
                      <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <div className="text-amber-400 font-bold text-lg">{selectedTournament.rewards.shards}</div>
                      <div className="text-gray-400 text-xs">Shards</div>
                    </div>
                    <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/30">
                      <Gift className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <div className="text-emerald-400 font-bold text-lg">{selectedTournament.rewards.cards}</div>
                      <div className="text-gray-400 text-xs">Cards</div>
                    </div>
                    <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-500/30">
                      <Star className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-blue-400 font-bold text-lg">{selectedTournament.rewards.experience}</div>
                      <div className="text-gray-400 text-xs">XP</div>
                    </div>
                  </div>

                  {selectedTournament.rewards.specialReward && (
                    <div className="mt-2 bg-purple-900/30 p-2 rounded-lg border border-purple-500/30 text-center">
                      <Crown className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <div className="text-purple-400 font-bold text-sm">{selectedTournament.rewards.specialReward}</div>
                      <div className="text-gray-400 text-xs">Special Reward</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowTournamentDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
};

export default TournamentManager;