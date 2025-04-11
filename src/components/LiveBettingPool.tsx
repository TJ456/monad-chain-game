
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LiveMatchData {
  id: string;
  player1: string;
  player2: string;
  player1Health: number;
  player2Health: number;
  timeRemaining: number;
  totalBets: number;
  odds: {
    player1: number;
    player2: number;
  };
}

const LiveBettingPool: React.FC = () => {
  const [matches, setMatches] = useState<LiveMatchData[]>([
    {
      id: "match-1",
      player1: "CryptoKing",
      player2: "BlockchainQueen",
      player1Health: 16,
      player2Health: 12,
      timeRemaining: 180,
      totalBets: 2350,
      odds: {
        player1: 1.75,
        player2: 2.25
      }
    },
    {
      id: "match-2",
      player1: "MONADMaster",
      player2: "TokenTrader",
      player1Health: 20,
      player2Health: 18,
      timeRemaining: 240,
      totalBets: 5120,
      odds: {
        player1: 1.25,
        player2: 3.50
      }
    }
  ]);
  
  const [selectedMatch, setSelectedMatch] = useState<LiveMatchData | null>(null);
  const [betAmount, setBetAmount] = useState("10");
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2 | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Simulate live updates to matches
    const interval = setInterval(() => {
      setMatches(prevMatches => 
        prevMatches.map(match => ({
          ...match,
          timeRemaining: Math.max(0, match.timeRemaining - 10),
          player1Health: match.timeRemaining % 30 === 0 
            ? Math.max(1, match.player1Health - 1) 
            : match.player1Health,
          player2Health: match.timeRemaining % 40 === 0
            ? Math.max(1, match.player2Health - 1)
            : match.player2Health,
          totalBets: match.totalBets + Math.floor(Math.random() * 50),
          odds: {
            player1: match.player1Health > match.player2Health 
              ? Math.max(1.1, match.odds.player1 - 0.05)
              : Math.min(5, match.odds.player1 + 0.05),
            player2: match.player2Health > match.player1Health
              ? Math.max(1.1, match.odds.player2 - 0.05)
              : Math.min(5, match.odds.player2 + 0.05),
          }
        }))
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const placeBet = () => {
    if (!selectedMatch || !selectedPlayer || !betAmount) return;
    
    setIsProcessing(true);
    
    toast.loading("Placing bet on Monad blockchain...", {
      id: "betting-tx"
    });
    
    setTimeout(() => {
      toast.success("Bet placed successfully!", {
        id: "betting-tx",
        description: `${betAmount} MONAD on ${selectedMatch[selectedPlayer === 1 ? 'player1' : 'player2']}`
      });
      
      setIsProcessing(false);
      setSelectedMatch(null);
      setSelectedPlayer(null);
      setBetAmount("10");
    }, 1500);
  };
  
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="glassmorphism border-cyan-500/30 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-10 w-10 rounded-full bg-cyan-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Live Betting Pool</h3>
          <p className="text-gray-400">Wager MONAD tokens on real-time matches</p>
        </div>
      </div>
      
      {!selectedMatch ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 mb-2">
            Live Matches - Updated in real-time via Monad blockchain
          </div>
          
          {matches.map(match => (
            <div 
              key={match.id}
              className="bg-black/30 p-4 rounded-lg border border-cyan-500/20 cursor-pointer hover:border-cyan-500/50 transition-colors"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="text-white font-medium">{match.player1}</div>
                    <div className="text-gray-500">vs</div>
                    <div className="text-white font-medium">{match.player2}</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-white">{match.player1Health}/20</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">vs</div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-white">{match.player2Health}/20</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-cyan-400 font-medium">{formatTimeRemaining(match.timeRemaining)}</div>
                  <div className="text-xs text-gray-400 mt-1">{match.totalBets.toLocaleString()} MONAD bet</div>
                </div>
              </div>
              
              <div className="flex justify-between mt-3">
                <div className="text-xs">
                  <span className="text-gray-400">Odds: </span>
                  <span className="text-cyan-400 font-mono">{match.odds.player1.toFixed(2)}x</span>
                </div>
                
                <div className="text-xs">
                  <span className="text-gray-400">Odds: </span>
                  <span className="text-cyan-400 font-mono">{match.odds.player2.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white p-0"
              onClick={() => setSelectedMatch(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Button>
            
            <div className="text-cyan-400 font-medium">
              {formatTimeRemaining(selectedMatch.timeRemaining)}
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg border border-cyan-500/20">
            <div className="flex justify-between mb-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-1"></div>
                <div className="text-white font-medium">{selectedMatch.player1}</div>
                <div className="flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white">{selectedMatch.player1Health}/20</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl text-gray-600">VS</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-1"></div>
                <div className="text-white font-medium">{selectedMatch.player2}</div>
                <div className="flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white">{selectedMatch.player2Health}/20</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button
                variant={selectedPlayer === 1 ? "default" : "outline"}
                className={selectedPlayer === 1 ? "bg-cyan-600 text-white" : "border-cyan-500/50 text-cyan-400"}
                onClick={() => setSelectedPlayer(1)}
              >
                {selectedMatch.player1} ({selectedMatch.odds.player1.toFixed(2)}x)
              </Button>
              
              <Button
                variant={selectedPlayer === 2 ? "default" : "outline"}
                className={selectedPlayer === 2 ? "bg-purple-600 text-white" : "border-purple-500/50 text-purple-400"}
                onClick={() => setSelectedPlayer(2)}
              >
                {selectedMatch.player2} ({selectedMatch.odds.player2.toFixed(2)}x)
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Bet Amount (MONAD)</label>
              <div className="text-xs text-gray-500">
                Potential Win: 
                <span className="text-cyan-400 ml-1 font-mono">
                  {selectedPlayer ? (parseFloat(betAmount) * selectedMatch.odds[selectedPlayer === 1 ? 'player1' : 'player2']).toFixed(2) : '0'} MONAD
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-black/20 border-cyan-500/30 text-white"
              />
              
              <Button
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
                disabled={!selectedPlayer || isProcessing}
                onClick={placeBet}
              >
                {isProcessing ? "Processing..." : "Place Bet"}
              </Button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            Powered by Monad's sub-second finality for real-time betting
          </div>
        </div>
      )}
    </Card>
  );
};

export default LiveBettingPool;
