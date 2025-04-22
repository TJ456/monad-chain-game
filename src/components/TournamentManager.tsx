import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { monadGameService } from '@/services/MonadGameService';
import { Trophy, Users, Clock, ChevronRight, Zap, Award, Star, Shield, Sword, Gift, Sparkles, Crown } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Tournament {
  id: number;
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
  // Enhanced properties
  tournamentType?: 'standard' | 'elimination' | 'quickplay' | 'championship';
  theme?: 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light';
  progress?: number; // 0-100
  rewards?: {
    shards: number;
    cards: number;
    experience: number;
  };
  leaderboard?: {
    playerAddress: string;
    wins: number;
    score: number;
  }[];
}

const TournamentManager: React.FC = () => {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showRewards, setShowRewards] = useState(false);
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
      const tournaments = await monadGameService.getAllActiveTournaments();

      // Enhanced tournaments with additional features for dopamine release
      const enhancedTournaments = await Promise.all(tournaments.map(async (t, index) => {
        const status = await monadGameService.getTournamentStatus(t.id);

        // Generate tournament type based on ID
        const tournamentTypes = ['standard', 'elimination', 'quickplay', 'championship'];
        const tournamentType = tournamentTypes[t.id % tournamentTypes.length] as 'standard' | 'elimination' | 'quickplay' | 'championship';

        // Generate theme based on ID
        const themes = ['fire', 'water', 'earth', 'air', 'shadow', 'light'];
        const theme = themes[t.id % themes.length] as 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light';

        // Calculate progress based on time elapsed
        const totalDuration = t.endTime - t.startTime;
        const elapsed = Math.min(Date.now()/1000 - t.startTime, totalDuration);
        const progress = Math.floor((elapsed / totalDuration) * 100);

        // Generate rewards based on prize pool
        const rewards = {
          shards: Math.floor(t.prizePool * 100), // 100 shards per MONAD
          cards: Math.floor(t.prizePool / 0.5), // 1 card per 0.5 MONAD
          experience: Math.floor(t.prizePool * 500) // 500 XP per MONAD
        };

        // Generate mock leaderboard
        const leaderboard = Array(5).fill(0).map((_, i) => ({
          playerAddress: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
          wins: Math.floor(Math.random() * 10),
          score: Math.floor(Math.random() * 1000)
        }));

        // If we have a real wallet address, add it to the leaderboard
        if (walletAddress) {
          const playerIndex = Math.floor(Math.random() * 3); // Random position in top 3
          leaderboard[playerIndex] = {
            playerAddress: walletAddress,
            wins: Math.floor(Math.random() * 10) + 5, // Ensure player has good stats
            score: Math.floor(Math.random() * 1000) + 500
          };
        }

        // Sort leaderboard by score
        leaderboard.sort((a, b) => b.score - a.score);

        return {
          ...t,
          participantCount: status.participantCount,
          isVerified: status.isVerified,
          canComplete: status.canComplete,
          winner: status.winner,
          tournamentType,
          theme,
          progress,
          rewards,
          leaderboard
        };
      }));

      setActiveTournaments(enhancedTournaments);

      // If a tournament was selected, update it with the new data
      if (selectedTournament) {
        const updatedTournament = enhancedTournaments.find(t => t.id === selectedTournament.id);
        if (updatedTournament) {
          setSelectedTournament(updatedTournament);
        }
      }
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

      // Success toast with animated confetti effect
      toast.success("Successfully joined tournament!", {
        id: `join-${tournamentId}`,
        description: "You're now competing for rewards!",
        duration: 5000
      });

      // Show reward preview toast
      const tournament = activeTournaments.find(t => t.id === tournamentId);
      if (tournament?.rewards) {
        toast("Tournament Rewards Preview", {
          description: (
            <div className="space-y-2">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-amber-400 mr-2" />
                <span>{tournament.rewards.shards} Shards</span>
              </div>
              <div className="flex items-center">
                <Gift className="h-4 w-4 text-emerald-400 mr-2" />
                <span>{tournament.rewards.cards} Cards</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-blue-400 mr-2" />
                <span>{tournament.rewards.experience} XP</span>
              </div>
            </div>
          ),
          action: {
            label: "View Details",
            onClick: () => setSelectedTournament(tournament)
          },
          duration: 8000
        });
      }

      // Update tournaments list
      loadTournaments();

      // Select the tournament to show details
      const updatedTournament = activeTournaments.find(t => t.id === tournamentId);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }
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
      default:
        return 'from-indigo-600 to-violet-600';
    }
  };

  const getThemeIcon = (theme?: string) => {
    switch (theme) {
      case 'fire':
        return <Zap className="w-4 h-4 text-orange-400" />;
      case 'water':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'earth':
        return <Shield className="w-4 h-4 text-green-400" />;
      case 'air':
        return <Zap className="w-4 h-4 text-sky-400" />;
      case 'shadow':
        return <Sword className="w-4 h-4 text-purple-400" />;
      case 'light':
        return <Star className="w-4 h-4 text-yellow-400" />;
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

        {/* Active Tournaments List */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Active Tournaments</h3>
          <ScrollArea className="h-[300px] rounded-md border border-indigo-500/20 p-4">
            <div className="space-y-4">
              {activeTournaments.length > 0 ? (
                activeTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-black/30 p-4 rounded-lg border border-indigo-500/20 hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">Tournament #{tournament.id}</h4>
                        <p className="text-indigo-400 text-sm">
                          Prize Pool: {tournament.prizePool} MONAD
                        </p>
                        {tournament.winner && (
                          <p className="text-emerald-400 text-sm mt-1">
                            Winner: {tournament.winner.substring(0, 6)}...{tournament.winner.substring(tournament.winner.length - 4)}
                          </p>
                        )}
                      </div>
                      {tournament.canComplete ? (
                        <Button
                          onClick={() => handleEndTournament(tournament.id)}
                          className="bg-gradient-to-r from-amber-600 to-red-600"
                          disabled={!tournament.isVerified}
                        >
                          {tournament.isVerified ? 'Complete Tournament' : 'Waiting for Verification'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleJoinTournament(tournament.id, tournament.entryFee)}
                          className="bg-gradient-to-r from-indigo-600 to-violet-600"
                          disabled={!tournament.active}
                        >
                          {tournament.active ? (
                            <>Join Tournament <ChevronRight className="w-4 h-4 ml-2" /></>
                          ) : (
                            'Tournament Ended'
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        {tournament.participantCount || 0} Players
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.ceil((tournament.endTime - Date.now()/1000)/3600)}h left
                      </div>
                      <div className="text-gray-400">
                        Min Level: {tournament.minLevel}
                      </div>
                      <div className={`flex items-center ${tournament.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tournament.isVerified ? (
                          <>✓ Verified</>
                        ) : (
                          <>⋯ Verifying</>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No active tournaments. Create one to get started!
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentManager;