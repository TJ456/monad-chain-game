
// Copy the original Profile component here with fixed property access
import React from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import GameCard from '@/components/GameCard';
import { Player } from '@/types/game';

interface ProfileProps {
  currentPlayer: Player & { address: string, tokens: number };
}

const ProfileOriginal: React.FC<ProfileProps> = ({ currentPlayer }) => {
  const winRate = currentPlayer.wins + currentPlayer.losses > 0 
    ? ((currentPlayer.wins / (currentPlayer.wins + currentPlayer.losses)) * 100).toFixed(1)
    : "0";
    
  const nextLevelExp = currentPlayer.level * 100;
  const progress = (currentPlayer.experience / nextLevelExp) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="glassmorphism border-mondo-purple/30 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-mondo-purple to-mondo-blue"></div>
              <CardContent className="pt-0">
                <div className="flex justify-center -mt-16">
                  <div className="h-32 w-32 rounded-full border-4 border-background bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <h2 className="text-2xl font-bold text-white">{currentPlayer.username}</h2>
                  <p className="text-gray-400 text-sm">{currentPlayer.address.substring(0, 6)}...{currentPlayer.address.substring(currentPlayer.address.length - 4)}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-400">{currentPlayer.wins}</p>
                    <p className="text-xs text-gray-400">Wins</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{currentPlayer.losses}</p>
                    <p className="text-xs text-gray-400">Losses</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-400">{winRate}%</p>
                    <p className="text-xs text-gray-400">Win Rate</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Level {currentPlayer.level}</span>
                    <span className="text-xs text-gray-400">{currentPlayer.experience}/{nextLevelExp} XP</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-gray-700" />
                </div>
                
                <div className="mt-6 py-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">MONDO Balance</span>
                    <span className="text-lg font-bold text-mondo-cyan">{currentPlayer.tokens}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glassmorphism border-mondo-purple/30 mt-8">
              <CardHeader>
                <CardTitle className="text-white">On-Chain Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPlayer.transactionHistory ? (
                    currentPlayer.transactionHistory.map((tx, index) => (
                      <div key={index} className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-xs text-mondo-purple">{tx.type}</span>
                          <span className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{tx.details}</p>
                        <div className="mt-2">
                          <a href="#" className="text-xs text-mondo-blue hover:underline">
                            {tx.txHash.substring(0, 10)}...
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No transaction history available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="glassmorphism border-mondo-purple/30 h-full">
              <CardHeader>
                <CardTitle className="text-white">My Collection</CardTitle>
                <CardDescription className="text-gray-400">
                  Cards you own on the MONAD blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="cards">
                  <TabsList className="bg-black/40 mb-6">
                    <TabsTrigger value="cards">Cards</TabsTrigger>
                    <TabsTrigger value="stats">Card Stats</TabsTrigger>
                    <TabsTrigger value="history">Battle History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cards">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentPlayer.cards.map(card => (
                        <GameCard key={card.id} card={card} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="space-y-4">
                      <Card className="bg-black/20 border-white/10">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Cards</span>
                              <span className="text-white font-bold">{currentPlayer.cards.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Highest Rarity</span>
                              <span className="text-purple-400 font-bold">Legendary</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Average Card Level</span>
                              <span className="text-white font-bold">2.3</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Collection Value</span>
                              <span className="text-mondo-cyan font-bold">1,245 MONDO</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history">
                    <div className="space-y-4">
                      <div className="bg-black/20 p-4 rounded border border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-green-400 font-bold">Victory</p>
                            <p className="text-sm text-gray-400">vs. BlockchainQueen</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">+50 MONDO</p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 p-4 rounded border border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-red-400 font-bold">Defeat</p>
                            <p className="text-sm text-gray-400">vs. TokenTrader</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">+10 MONDO</p>
                            <p className="text-xs text-gray-500">5 hours ago</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 p-4 rounded border border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-green-400 font-bold">Victory</p>
                            <p className="text-sm text-gray-400">vs. NFTNinja</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">+50 MONDO</p>
                            <p className="text-xs text-gray-500">1 day ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOriginal;
