
// Copy the original Leaderboard component here with fixed property access
import React from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Player } from '@/types/game';

interface LeaderboardProps {
  players: (Player & { tokens: number })[];
}

const LeaderboardOriginal: React.FC<LeaderboardProps> = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => b.wins - a.wins);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto pt-24 px-4 pb-16">
        <h1 className="text-4xl font-bold text-white mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-mondo-purple to-mondo-blue">
            Leaderboard
          </span>
        </h1>
        
        <Card className="glassmorphism border-mondo-purple/30">
          <CardHeader>
            <CardTitle className="text-white">Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-mondo-blue">Rank</TableHead>
                  <TableHead className="text-mondo-blue">Player</TableHead>
                  <TableHead className="text-mondo-blue">Level</TableHead>
                  <TableHead className="text-mondo-blue">Wins</TableHead>
                  <TableHead className="text-mondo-blue">Losses</TableHead>
                  <TableHead className="text-mondo-blue">Win Rate</TableHead>
                  <TableHead className="text-right text-mondo-blue">MONDO Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player, index) => {
                  const winRate = player.wins + player.losses > 0 
                    ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) 
                    : "0";
                    
                  return (
                    <TableRow key={player.id} className="border-b border-white/10">
                      <TableCell className="font-medium">
                        {index === 0 && <span className="text-yellow-500">🏆</span>}
                        {index === 1 && <span className="text-gray-300">🥈</span>}
                        {index === 2 && <span className="text-amber-600">🥉</span>}
                        {index > 2 && <span>{index + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mondo-purple to-mondo-blue mr-2"></div>
                          <span className="text-white">{player.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="bg-mondo-purple/20 text-mondo-purple px-2 py-1 rounded-full text-xs">
                          Lvl {player.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-green-400">{player.wins}</TableCell>
                      <TableCell className="text-red-400">{player.losses}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className="bg-gradient-to-r from-mondo-purple to-mondo-blue h-2 rounded-full" 
                              style={{ width: `${winRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-300">{winRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-mondo-cyan font-mono">
                        {player.tokens}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardOriginal;
