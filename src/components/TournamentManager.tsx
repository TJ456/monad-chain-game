import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { monadGameService } from '@/services/MonadGameService';
import { Trophy, Users, Clock, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const TournamentManager: React.FC = () => {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTournament, setNewTournament] = useState({
    entryFee: 0.1,
    duration: 24,
    minLevel: 1
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTournaments();
    
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
      const enhancedTournaments = await Promise.all(tournaments.map(async (t) => {
        const status = await monadGameService.getTournamentStatus(t.id);
        return {
          ...t,
          participantCount: status.participantCount,
          isVerified: status.isVerified,
          canComplete: status.canComplete,
          winner: status.winner
        };
      }));
      setActiveTournaments(enhancedTournaments);
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
      await monadGameService.joinTournament(tournamentId);
      toast.success("Successfully joined tournament!");
      loadTournaments();
    } catch (error) {
      console.error("Failed to join tournament:", error);
      toast.error("Failed to join tournament");
    }
  };

  const handleEndTournament = async (tournamentId: number) => {
    try {
      const status = await monadGameService.getTournamentStatus(tournamentId);
      if (!status.isVerified) {
        toast.error("Cannot end tournament - some games are not verified");
        return;
      }

      await monadGameService.endTournament(tournamentId);
      toast.success("Tournament completed successfully!");
      loadTournaments();
    } catch (error) {
      console.error("Failed to end tournament:", error);
      toast.error("Failed to end tournament");
    }
  };

  return (
    <Card className="glassmorphism border-indigo-500/30">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-indigo-400" />
          Monad Tournaments
        </CardTitle>
        <CardDescription>
          Compete in blockchain-verified tournaments for MONAD rewards
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