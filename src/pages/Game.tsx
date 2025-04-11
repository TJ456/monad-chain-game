import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card } from "@/components/ui/card";
import GameCard from '@/components/GameCard';
import MonadStatus from '@/components/MonadStatus';
import ShardManager from '@/components/ShardManager';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toast } from "sonner";
import { cards, currentPlayer, monadGameState } from '@/data/gameData';
import { Card as GameCardType, MonadGameMove, CardType, AIDifficultyTier, TierRequirement, Player as PlayerType } from '@/types/game';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Game = () => {
  const { toast: uiToast } = useToast();
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [opponentCards, setOpponentCards] = useState<GameCardType[]>(
    cards.filter(card => !currentPlayer.cards.includes(card)).slice(0, 3)
  );
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'end'>('waiting');
  const [playerMana, setPlayerMana] = useState(10);
  const [opponentMana, setOpponentMana] = useState(10);
  const [playerHealth, setPlayerHealth] = useState(20);
  const [opponentHealth, setOpponentHealth] = useState(20);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [pendingMoves, setPendingMoves] = useState<MonadGameMove[]>([]);
  const [isOnChain, setIsOnChain] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
  const [fatigueDamage, setFatigueDamage] = useState(1);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [playerData, setPlayerData] = useState<PlayerType>({
    ...currentPlayer,
    shards: 5,
    dailyTrialsRemaining: 3
  });
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficultyTier>(AIDifficultyTier.NOVICE);

  useEffect(() => {
    setIsOnChain(monadGameState.isOnChain && monadGameState.networkStatus === 'connected');
  }, []);

  const getPlayableCards = useCallback((cards: GameCardType[], mana: number) => {
    return cards.filter(card => card.mana <= mana);
  }, []);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    if (currentTurn === 'player') {
      const playableCards = getPlayableCards(playerDeck, playerMana);
      if (playableCards.length === 0 && playerDeck.length > 0) {
        handleNoPlayableCards('player', 'No playable cards available. Turn passed to opponent.');
      } else if (playerDeck.length === 0) {
        handleFatigue('player');
      }
    }
  }, [currentTurn, playerDeck, playerMana, gameStatus, getPlayableCards]);

  const startGame = () => {
    resetGame();
    setGameStatus('playing');
    setCurrentTurn('player');
    setBattleLog(['Battle has begun on the MONAD blockchain! Your turn.']);
    
    uiToast({
      title: "Game Started",
      description: "The battle has begun! Play your first card.",
    });
    
    toast.success("Connected to MONAD blockchain", {
      description: `Current block: ${monadGameState.currentBlockHeight}`,
      duration: 3000,
    });
  };

  const endTurn = useCallback((nextPlayer: 'player' | 'opponent') => {
    setCurrentTurn(nextPlayer);
    
    if (nextPlayer === 'player') {
      setPlayerMana(prev => Math.min(10, prev + 1));
    } else {
      setOpponentMana(prev => Math.min(10, prev + 1));
    }

    setSelectedCard(null);
  }, []);

  const handleNoPlayableCards = (player: 'player' | 'opponent', message: string) => {
    const newLogs = [...battleLog, message];
    setBattleLog(newLogs);
    
    if (player === 'player') {
      endTurn('opponent');
      handleOpponentTurn();
    } else {
      endTurn('player');
    }
  };

  const handleFatigue = (target: 'player' | 'opponent') => {
    const damage = fatigueDamage;
    const message = `${target === 'player' ? 'You take' : 'Opponent takes'} ${damage} fatigue damage.`;
    
    if (target === 'player') {
      setPlayerHealth(prev => Math.max(0, prev - damage));
      if (playerHealth - damage <= 0) {
        endGame(false);
        return;
      }
    } else {
      setOpponentHealth(prev => Math.max(0, prev - damage));
      if (opponentHealth - damage <= 0) {
        endGame(true);
        return;
      }
    }

    setBattleLog(prev => [...prev, message]);
    setFatigueDamage(prev => prev + 1);
    setConsecutiveSkips(prev => prev + 1);

    if (consecutiveSkips >= 1) {
      endGame(null);
      return;
    }

    endTurn(target === 'player' ? 'opponent' : 'player');
    
    if (target === 'player') {
      setTimeout(handleOpponentTurn, 1000);
    }
  };

  const handleOpponentTurn = useCallback(() => {
    if (gameStatus !== 'playing') return;

    const playableCards = getPlayableCards(opponentCards, opponentMana);

    if (playableCards.length > 0) {
      const shouldDefend = opponentHealth < 10;
      const preferredCards = shouldDefend 
        ? playableCards.filter(c => c.defense > 0)
        : playableCards.filter(c => c.attack > 0);

      const cardToPlay = preferredCards.length > 0 
        ? preferredCards[Math.floor(Math.random() * preferredCards.length)]
        : playableCards[0];

      setOpponentMana(prev => prev - cardToPlay.mana);
      setOpponentCards(prev => prev.filter(c => c.id !== cardToPlay.id));

      let logEntry = `Opponent played ${cardToPlay.name}.`;
      let newPlayerHealth = playerHealth;
      let newOpponentHealth = opponentHealth;

      if (cardToPlay.attack) {
        newPlayerHealth = Math.max(0, playerHealth - cardToPlay.attack);
        logEntry += ` Dealt ${cardToPlay.attack} damage.`;
      }

      if (cardToPlay.defense) {
        newOpponentHealth = Math.min(30, opponentHealth + cardToPlay.defense);
        logEntry += ` Gained ${cardToPlay.defense} health.`;
      }

      setPlayerHealth(newPlayerHealth);
      setOpponentHealth(newOpponentHealth);
      setBattleLog(prev => [...prev, logEntry]);

      if (newPlayerHealth <= 0) {
        endGame(false);
        return;
      }

      endTurn('player');

      const playerCanPlay = getPlayableCards(playerDeck, playerMana + 1).length > 0;
      if (!playerCanPlay) {
        if (playerDeck.length === 0) {
          setTimeout(() => handleFatigue('player'), 1000);
        } else {
          setTimeout(() => {
            setBattleLog(prev => [...prev, "No playable cards - turn passed."]);
            endTurn('opponent');
            setTimeout(handleOpponentTurn, 1000);
          }, 1000);
        }
      }

    } else if (opponentCards.length === 0) {
      handleFatigue('opponent');
    } else {
      setBattleLog(prev => [...prev, "Opponent passes (no playable cards)"]);
      endTurn('player');
    }
  }, [gameStatus, opponentCards, opponentMana, playerDeck, playerMana, opponentHealth, playerHealth, endTurn, getPlayableCards]);

  const playCard = (card: GameCardType) => {
    if (gameStatus !== 'playing' || currentTurn !== 'player') {
      toast.warning("Not your turn!");
      return;
    }

    if (playerMana < card.mana) {
      toast.warning(`Not enough mana (Need ${card.mana}, have ${playerMana})`);
      return;
    }

    const newMove: MonadGameMove = {
      moveId: `move-${Date.now()}`,
      playerAddress: currentPlayer.monadAddress,
      cardId: card.id,
      moveType: card.type.toLowerCase() as 'attack' | 'defend' | 'special',
      timestamp: Date.now(),
      verified: false
    };

    setPlayerMana(prev => prev - card.mana);
    setPlayerDeck(prev => prev.filter(c => c.id !== card.id));
    setSelectedCard(card);

    let logEntry = `You played ${card.name}.`;
    let opponentNewHealth = opponentHealth;
    let playerNewHealth = playerHealth;

    if (card.attack) {
      opponentNewHealth = Math.max(0, opponentHealth - card.attack);
      logEntry += ` Dealt ${card.attack} damage.`;
    }

    if (card.defense) {
      playerNewHealth = Math.min(30, playerHealth + card.defense);
      logEntry += ` Gained ${card.defense} health.`;
    }

    if (card.specialEffect) {
      logEntry += ` ${card.specialEffect.description}`;
      // Implement special effects logic here
    }

    setOpponentHealth(opponentNewHealth);
    setPlayerHealth(playerNewHealth);
    setBattleLog(prev => [...prev, logEntry]);
    setPendingMoves(prev => [...prev, newMove]);
    
    toast.loading("Submitting move to MONAD blockchain...", {
      id: newMove.moveId,
      duration: 2000,
    });

    setTimeout(() => {
      setPendingMoves(prev => 
        prev.map(m => m.moveId === newMove.moveId ? { 
          ...m, 
          verified: true,
          onChainSignature: `0x${Math.random().toString(16).slice(2, 10)}` 
        } : m)
      );
      
      toast.success("Move confirmed on-chain", {
        id: newMove.moveId,
        description: `Block: ${monadGameState.currentBlockHeight! + 1}`,
      });

      if (opponentNewHealth <= 0) {
        endGame(true);
        return;
      }

      endTurn('opponent');
      setTimeout(handleOpponentTurn, 1000);
    }, isOnChain ? 2000 : 500);
  };

  const getShardReward = () => {
    switch (aiDifficulty) {
      case AIDifficultyTier.NOVICE:
        return 1;
      case AIDifficultyTier.VETERAN:
        return 3;
      case AIDifficultyTier.LEGEND:
        return 5;
      default:
        return 1;
    }
  };

  const handleShardRedemption = () => {
    setPlayerData(prev => ({
      ...prev,
      shards: prev.shards - 10,
      dailyTrialsRemaining: prev.dailyTrialsRemaining - 1,
      lastTrialTime: Date.now()
    }));

    const newCardIndex = Math.floor(Math.random() * cards.length);
    const newCard = cards[newCardIndex];
    
    setPlayerDeck(prev => [...prev, newCard]);
    
    setBattleLog(prev => [
      ...prev, 
      `You redeemed 10 shards and received a new ${newCard.rarity} card: ${newCard.name}!`
    ]);
  };

  const endGame = (playerWon: boolean | null) => {
    setGameStatus('end');
    
    toast.loading("Recording game result on MONAD blockchain...", { 
      id: "game-result",
      duration: 3000,
    });
    
    setTimeout(() => {
      toast.success("Game result recorded on-chain", {
        id: "game-result",
        description: `Block: ${monadGameState.currentBlockHeight! + 2}`,
      });
      
      let resultMessage = "";
      if (playerWon === true) {
        const shardReward = getShardReward();
        setPlayerData(prev => ({
          ...prev,
          shards: prev.shards + shardReward,
          wins: prev.wins + 1
        }));
        
        resultMessage = `Victory! You've won the battle. ${shardReward} Shards awarded and recorded on-chain.`;
        uiToast({
          title: "Victory!",
          description: `You've won the battle and earned ${shardReward} Shards!`,
        });
      } else if (playerWon === false) {
        setPlayerData(prev => ({
          ...prev,
          losses: prev.losses + 1
        }));
        
        resultMessage = "Defeat! Better luck next time. Battle result recorded on MONAD blockchain.";
        uiToast({
          title: "Defeat!",
          description: "You've lost the battle. Try again with a different strategy.",
          variant: "destructive",
        });
      } else {
        resultMessage = "Draw! Both players exhausted. The game ends in a tie.";
        uiToast({
          title: "Draw!",
          description: "The game ended in a tie. No winner declared.",
        });
      }
      
      setBattleLog(prev => [...prev, resultMessage]);
    }, 3000);
  };

  const resetGame = () => {
    setPlayerDeck(currentPlayer.cards);
    setOpponentCards(cards.filter(card => !currentPlayer.cards.includes(card)).slice(0, 3));
    setSelectedCard(null);
    setGameStatus('waiting');
    setPlayerMana(10);
    setOpponentMana(10);
    setPlayerHealth(20);
    setOpponentHealth(20);
    setBattleLog([]);
    setPendingMoves([]);
    setCurrentTurn('player');
    setFatigueDamage(1);
    setConsecutiveSkips(0);
  };

  const calculateWinRate = () => {
    const totalGames = playerData.wins + playerData.losses;
    if (totalGames === 0) return 0;
    return playerData.wins / totalGames;
  };

  useEffect(() => {
    const winRate = calculateWinRate();
    
    if (winRate >= 0.8) {
      setAiDifficulty(AIDifficultyTier.LEGEND);
    } else if (winRate >= 0.65) {
      setAiDifficulty(AIDifficultyTier.VETERAN);
    } else {
      setAiDifficulty(AIDifficultyTier.NOVICE);
    }
  }, [playerData.wins, playerData.losses]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        <h1 className="text-4xl font-bold text-white mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            MONAD Chain Battle
          </span>
          {isOnChain && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              On-Chain
            </span>
          )}
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="glassmorphism border-emerald-500/30 h-[600px] flex flex-col">
              {gameStatus === 'waiting' ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Ready to Battle on MONAD?</h2>
                  <p className="text-gray-300 mb-8 text-center max-w-md">
                    Challenge an opponent on the MONAD blockchain. All game moves are recorded as on-chain transactions, giving you true ownership of your battle history and rewards.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                    onClick={startGame}
                  >
                    <span className="mr-2">Start On-Chain Battle</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col h-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-lg font-bold text-white">Opponent</div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <div className="text-red-400 font-bold">{opponentHealth} / 20</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Mana</div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <div className="text-blue-400 font-bold">{opponentMana} / 10</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-8">
                    {opponentCards.map(card => (
                      <div key={card.id} className="transform hover:-translate-y-2 transition-transform">
                        <Card className="w-20 h-28 bg-gray-800 border-gray-700">
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex-1 relative bg-black/30 rounded-lg mb-8 border border-emerald-500/30 flex items-center justify-center">
                    {selectedCard ? (
                      <div className="animate-float">
                        <GameCard card={selectedCard} className="scale-110" />
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-lg text-gray-400 mb-2">MONAD Blockchain Battle Arena</div>
                        <div className="text-sm text-gray-500">Select a card to play - moves are recorded on-chain</div>
                      </div>
                    )}
                    
                    {pendingMoves.length > 0 && pendingMoves.some(move => !move.verified) && (
                      <div className="absolute top-4 right-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-emerald-900/50 px-3 py-1 rounded-full flex items-center">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-xs text-emerald-400">Pending</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/80 border-emerald-500/50">
                              <p className="text-xs text-emerald-400">Transaction being processed on MONAD blockchain</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-4">
                    {playerDeck.map(card => (
                      <div key={card.id} className="transform hover:-translate-y-2 transition-transform">
                        <div onClick={() => gameStatus === 'playing' && playCard(card)}>
                          <GameCard card={card} className="w-20 h-28" showDetails={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-white flex items-center">
                        You
                        <span className="ml-2 text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                          {currentPlayer.monadAddress.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <div className="text-red-400 font-bold">{playerHealth} / 20</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Mana</div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <div className="text-blue-400 font-bold">{playerMana} / 10</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          <div className="space-y-8">
            <MonadStatus />
            
            {gameStatus === 'end' && (
              <ShardManager 
                player={playerData} 
                onRedeemShards={handleShardRedemption} 
              />
            )}
            
            <Card className="glassmorphism border-emerald-500/30 h-[320px] flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Battle Log</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {battleLog.length > 0 ? (
                  <div className="space-y-2">
                    {battleLog.map((log, index) => (
                      <div 
                        key={index} 
                        className="text-sm text-gray-300 p-2 rounded bg-black/20 border border-white/5"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Battle events will appear here
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/10">
                {gameStatus === 'end' && (
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                    onClick={resetGame}
                  >
                    Play Again
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
