import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card as UICard } from "@/components/ui/card";
import GameCard from '@/components/GameCard';
import MonadStatus from '@/components/MonadStatus';
import MonadDbStatus from '@/components/MonadDbStatus';
import { ConsensusStatus } from '@/components/ConsensusStatus';
import ShardManager from '@/components/ShardManager';
import MonadBoostMechanic from '@/components/MonadBoostMechanic';
import GameRoomSelector from '@/components/GameRoomSelector';
import GameModeMenu from '@/components/GameModeMenu';
import GameRoomManager from '@/components/GameRoomManager';
import TurnTimer from '@/components/TurnTimer';
import GameSyncStatus from '@/components/GameSyncStatus';
import TransactionConfirmation from '@/components/TransactionConfirmation';
import GameTransactionOverlay from '@/components/GameTransactionOverlay';
import PlayerInventory from '@/components/PlayerInventory';
import BlockchainTransactionInfo, { Transaction } from '@/components/BlockchainTransactionInfo';
import TransactionLoader from '@/components/TransactionLoader';
import ManaMeter from '@/components/ui/mana-meter';
import ManaCost from '@/components/ui/mana-cost';
import ManaEffect from '@/components/ui/mana-effect';
import ManaGuide from '@/components/ManaGuide';
import WebSocketService, { WebSocketMessageType } from '@/services/WebSocketService';
import GameSyncService, { GameState, ConflictResolutionStrategy } from '@/services/GameSyncService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toast } from "sonner";
import { cards, currentPlayer, monadGameState } from '@/data/gameData';
import { Card as GameCardType, MonadGameMove, CardType, AIDifficultyTier, TierRequirement, Player as PlayerType, MovesBatch, GameMode, GameRoom } from '@/types/game';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Shield, Sword, Zap, ExternalLink, Database, WifiOff } from 'lucide-react';
import { aiStrategies, selectCardNovice, selectCardVeteran, selectCardLegend, getAIThinkingMessage, enhanceAICards } from '@/data/aiStrategies';
import { monadGameService } from '@/services/MonadGameService';
import { monadDbIntegration } from '@/services/MonadDbIntegration';
import { getTransactionExplorerUrl } from '@/utils/blockchain';
import OnChainMoves from '@/components/OnChainMoves';

const STORAGE_KEY_SHARDS = "monad_game_shards";
const STORAGE_KEY_LAST_REDEMPTION = "monad_game_last_redemption";
const STORAGE_KEY_DAILY_TRIALS = "monad_game_daily_trials";
const STORAGE_KEY_PLAYER_CARDS = "monad_game_player_cards";

const Game = () => {
  const { toast: uiToast } = useToast();
  const [playerDeck, setPlayerDeck] = useState<GameCardType[]>(currentPlayer.cards);
  const [opponentCards, setOpponentCards] = useState<GameCardType[]>([]);
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameStatus, setGameStatus] = useState<'mode_select' | 'room_select' | 'gameroom' | 'inventory' | 'waiting' | 'playing' | 'end'>('mode_select');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);

  // WebSocket and sync state
  const [wsConnected, setWsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTransactionConfirmation, setShowTransactionConfirmation] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    timestamp: number;
  } | null>(null);
  const [playerMana, setPlayerMana] = useState(10);
  const [opponentMana, setOpponentMana] = useState(10);
  const [showManaEffect, setShowManaEffect] = useState(false);
  const [manaEffectAmount, setManaEffectAmount] = useState(0);
  const [manaEffectPosition, setManaEffectPosition] = useState({ x: 0, y: 0 });
  const [showManaGuide, setShowManaGuide] = useState(false);
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
    shards: 0,
    dailyTrialsRemaining: 3,
    lastTrialTime: 0
  });
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficultyTier>(AIDifficultyTier.NOVICE);
  const [playerMonadBalance, setPlayerMonadBalance] = useState(1000);
  const [boostActive, setBoostActive] = useState(false);
  const [boostDetails, setBoostDetails] = useState<{
    effect: number,
    remainingTurns: number,
    stakedAmount?: number,
    powerBoost?: number,
    efficiency?: number,
    affectedCards?: string[]
  } | null>(null);
  const [allPlayerCards, setAllPlayerCards] = useState<GameCardType[]>(currentPlayer.cards);
  const [isOpponentStunned, setIsOpponentStunned] = useState(false);
  const [turnTimeExpired, setTurnTimeExpired] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [playerLastCards, setPlayerLastCards] = useState<GameCardType[]>([]);
  const [consecutiveDefenseCount, setConsecutiveDefenseCount] = useState(0);
  const [player, setPlayer] = useState({
    transactionHistory: []
  });
  const [aiComboCounter, setAiComboCounter] = useState(0);
  const [isPlayerStunned, setPlayerStunned] = useState(false);
  const [showOnChainMoves, setShowOnChainMoves] = useState(false);
  const [showMonadDbStatus, setShowMonadDbStatus] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Blockchain transaction tracking
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<{
    txHash: string;
    description: string;
    blockNumber?: number;
  } | null>(null);
  const [blockchainStats, setBlockchainStats] = useState({
    currentBlockHeight: monadGameState.currentBlockHeight || 0,
    networkName: import.meta.env.VITE_NETWORK_NAME || 'Monad Testnet'
  });

  useEffect(() => {
    const savedShards = localStorage.getItem(STORAGE_KEY_SHARDS);
    const parsedShards = savedShards ? parseInt(savedShards, 10) : 0;

    const savedLastRedemption = localStorage.getItem(STORAGE_KEY_LAST_REDEMPTION);
    const parsedLastRedemption = savedLastRedemption ? parseInt(savedLastRedemption, 10) : 0;

    const savedDailyTrials = localStorage.getItem(STORAGE_KEY_DAILY_TRIALS);
    const parsedDailyTrials = savedDailyTrials ? parseInt(savedDailyTrials, 10) : 3;

    const savedPlayerCards = localStorage.getItem(STORAGE_KEY_PLAYER_CARDS);
    const parsedPlayerCards = savedPlayerCards ? JSON.parse(savedPlayerCards) : currentPlayer.cards;

    const isNewDay = new Date(parsedLastRedemption).getDate() !== new Date().getDate() ||
                     new Date(parsedLastRedemption).getMonth() !== new Date().getMonth() ||
                     new Date(parsedLastRedemption).getFullYear() !== new Date().getFullYear();

    const dailyTrialsToSet = isNewDay ? 3 : parsedDailyTrials;

    setPlayerData(prev => ({
      ...prev,
      shards: parsedShards,
      lastTrialTime: parsedLastRedemption,
      dailyTrialsRemaining: dailyTrialsToSet
    }));

    setAllPlayerCards(parsedPlayerCards);

    setIsOnChain(monadGameState.isOnChain && monadGameState.networkStatus === 'connected');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHARDS, playerData.shards.toString());
    if (playerData.lastTrialTime) {
      localStorage.setItem(STORAGE_KEY_LAST_REDEMPTION, playerData.lastTrialTime.toString());
    }
    localStorage.setItem(STORAGE_KEY_DAILY_TRIALS, playerData.dailyTrialsRemaining.toString());
  }, [playerData.shards, playerData.lastTrialTime, playerData.dailyTrialsRemaining]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYER_CARDS, JSON.stringify(allPlayerCards));
  }, [allPlayerCards]);

  useEffect(() => {
    // Monitor WebSocket connection status
    const wsService = WebSocketService.getInstance();
    wsService.addConnectionStatusListener(setIsConnected);

    return () => {
      wsService.removeConnectionStatusListener(setIsConnected);
    };
  }, []);

  // Always assume battle consensus is ready to simplify the code
  const isBattleConsensusReady = true;

  useEffect(() => {
    const initializeBlockchain = async () => {
      // Initialize MonadDb integration
      try {
        await monadDbIntegration.initialize();
        console.log('MonadDb integration initialized');

        // Create simple initial game events
        const initialEvents = [
          {
            type: 'game_session_start',
            timestamp: Date.now(),
            player: 'system',
            id: `game-event-${Date.now()}`
          }
        ];
        localStorage.setItem('monad:game:events', JSON.stringify(initialEvents));
      } catch (error) {
        console.error('Error initializing MonadDb:', error);
      }

      // Add listener for copied cards
      monadGameService.addCardCopiedListener((copiedCard) => {
        console.log('Card copied event received:', copiedCard);

        // Add the copied card to the player's deck
        setPlayerDeck(prevDeck => [...prevDeck, copiedCard]);

        // Show a toast notification
        toast.success(
          <div className="flex items-center">
            <span className="mr-2">Card Copied Successfully!</span>
            <span className="text-purple-400 animate-pulse">⚡</span>
          </div>,
          {
            description: `You've copied ${copiedCard.name} from your opponent using Blockchain Hack!`,
            duration: 5000,
          }
        );

        // Add to battle log
        setBattleLog(prev => [...prev, `🔮 Blockchain Hack successful! Copied ${copiedCard.name} from opponent's wallet.`]);
      });
        try {
            // Connect wallet
            const address = await monadGameService.connectWallet();
            setWalletAddress(address);
            setWalletConnected(true);

            // Check if player is already registered in localStorage first
            const storedRegistration = localStorage.getItem(`monad-player-registered-${address}`);
            if (storedRegistration === 'true') {
                console.log('Player registration found in localStorage');
                setIsRegistered(true);
            } else {
                // If not in localStorage, check with the service
                try {
                    const playerData = await monadGameService.getPlayerData(address);
                    // If we get here without an error, the player is registered
                    console.log('Player data retrieved:', playerData);
                    setIsRegistered(true);
                    // Store registration status in localStorage for future reference
                    localStorage.setItem(`monad-player-registered-${address}`, 'true');
                } catch (error) {
                    console.log('Player not registered yet:', error);
                    // For development purposes, we'll auto-register the player
                    // This makes testing easier
                    if (process.env.NODE_ENV === 'development') {
                        try {
                            console.log('Auto-registering player in development mode');
                            await monadGameService.registerPlayer();
                            setIsRegistered(true);
                        } catch (regError) {
                            console.error('Auto-registration failed:', regError);
                            // Continue without registration
                        }
                    } else {
                        setIsRegistered(false);
                    }
                }
            }

            // Initialize WebSocket connection
            const wsService = WebSocketService.getInstance();
            const syncService = GameSyncService.getInstance();

            // Set up WebSocket connection listeners
            wsService.addConnectionStatusListener((connected) => {
              setWsConnected(connected);
              if (connected) {
                toast.success("Connected to game server", {
                  description: "Real-time updates enabled"
                });
              } else {
                toast.error("Disconnected from game server", {
                  description: "Attempting to reconnect..."
                });
              }
            });

            // Set up sync status listeners
            syncService.addSyncStatusListener((syncing) => {
              setIsSyncing(syncing);
            });

            // Set up transaction update listeners
            syncService.addTransactionUpdateListener((update) => {
              setTransactionDetails({
                hash: update.transactionHash,
                status: update.status,
                blockNumber: update.blockNumber,
                timestamp: update.timestamp
              });

              if (update.status === 'confirmed') {
                setShowTransactionConfirmation(true);
                // Auto-hide after 5 seconds
                setTimeout(() => setShowTransactionConfirmation(false), 5000);
              }
            });

            // Connect to WebSocket server
            wsService.connect(address || 'anonymous');
        } catch (error) {
            console.error("Blockchain initialization error:", error);
            toast.error("Failed to connect to blockchain");
        }
    };

    initializeBlockchain();

    // Clean up on unmount
    return () => {
      const wsService = WebSocketService.getInstance();
      wsService.disconnect();

      // Remove card copied listener
      monadGameService.removeCardCopiedListener(() => {
        console.log('Removing card copied listener');
      });
    };
  }, []);

  const getPlayableCards = useCallback((cards: GameCardType[], mana: number) => {
    return cards.filter(card => card.mana <= mana);
  }, []);

  const handleSelectGameMode = (mode: GameMode) => {
    setGameMode(mode);

    if (mode === GameMode.PRACTICE) {
      setGameStatus('room_select');
      toast.success("Practice Mode Selected", {
        description: "Choose a difficulty level to practice against AI"
      });
    } else if (mode === GameMode.GAMEROOM) {
      setGameStatus('gameroom');
      toast.success("Game Room Mode Selected", {
        description: "Create or join a room to play against a friend"
      });
    }
  };

  // Room creation is handled by the GameRoomManager component

  const handleGameRoomStart = () => {
    // When a game starts in game room mode
    resetGame();
    setGameStatus('playing');
    setCurrentTurn('player');
    setBattleLog(['1v1 Battle has begun on the MONAD blockchain! Your turn.']);

    toast.success("Game Started", {
      description: "The 1v1 battle has begun! Play your first card."
    });
  };

  const backToModeSelection = () => {
    setGameStatus('mode_select');
    setGameMode(null);
    setCurrentRoom(null);
    setOpponentCards([]);
  };

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

  const handleSelectDifficulty = (difficulty: AIDifficultyTier) => {
    setAiDifficulty(difficulty);

    let opponentCardPool: GameCardType[];

    // Filter cards based on difficulty
    switch (difficulty) {
      case AIDifficultyTier.NOVICE:
        // Novice only gets common and rare cards
        opponentCardPool = cards.filter(card => card.rarity !== 'epic' && card.rarity !== 'legendary');
        break;

      case AIDifficultyTier.VETERAN:
        // Veteran gets everything except legendary cards
        opponentCardPool = cards.filter(card => card.rarity !== 'legendary');
        break;

      case AIDifficultyTier.LEGEND:
        // Legend gets all cards
        opponentCardPool = [...cards];
        break;

      default:
        opponentCardPool = [...cards];
    }

    // Apply difficulty-specific enhancements to the cards
    opponentCardPool = enhanceAICards(opponentCardPool, difficulty);

    const randomCards: GameCardType[] = [];
    while (randomCards.length < 3 && opponentCardPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * opponentCardPool.length);
      randomCards.push(opponentCardPool[randomIndex]);
      opponentCardPool.splice(randomIndex, 1);
    }

    setOpponentCards(randomCards);

    // Instead of going to waiting screen, go to inventory for card selection
    setGameStatus('inventory');

    let difficultyName = '';
    let description = '';

    switch (difficulty) {
      case AIDifficultyTier.NOVICE:
        difficultyName = 'Novice';
        description = 'Perfect for beginners. Learn the basics of Monad battles.';
        break;
      case AIDifficultyTier.VETERAN:
        difficultyName = 'Veteran';
        description = 'For experienced players. Face smarter opponents.';
        break;
      case AIDifficultyTier.LEGEND:
        difficultyName = 'Legend';
        description = 'For masters only. Face the ultimate challenge.';
        break;
    }

    toast.success(`Entered ${difficultyName} Room`, {
      description: `${description} Select your cards to begin.`
    });
  };

  const openInventory = () => {
    setGameStatus('inventory');
  };

  const closeInventory = () => {
    // If we came from room selection, go back to room selection
    if (opponentCards.length === 0) {
      setGameStatus('room_select');
    } else {
      // Otherwise go to waiting screen
      setGameStatus('waiting');
    }
  };

  const handleCardSelection = (selectedCards: GameCardType[]) => {
    setPlayerDeck(selectedCards);
    setGameStatus('waiting');

    toast.success("Deck Selected", {
      description: `You've selected ${selectedCards.length} cards for battle.`
    });
  };

  const startGame = () => {
    resetGame();
    setGameStatus('playing');
    setCurrentTurn('player');
    setBattleLog(['Battle has begun on the MONAD blockchain! Your turn.']);

    if (gameMode === GameMode.PRACTICE) {
      let difficultyMessage = "";
      switch (aiDifficulty) {
        case AIDifficultyTier.NOVICE:
          difficultyMessage = "Novice training battle begins. Perfect your strategy!";
          break;
        case AIDifficultyTier.VETERAN:
          difficultyMessage = "Veteran AI activated. This opponent has advanced tactics!";
          break;
        case AIDifficultyTier.LEGEND:
          difficultyMessage = "LEGENDARY AI ENGAGED! Prepare for the ultimate challenge!";
          break;
      }

      setBattleLog(prev => [...prev, difficultyMessage]);
    }

    uiToast({
      title: "Game Started",
      description: "The battle has begun! Play your first card.",
    });

    toast.success("Connected to MONAD blockchain", {
      description: `Current block: ${monadGameState.currentBlockHeight}`,
      duration: 3000,
    });
  };

  const handleBoostActivation = async (amount: number, boostEffect: number, duration: number) => {
    // Show transaction pending state
    setIsTransactionPending(true);

    // Generate a proper format mock transaction hash (32 bytes = 64 chars + 0x prefix)
    const txHash = '0x' + Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('');

    setCurrentTransaction({
      txHash,
      description: `Activating MONAD Boost: +${boostEffect}% power`,
      blockNumber: blockchainStats.currentBlockHeight
    });

    toast.loading("Activating MONAD Boost on blockchain...", {
      id: txHash,
      duration: 3000,
    });

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Apply boost to all cards
      setPlayerDeck(prevCards =>
        prevCards.map(card => ({
          ...card,
          originalAttack: card.attack,
          originalDefense: card.defense,
          originalSpecial: card.special,
          attack: card.attack ? Math.floor(card.attack * (1 + boostEffect / 100)) : undefined,
          defense: card.defense ? Math.floor(card.defense * (1 + boostEffect / 100)) : undefined,
          special: card.special ? Math.floor(card.special * (1 + boostEffect / 100)) : undefined,
          boosted: true,
        }))
      );

      setBoostActive(true);
      setBoostDetails({
        effect: boostEffect,
        remainingTurns: duration,
        stakedAmount: amount,
        powerBoost: boostEffect,
        efficiency: Math.min(200, 100 + (amount * 2)),
        affectedCards: playerDeck.map(card => card.id)
      });

      setPlayerMonadBalance(prev => prev - amount);

      // Add visual effects
      setBattleLog(prev => [...prev, `🔥 MONAD Boost activated! +${boostEffect}% power for ${duration} turns`]);

      // Update transaction status
      const newTransaction: Transaction = {
        txHash,
        status: 'confirmed',
        blockNumber: blockchainStats.currentBlockHeight + 1,
        timestamp: Date.now(),
        description: `MONAD Boost: +${boostEffect}% for ${duration} turns`
      };

      setTransactions(prev => [newTransaction, ...prev].slice(0, 5));
      setIsTransactionPending(false);
      setCurrentTransaction(null);

      // Show success toast with animated sparkles
      toast.success(
        <div className="flex items-center">
          <span className="mr-2">MONAD Boost Activated!</span>
          <span className="text-yellow-400 animate-pulse">✨</span>
        </div>,
        {
          id: txHash,
          description: `All cards powered up by ${boostEffect}% for ${duration} turns`,
        }
      );

      // Play boost sound effect
      const audio = new Audio('/sounds/boost.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));

    } catch (error) {
      console.error("Failed to activate MONAD boost:", error);
      toast.error("Failed to activate MONAD boost");
      setIsTransactionPending(false);
      setCurrentTransaction(null);
    }
  };

  function handleOpponentTurn() {
    console.log("Executing AI turn...");
    if (gameStatus !== 'playing') return;

    // Check if opponent is stunned
    if (isOpponentStunned) {
      setBattleLog(prev => [...prev, "Opponent is stunned and skips their turn!"]);
      setIsOpponentStunned(false); // Reset stun after one turn
      endTurn('player'); // Player gets another turn
      return;
    }

    try {
      const playableCards = opponentCards.filter(card => card.mana <= opponentMana);
      console.log("AI playable cards:", playableCards);

      if (playableCards.length > 0) {
        let cardToPlay: GameCardType;
        let aiThinkingDelay = aiStrategies[aiDifficulty].thinkingTime;

        // Add AI thinking message to battle log
        const thinkingMessage = getAIThinkingMessage(aiDifficulty);
        setBattleLog(prev => [...prev, thinkingMessage]);

        try {
          // Select card based on difficulty
          switch (aiDifficulty) {
            case AIDifficultyTier.NOVICE:
              cardToPlay = selectCardNovice(playableCards, playerHealth, opponentHealth);
              break;

            case AIDifficultyTier.VETERAN:
              cardToPlay = selectCardVeteran(playableCards, playerHealth, opponentHealth, opponentMana);
              break;

            case AIDifficultyTier.LEGEND:
              cardToPlay = selectCardLegend(
                playableCards,
                playerHealth,
                opponentHealth,
                opponentMana,
                playerDeck,
                selectedCard
              );
              break;

            default:
              cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
          }

          if (!cardToPlay || !cardToPlay.id) {
            throw new Error('Invalid card selected by AI');
          }

          setTimeout(() => {
            try {
              console.log("AI playing card:", cardToPlay);

              // Update game state atomically
              setOpponentMana(prev => {
                const newMana = prev - cardToPlay.mana;
                if (newMana < 0) throw new Error('Insufficient mana');
                return newMana;
              });

              setOpponentCards(prev => prev.filter(c => c.id !== cardToPlay.id));

              // Record game event for consensus metrics if battle consensus is ready
              if (isBattleConsensusReady) {
                recordGameEvent({
                  type: 'card_play',
                  cardId: cardToPlay.id,
                  cardName: cardToPlay.name,
                  timestamp: Date.now(),
                  responseTime: Math.floor(Math.random() * 150) + 100, // Simulate response time between 100-250ms
                  player: 'opponent',
                  agreement: Math.random() * 20 + 75 // Random agreement between 75-95%
                }).catch(error => {
                  console.error('Failed to record opponent game event:', error);
                  // Continue with the game even if recording fails
                });
                console.log(`Opponent battle move recorded for card ${cardToPlay.name} in consensus system`);
              } else {
                console.log('Battle consensus not ready, skipping opponent move recording');
              }

              let newPlayerHealth = playerHealth;
              let newOpponentHealth = opponentHealth;
              let logEntry = `Opponent played ${cardToPlay.name}.`;

              // Apply card effects
              if (cardToPlay.attack) {
                const damage = cardToPlay.attack;
                newPlayerHealth = Math.max(0, playerHealth - damage);
                logEntry += ` Dealt ${damage} damage.`;
              }

              if (cardToPlay.defense) {
                const healing = Math.min(cardToPlay.defense, 30 - opponentHealth);
                newOpponentHealth = opponentHealth + healing;
                logEntry += ` Gained ${healing} health.`;
              }

              // Handle special effects
              if (cardToPlay.type === CardType.UTILITY) {
                if (cardToPlay.specialEffect?.effectType === 'STUN') {
                  setPlayerStunned(true);
                  logEntry += ' Player is stunned!';
                } else if (cardToPlay.specialEffect?.effectType === 'LEECH') {
                  const healAmount = Math.min(5, 30 - newOpponentHealth);
                  newOpponentHealth += healAmount;
                  logEntry += ` Healed for ${healAmount}.`;
                }
              }

              // Update health states
              setPlayerHealth(newPlayerHealth);
              setOpponentHealth(newOpponentHealth);
              setBattleLog(prev => [...prev, logEntry]);

              // Check win condition
              if (newPlayerHealth <= 0) {
                endGame(false);
                return;
              }

              // Update AI combo counter
              if (cardToPlay.type === CardType.ATTACK) {
                setAiComboCounter(prev => prev + 1);
              } else {
                setAiComboCounter(0);
              }

              endTurn('player');
            } catch (error) {
              console.error('Error during AI turn execution:', error);
              setBattleLog(prev => [...prev, 'AI encountered an error. Skipping turn.']);
              endTurn('player');
            }
          }, aiThinkingDelay);
        } catch (error) {
          console.error('Error during AI card selection:', error);
          setBattleLog(prev => [...prev, 'AI encountered an error. Skipping turn.']);
          endTurn('player');
        }
      } else if (opponentCards.length === 0) {
        handleFatigue('opponent');
      } else {
        setBattleLog(prev => [...prev, "Opponent passes (no playable cards)"]);
        endTurn('player');
      }
    } catch (error) {
      console.error('Error in handleOpponentTurn:', error);
      setBattleLog(prev => [...prev, 'AI encountered an error. Skipping turn.']);
      endTurn('player');
    }
  }

  const endTurn = useCallback((nextPlayer: 'player' | 'opponent') => {
    // Handle MONAD Boost expiration
    if (boostActive && boostDetails) {
      const newTurnsLeft = boostDetails.remainingTurns - 1;

      if (newTurnsLeft <= 0) {
        setPlayerDeck(prevCards =>
          prevCards.map(card => ({
            ...card,
            attack: card.originalAttack,
            defense: card.originalDefense,
            special: card.originalSpecial,
            boosted: false,
          }))
        );
        setBoostActive(false);
        setBoostDetails(null);
        setBattleLog(prev => [...prev, "MONAD Boost expired - cards returned to normal"]);
      } else {
        setBoostDetails(prev => ({
          ...prev!,
          remainingTurns: newTurnsLeft
        }));
        if (newTurnsLeft === 1) {
          setBattleLog(prev => [...prev, "MONAD Boost will expire next turn!"]);
        }
      }
    }

    // Handle copied cards expiration
    setPlayerDeck(prevDeck => {
      // Check for any copied cards that need to expire
      const updatedDeck = prevDeck.map(card => {
        if (card.isCopied && card.expiresInTurns !== undefined) {
          // Decrement the expiration counter
          return {
            ...card,
            expiresInTurns: card.expiresInTurns - 1
          };
        }
        return card;
      });

      // Find any cards that have expired
      const expiredCards = updatedDeck.filter(card =>
        card.isCopied && card.expiresInTurns !== undefined && card.expiresInTurns <= 0
      );

      // Remove expired cards from the deck
      const remainingCards = updatedDeck.filter(card =>
        !card.isCopied || card.expiresInTurns === undefined || card.expiresInTurns > 0
      );

      // Notify about expired cards
      if (expiredCards.length > 0) {
        expiredCards.forEach(card => {
          setBattleLog(prev => [...prev, `🔮 Copied card ${card.name} has expired and returned to its original owner.`]);
        });

        toast.info(
          <div className="flex items-center">
            <span className="mr-2">Copied Card Expired</span>
          </div>,
          {
            description: `${expiredCards.length} copied card(s) have expired and returned to their original owner.`,
            duration: 3000,
          }
        );
      }

      return remainingCards;
    });

    setCurrentTurn(nextPlayer);

    if (nextPlayer === 'player') {
      setPlayerMana(prev => Math.min(10, prev + 1));
    } else {
      setOpponentMana(prev => Math.min(10, prev + 1));
    }

    setSelectedCard(null);

    if (nextPlayer === 'opponent') {
      console.log("Triggering AI turn...");
      setTimeout(handleOpponentTurn, 1000);
    }
  }, [boostActive, boostDetails]);

  useEffect(() => {
    if (gameStatus === 'playing' && currentTurn === 'opponent' && gameMode === GameMode.PRACTICE) {
      handleOpponentTurn();
    }
  }, [currentTurn, gameStatus, gameMode]);

  const handleNoPlayableCards = (player: 'player' | 'opponent', message: string) => {
    const newLogs = [...battleLog, message];
    setBattleLog(newLogs);

    if (player === 'player') {
      endTurn('opponent');
    } else {
      endTurn('player');
    }
  };

  const handleTurnTimeExpired = () => {
    // When the turn timer expires, automatically end the player's turn
    if (currentTurn === 'player' && gameStatus === 'playing') {
      const message = "Turn time expired! Your turn has ended.";
      setBattleLog(prev => [...prev, message]);
      toast.warning("Turn time expired", {
        description: "Your turn has automatically ended"
      });
      setTurnTimeExpired(true);
      endTurn('opponent');
    }
  };

  const handleFatigue = (target: 'player' | 'opponent') => {
    const damage = fatigueDamage;
    const message = `${target === 'player' ? 'You take' : 'Opponent takes'} ${damage} fatigue damage.`;

    // Apply fatigue damage
    if (target === 'player') {
        const newHealth = Math.max(0, playerHealth - damage);
        setPlayerHealth(newHealth);

        // Check if player died from fatigue
        if (newHealth <= 0) {
            setBattleLog(prev => [...prev, message, "You were defeated by fatigue!"]);
            endGame(false);
            return;
        }
    } else {
        const newHealth = Math.max(0, opponentHealth - damage);
        setOpponentHealth(newHealth);

        // Check if opponent died from fatigue
        if (newHealth <= 0) {
            setBattleLog(prev => [...prev, message, "Opponent was defeated by fatigue!"]);
            endGame(true);
            return;
        }
    }

    // Add message to battle log
    setBattleLog(prev => [...prev, message]);

    // Increase fatigue damage for next time
    setFatigueDamage(prev => prev + 1);

    // Track consecutive skips
    setConsecutiveSkips(prev => prev + 1);

    // Check for draw conditions:
    // 1. If both players have skipped multiple turns
    // 2. If the game has gone on too long (30+ turns)
    // 3. If both players are just healing and not dealing damage
    if (consecutiveSkips >= 3) {
        setBattleLog(prev => [...prev, "The battle ends in a draw due to inactivity."]);
        endGame(null);
        return;
    }

    // If both players have very low health and can't play cards, it's a draw
    if (playerHealth <= 3 && opponentHealth <= 3 && playerDeck.length === 0 && opponentCards.length === 0) {
        setBattleLog(prev => [...prev, "The battle ends in a draw as both combatants are exhausted."]);
        endGame(null);
        return;
    }

    // Continue the game
    endTurn(target === 'player' ? 'opponent' : 'player');
  };

  // Simplified function to record game events for consensus metrics
  const recordGameEvent = async (eventData: {
    type: string;
    cardId?: string;
    cardName?: string;
    timestamp: number;
    responseTime: number;
    player: 'player' | 'opponent' | 'draw';
    agreement: number;
  }) => {
    try {
      // Only record every other event to reduce processing load
      const shouldRecord = Math.random() > 0.5;
      if (!shouldRecord) {
        return true; // Skip recording but return success
      }

      // Store the event in localStorage for consensus metrics - simplified
      const gameEvents = JSON.parse(localStorage.getItem('monad:game:events') || '[]');

      // Add the new event with minimal data
      gameEvents.push({
        type: eventData.type,
        timestamp: Date.now(),
        player: eventData.player,
        id: `game-event-${Date.now()}`
      });

      // Keep only the last 10 events to reduce storage and processing
      while (gameEvents.length > 10) {
        gameEvents.shift();
      }

      localStorage.setItem('monad:game:events', JSON.stringify(gameEvents));

      // No event dispatch to reduce overhead
      return true;
    } catch (error) {
      console.error('Failed to record game event:', error);
      return false;
    }
  };

  const playCard = async (card: GameCardType) => {
    if (!walletConnected) {
        toast.error("Please connect your wallet first");
        return;
    }

    // Record game event for consensus metrics if battle consensus is ready
    if (isBattleConsensusReady) {
      try {
        await recordGameEvent({
          type: 'card_play',
          cardId: card.id,
          cardName: card.name,
          timestamp: Date.now(),
          responseTime: Math.floor(Math.random() * 100) + 50, // Simulate response time between 50-150ms
          player: 'player',
          agreement: Math.random() * 30 + 70 // Random agreement between 70-100%
        });
        console.log(`Battle move recorded for card ${card.name} in consensus system`);
      } catch (error) {
        console.error('Failed to record game event:', error);
        // Continue with the game even if recording fails
      }
    } else {
      console.log('Battle consensus not ready, skipping move recording');
    }

    // Check if player is registered in localStorage if the isRegistered state is false
    if (!isRegistered) {
        const address = await monadGameService.getWalletAddress();
        const storedRegistration = localStorage.getItem(`monad-player-registered-${address}`);

        if (storedRegistration === 'true') {
            // Player is registered in localStorage, update the state
            console.log('Player registration found in localStorage during card play');
            setIsRegistered(true);
        } else {
            toast.error("Please register first");
            return;
        }
    }

    if (gameStatus !== 'playing' || currentTurn !== 'player') {
      toast.warning("Not your turn!");
      return;
    }

    if (playerMana < card.mana) {
      toast.warning(`Not enough mana (Need ${card.mana}, have ${playerMana})`);

      // Highlight the mana meter to show it's insufficient
      const manaMeter = document.getElementById('player-mana-meter');
      if (manaMeter) {
        manaMeter.classList.add('animate-shake');
        setTimeout(() => {
          manaMeter.classList.remove('animate-shake');
        }, 500);
      }
      return;
    }

    // Show mana effect animation
    const cardElement = document.getElementById(`card-${card.id}`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      setManaEffectPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 3
      });
      setManaEffectAmount(card.mana);
      setShowManaEffect(true);
    }

    try {
        // Generate a unique game ID for this move
        const gameId = Date.now();

        const newMove: MonadGameMove = {
            gameId,
            moveId: `move-${gameId}`,
            playerAddress: walletAddress,
            cardId: card.id,
            moveType: card.type.toLowerCase() as 'attack' | 'defend' | 'special',
            timestamp: Date.now(),
            verified: false
        };

        // Show transaction pending state
        setIsTransactionPending(true);

        // Visual feedback for transaction - use a temporary ID for the toast
        const tempToastId = `move-${Date.now()}`;
        toast.loading("Submitting move to MONAD blockchain...", {
            id: tempToastId,
            duration: 10000, // Longer duration since we're waiting for actual blockchain confirmation
        });

        // Submit move to blockchain - this will return the actual transaction hash
        const result = await monadGameService.executeParallelMoves([newMove]);
        const txHash = result.txHash;
        const blockNumber = result.blockNumber;

        // Set the current transaction with the real transaction hash
        setCurrentTransaction({
            txHash,
            description: `Playing card: ${card.name}`,
            blockNumber: blockNumber
        });

        // Update transaction status with the real transaction data
        const newTransaction: Transaction = {
            txHash,
            status: 'confirmed',
            blockNumber: blockNumber,
            timestamp: Date.now(),
            description: `Played ${card.name} (${card.type})`
        };

        setTransactions(prev => [newTransaction, ...prev].slice(0, 5));
        setIsTransactionPending(false);
        setCurrentTransaction(null);

        // Update the toast with the real transaction hash
        toast.success("Move confirmed on MONAD blockchain", {
            id: tempToastId,
            description: `Transaction hash: ${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`
        });

        // Add a button to view the transaction in the explorer
        const explorerUrl = getTransactionExplorerUrl(txHash);
        console.log('Explorer URL for transaction:', explorerUrl);
        toast.success(
          <div className="flex flex-col space-y-2">
            <span>View transaction on MONAD Explorer</span>
            <button
              onClick={() => {
                console.log('Opening explorer URL:', explorerUrl);
                window.open(explorerUrl, '_blank');
              }}
              className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 py-1 px-2 rounded flex items-center justify-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Explorer
            </button>
          </div>,
          {
            duration: 5000,
          }
        );

        setPlayerMana(prev => prev - card.mana);
        setPlayerDeck(prev => prev.filter(c => c.id !== card.id));
        setSelectedCard(card);
        setPlayerLastCards(prev => [card, ...prev].slice(0, 3));

        let logEntry = `You played ${card.name}.`;
        let opponentNewHealth = opponentHealth;
        let playerNewHealth = playerHealth;
        let extraMana = 0;
        let applyStun = false;

        // Apply card effects based on type
        if (card.attack) {
          // Calculate damage with potential critical hit for higher rarity cards
          let damage = card.attack;
          let criticalHit = false;
          let boostBonus = 0;

          // Add boost effect message if card is boosted
          if (card.boosted && card.originalAttack) {
            boostBonus = card.attack - card.originalAttack;
          }

          // Critical hit chance based on card rarity
          if (card.rarity === 'epic' && Math.random() < 0.2) {
            damage = Math.floor(damage * 1.5);
            criticalHit = true;
          } else if (card.rarity === 'legendary' && Math.random() < 0.3) {
            damage = Math.floor(damage * 2);
            criticalHit = true;
          }

          opponentNewHealth = Math.max(0, opponentHealth - damage);

          if (criticalHit && boostBonus > 0) {
            logEntry += ` CRITICAL HIT + MONAD BOOST! Dealt ${damage} damage (includes +${boostBonus} from boost).`;
          } else if (criticalHit) {
            logEntry += ` CRITICAL HIT! Dealt ${damage} damage.`;
          } else if (boostBonus > 0) {
            logEntry += ` Dealt ${damage} damage (includes +${boostBonus} from MONAD boost).`;
          } else {
            logEntry += ` Dealt ${damage} damage.`;
          }

          // Visual effect for boosted attacks
          if (boostBonus > 0) {
            toast("MONAD Boost Applied", {
              description: `+${boostBonus} attack power from MONAD boost`,
              icon: "✨",
              duration: 2000,
            });
          }
        }

        if (card.defense) {
          // Healing is more effective at lower health (comeback mechanic)
          let healing = card.defense;
          let boostBonus = 0;
          let lowHealthBonus = 0;

          // Add boost effect message if card is boosted
          if (card.boosted && card.originalDefense) {
            boostBonus = card.defense - card.originalDefense;
          }

          // Low health bonus
          if (playerHealth < 10) {
            lowHealthBonus = Math.floor(healing * 0.3); // 30% bonus when low on health
            healing = healing + lowHealthBonus;
          }

          playerNewHealth = Math.min(30, playerHealth + healing);

          if (lowHealthBonus > 0 && boostBonus > 0) {
            logEntry += ` Enhanced healing + MONAD BOOST! Gained ${healing} health (includes +${boostBonus} from boost and +${lowHealthBonus} from low health bonus).`;
          } else if (lowHealthBonus > 0) {
            logEntry += ` Enhanced healing! Gained ${healing} health (includes +${lowHealthBonus} from low health bonus).`;
          } else if (boostBonus > 0) {
            logEntry += ` Gained ${healing} health (includes +${boostBonus} from MONAD boost).`;
          } else {
            logEntry += ` Gained ${healing} health.`;
          }

          // Visual effect for boosted healing
          if (boostBonus > 0) {
            toast("MONAD Boost Applied", {
              description: `+${boostBonus} healing power from MONAD boost`,
              icon: "✨",
              duration: 2000,
            });
          }
        }

        // Handle special effects with expanded functionality
        if (card.specialEffect) {
          logEntry += ` ${card.specialEffect.description}`;

          // Check if special effect is boosted
          let specialBoostBonus = 0;
          if (card.boosted && card.originalSpecial && card.special) {
            specialBoostBonus = card.special - card.originalSpecial;
          }

          switch (card.specialEffect.type) {
            case 'damage':
              if (card.specialEffect.value) {
                // Apply boost to special damage if applicable
                let specialDamage = card.specialEffect.value;
                if (specialBoostBonus > 0 && card.special) {
                  // Scale the special effect damage by the boost percentage
                  const boostMultiplier = card.special / (card.originalSpecial || 1);
                  specialDamage = Math.floor(specialDamage * boostMultiplier);
                }

                opponentNewHealth = Math.max(0, opponentNewHealth - specialDamage);

                if (specialBoostBonus > 0) {
                  logEntry += ` (${specialDamage} extra damage, MONAD boosted)`;

                  // Visual effect for boosted special
                  toast("MONAD Special Boost", {
                    description: `Special effect amplified by MONAD boost`,
                    icon: "✨",
                    duration: 2000,
                  });
                } else {
                  logEntry += ` (${specialDamage} extra damage)`;
                }
              }
              break;

            case 'heal':
              if (card.specialEffect.value) {
                // Apply boost to special healing if applicable
                let specialHealing = card.specialEffect.value;
                if (specialBoostBonus > 0 && card.special) {
                  // Scale the special effect healing by the boost percentage
                  const boostMultiplier = card.special / (card.originalSpecial || 1);
                  specialHealing = Math.floor(specialHealing * boostMultiplier);
                }

                playerNewHealth = Math.min(30, playerNewHealth + specialHealing);

                if (specialBoostBonus > 0) {
                  logEntry += ` (${specialHealing} extra healing, MONAD boosted)`;

                  // Visual effect for boosted special
                  toast("MONAD Special Boost", {
                    description: `Healing effect amplified by MONAD boost`,
                    icon: "✨",
                    duration: 2000,
                  });
                } else {
                  logEntry += ` (${specialHealing} extra healing)`;
                }
              }
              break;

            case 'mana':
              if (card.specialEffect.value) {
                // Apply boost to mana gain if applicable
                extraMana = card.specialEffect.value;
                if (specialBoostBonus > 0 && card.special) {
                  // Add a bonus mana for boosted cards
                  extraMana += 1;
                  logEntry += ` (Gained ${extraMana} extra mana, +1 from MONAD boost)`;

                  // Visual effect for boosted special
                  toast("MONAD Special Boost", {
                    description: `Mana gain amplified by MONAD boost`,
                    icon: "✨",
                    duration: 2000,
                  });
                } else {
                  logEntry += ` (Gained ${extraMana} extra mana)`;
                }
              }
              break;

            case 'stun':
              applyStun = true;

              // Boosted stun cards have a chance to stun for an extra turn
              if (specialBoostBonus > 0 && Math.random() < 0.5) {
                logEntry += ` (Opponent stunned for 2 turns, enhanced by MONAD boost)`;
                // We'll need to handle the extended stun in the game logic

                // Visual effect for boosted special
                toast("MONAD Special Boost", {
                  description: `Stun effect amplified by MONAD boost`,
                  icon: "✨",
                  duration: 2000,
                });
              } else {
                logEntry += ` (Opponent stunned for 1 turn)`;
              }
              break;

            case 'leech':
              if (card.specialEffect.value && card.attack) {
                // Leech life equal to a percentage of damage dealt
                const leechAmount = Math.floor(card.attack * (card.specialEffect.value / 100));
                playerNewHealth = Math.min(30, playerNewHealth + leechAmount);
                logEntry += ` (Leeched ${leechAmount} health)`;
              }
              break;
          }

          // Handle effect types for more complex mechanics
          switch (card.specialEffect.effectType) {
            case 'COMBO':
              // Combo cards get stronger if played after certain other cards
              if (card.specialEffect.comboWith && pendingMoves.length > 0) {
                const lastMove = pendingMoves[pendingMoves.length - 1];
                if (card.specialEffect.comboWith.includes(lastMove.cardId)) {
                  // Bonus damage for combo
                  opponentNewHealth = Math.max(0, opponentNewHealth - 3);
                  logEntry += ` (COMBO BONUS: +3 damage)`;
                }
              }
              break;

            case 'COUNTER':
              // Counter cards are more effective against certain types
              // This would need to track the opponent's last card
              break;
          }
        }

        setOpponentHealth(opponentNewHealth);
        setPlayerHealth(playerNewHealth);
        setBattleLog(prev => [...prev, logEntry]);
        setPendingMoves(prev => [...prev, newMove]);

        // Reset consecutive skips counter when a card is played
        setConsecutiveSkips(0);

        // Apply extra mana if card granted it
        if (extraMana > 0) {
          setPlayerMana(prev => Math.min(10, prev + extraMana));
        }

        // Apply stun effect if card has it
        if (applyStun) {
          setIsOpponentStunned(true);
        }

        toast.loading("Submitting move to MONAD blockchain...", {
          id: newMove.moveId,
          duration: 2000,
        });

        // Update the move with the real transaction data
        setPendingMoves(prev =>
          prev.map(m => m.moveId === newMove.moveId ? {
            ...m,
            verified: true,
            onChainSignature: txHash
          } : m)
        );

        toast.success("Move verified on-chain", {
          id: newMove.moveId,
          description: `Block: ${blockNumber}`,
        });

          if (opponentNewHealth <= 0) {
            endGame(true);
            return;
          }

          // If opponent is stunned, they skip their turn
          if (isOpponentStunned) {
            setBattleLog(prev => [...prev, "Opponent is stunned and skips their turn!"]);
            setIsOpponentStunned(false); // Reset stun after one turn
            endTurn('player'); // Player gets another turn
          } else {
            endTurn('opponent');
          }
    } catch (error) {
        console.error("Failed to submit move:", error);
        toast.error("Failed to submit move to blockchain");
        return;
    }
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

  const handleShardRedemption = async () => {
    if (!walletConnected) {
        toast.error("Please connect your wallet first");
        return;
    }

    // Check if player is registered in localStorage if the isRegistered state is false
    if (!isRegistered) {
        const address = await monadGameService.getWalletAddress();
        const storedRegistration = localStorage.getItem(`monad-player-registered-${address}`);

        if (storedRegistration === 'true') {
            // Player is registered in localStorage, update the state
            console.log('Player registration found in localStorage during shard redemption');
            setIsRegistered(true);
        } else {
            toast.error("Please register first");
            return;
        }
    }

    try {
        toast.loading("Processing NFT redemption on Monad blockchain...", {
          id: "nft-redemption"
        });

        const result = await monadGameService.redeemNFT();

        // Update player state with reduced shards
        setPlayerData(prev => ({
          ...prev,
          shards: prev.shards - 10,
          lastTrialTime: Date.now(),
          dailyTrialsRemaining: prev.dailyTrialsRemaining - 1
        }));

        toast.success("NFT successfully redeemed!", {
          id: "nft-redemption",
          description: `Transaction confirmed in block #${result.blockNumber}. Check your collection!`
        });

        // Add transaction to history
        setPlayer(prev => ({
          ...prev,
          transactionHistory: [
            {
              type: "NFT Redemption",
              hash: result.txHash,
              timestamp: Date.now(),
              status: "Confirmed",
              blockNumber: result.blockNumber
            },
            ...prev.transactionHistory
          ]
        }));
    } catch (error) {
        console.error("NFT redemption failed:", error);
        toast.error("Failed to redeem NFT", {
          id: "nft-redemption",
          description: error.message || "Transaction failed. Please try again."
        });
    }
  };

  const endGame = async (playerWon: boolean | null) => {
    // Check if player is registered in localStorage if the isRegistered state is false
    if (!isRegistered && walletConnected) {
        const address = await monadGameService.getWalletAddress();
        const storedRegistration = localStorage.getItem(`monad-player-registered-${address}`);

        if (storedRegistration === 'true') {
            // Player is registered in localStorage, update the state
            console.log('Player registration found in localStorage during game end');
            setIsRegistered(true);
        }
    }

    // Record game completion event for consensus metrics if battle consensus is ready
    if (isBattleConsensusReady) {
      recordGameEvent({
        type: 'game_end',
        timestamp: Date.now(),
        responseTime: Math.floor(Math.random() * 100) + 50, // Simulate response time
        player: playerWon === true ? 'player' : playerWon === false ? 'opponent' : 'draw',
        agreement: Math.random() * 10 + 90 // High agreement for game end (90-100%)
      }).catch(error => {
        console.error('Failed to record game end event:', error);
      });
      console.log('Game end recorded in battle consensus system');
    } else {
      console.log('Battle consensus not ready, skipping game end recording');
    }

    try {
        // Show transaction pending state
        setIsTransactionPending(true);

        // Use a temporary toast ID
        const tempToastId = `game-end-${Date.now()}`;
        toast.loading("Finalizing game on MONAD blockchain...", {
            id: tempToastId,
            duration: 15000, // Longer duration for blockchain confirmation
        });

        const gameId = Date.now();
        // Game result data for blockchain submission
        const gameResult = {
            gameId,
            winner: playerWon ? walletAddress : null,
            playerHealth: playerHealth,
            opponentHealth: opponentHealth,
            difficulty: aiDifficulty,
            moves: pendingMoves
        };

        const movesBatch: MovesBatch = {
            gameId,
            batchId: `batch-${gameId}`,
            moves: pendingMoves,
            stateRoot: "0x" + Math.random().toString(16).slice(2),
            zkProof: "0x" + Math.random().toString(16).slice(2),
            verificationTime: Date.now(),
            submittedInBlock: blockchainStats.currentBlockHeight
        };

        // Submit the batch to the blockchain and get the real transaction hash
        const batchResult = await monadGameService.submitMovesBatch(movesBatch);
        const txHash = batchResult.txHash;
        const blockNumber = batchResult.blockNumber;

        // Set the current transaction with real data
        setCurrentTransaction({
            txHash,
            description: playerWon ? 'Recording victory on chain' : playerWon === false ? 'Recording defeat on chain' : 'Recording draw on chain',
            blockNumber: blockNumber
        });

        // Update transaction status with real data
        const newTransaction: Transaction = {
            txHash,
            status: 'confirmed',
            blockNumber: blockNumber,
            timestamp: Date.now(),
            description: playerWon
                ? 'Victory recorded on MONAD blockchain'
                : playerWon === false
                ? 'Defeat recorded on MONAD blockchain'
                : 'Draw recorded on MONAD blockchain'
        };

        setTransactions(prev => [newTransaction, ...prev].slice(0, 5));

        // Update the toast with the real transaction hash
        toast.success("Game results recorded on MONAD blockchain", {
            id: tempToastId,
            description: `Transaction hash: ${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`
        });

        // Add a button to view the transaction in the explorer
        const explorerUrl = getTransactionExplorerUrl(txHash);
        toast.success(
          <div className="flex flex-col space-y-2">
            <span>View game results on MONAD Explorer</span>
            <button
              onClick={() => {
                console.log('Opening explorer URL:', explorerUrl);
                window.open(explorerUrl, '_blank');
              }}
              className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 py-1 px-2 rounded flex items-center justify-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Explorer
            </button>
          </div>,
          {
            duration: 5000,
          }
        );

        // Award shards based on game outcome
        if (playerWon === true) {
            // Player won - award full shard reward
            const shardReward = getShardReward();

            // Calculate bonus shards based on performance
            let bonusShards = 0;

            // Bonus for high health remaining
            if (playerHealth >= 15) {
                bonusShards += 1;
            }

            // Bonus for winning quickly (fewer moves)
            if (pendingMoves.length <= 5) {
                bonusShards += 1;
            }

            // Bonus for winning against higher difficulty
            if (aiDifficulty === AIDifficultyTier.LEGEND) {
                bonusShards += 2;
            } else if (aiDifficulty === AIDifficultyTier.VETERAN) {
                bonusShards += 1;
            }

            const totalShardReward = shardReward + bonusShards;

            // Submit game result and claim shards - get real transaction data
            const shardResult = await monadGameService.claimShards(movesBatch.batchId, gameResult);
            const shardTxHash = shardResult.txHash;
            const shardBlockNumber = shardResult.blockNumber;

            // Track battle history for each card used by the player
            if (playerDeck.length > 0) {
                for (const card of playerDeck) {
                    try {
                        // Track battle history in IPFS
                        await monadGameService.trackCardBattleHistory(
                            card.id,
                            movesBatch.batchId,
                            'ai-opponent',
                            'win'
                        );
                    } catch (error) {
                        console.error(`Error tracking battle history for card ${card.id}:`, error);
                    }
                }
            }

            // Add shard transaction with real data
            const shardTransaction: Transaction = {
                txHash: shardTxHash,
                status: 'confirmed',
                blockNumber: shardBlockNumber,
                timestamp: Date.now(),
                description: `Claimed ${totalShardReward} MONAD shards as reward`
            };

            setTransactions(prev => [shardTransaction, ...prev].slice(0, 5));

            // Update player's MONAD balance and shards
            setPlayerMonadBalance(prev => prev + totalShardReward);

            // Update player data with new shards
            setPlayerData(prev => ({
                ...prev,
                shards: prev.shards + totalShardReward
            }));

            // Show success message with bonus explanation
            if (bonusShards > 0) {
                toast.success(`Earned ${totalShardReward} MONAD shards!`, {
                    description: `Base reward: ${shardReward} + Bonus: ${bonusShards} shards for excellent performance!`
                });
            } else {
                toast.success(`Earned ${totalShardReward} MONAD shards!`, {
                    description: "Shards added to your inventory"
                });
            }
        } else if (playerWon === false) {
            // Player lost - award consolation shards for effort
            const consolationShards = Math.max(1, Math.floor(getShardReward() / 3));

            // Only award consolation shards if the player put up a good fight
            if (pendingMoves.length >= 3) {
                // Submit game result and claim consolation shards
                await monadGameService.claimShards(movesBatch.batchId, gameResult);

                // Update player's MONAD balance and shards
                setPlayerMonadBalance(prev => prev + consolationShards);

                // Update player data with new shards
                setPlayerData(prev => ({
                    ...prev,
                    shards: prev.shards + consolationShards
                }));

                toast.success(`Earned ${consolationShards} consolation shards!`, {
                    description: "Keep practicing to earn more shards next time"
                });
            }
        } else if (playerWon === null) {
            // Draw - award partial shards
            const drawShards = Math.floor(getShardReward() / 2);

            // Submit game result and claim draw shards
            await monadGameService.claimShards(movesBatch.batchId, gameResult);

            // Update player's MONAD balance and shards
            setPlayerMonadBalance(prev => prev + drawShards);

            // Update player data with new shards
            setPlayerData(prev => ({
                ...prev,
                shards: prev.shards + drawShards
            }));

            toast.success(`Earned ${drawShards} MONAD shards for the draw!`, {
                description: "A hard-fought battle ends in a draw"
            });
        }

            // Add a button to view the transaction in the explorer if available
            if (playerWon !== undefined && currentTransaction?.txHash) {
                const explorerUrl = getTransactionExplorerUrl(currentTransaction.txHash);
                toast.success(
              <div className="flex flex-col space-y-2">
                <span>View game result on MONAD Explorer</span>
                <button
                  onClick={() => {
                    console.log('Opening explorer URL:', explorerUrl);
                    window.open(explorerUrl, '_blank');
                  }}
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
            }


        // If player lost, track battle history for their cards
        if (playerWon === false && playerDeck.length > 0) {
            for (const card of playerDeck) {
                try {
                    // Track battle history in IPFS
                    await monadGameService.trackCardBattleHistory(
                        card.id,
                        movesBatch.batchId,
                        'ai-opponent',
                        'loss'
                    );
                } catch (error) {
                    console.error(`Error tracking battle history for card ${card.id}:`, error);
                }
            }
        }

        setIsTransactionPending(false);
        setCurrentTransaction(null);

    } catch (error) {
        console.error("Failed to record game result:", error);
        toast.error("Failed to record game result on blockchain");
        setIsTransactionPending(false);
        setCurrentTransaction(null);
    }

    setGameStatus('end');
  };

  const resetGame = () => {
    // Don't reset player deck - use the one they selected
    // Only reset if they haven't selected any cards
    if (playerDeck.length === 0) {
      setPlayerDeck(allPlayerCards.slice(0, 3));
    }
    setSelectedCard(null);
    setPlayerMana(10);
    setOpponentMana(10);
    setPlayerHealth(20);
    setOpponentHealth(20);
    setBattleLog([]);
    setPendingMoves([]);
    setCurrentTurn('player');
    setFatigueDamage(1);
    setConsecutiveSkips(0);
    setBoostActive(false);
    setBoostDetails(null);
    setIsOpponentStunned(false);
  };

  const backToRoomSelection = () => {
    if (gameMode === GameMode.PRACTICE) {
      setGameStatus('room_select');
    } else if (gameMode === GameMode.GAMEROOM) {
      setGameStatus('gameroom');
    } else {
      setGameStatus('mode_select');
    }
    setBattleLog([]);
  };

  const renderManaExplanation = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-xs text-blue-400 underline cursor-help">
          What is Mana?
        </TooltipTrigger>
        <TooltipContent className="w-80 p-3 bg-black/90 border border-blue-500/30">
          <div>
            <h4 className="font-bold text-blue-400 mb-1">MONAD Mana System</h4>
            <p className="text-xs text-white/80">
              Mana is the energy resource that powers your cards. Each card requires a specific amount
              of mana to play. You start with 10 mana and gain +1 mana each turn (up to a maximum of 10).
              Strategic mana management is key to victory!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Wallet connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const renderGameContent = () => {

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        setConnectionError(null);

        try {
            // Show connecting toast
            toast.loading("Connecting to MetaMask...", { id: "connect-wallet" });

            // Connect wallet
            const address = await monadGameService.connectWallet();
            setWalletAddress(address);
            setWalletConnected(true);

            // Success toast
            toast.success("Wallet connected successfully", {
                id: "connect-wallet",
                description: `Connected to ${import.meta.env.VITE_NETWORK_NAME || 'Monad Network'}`
            });
        } catch (error: any) {
            console.error("Wallet connection error:", error);
            setConnectionError(error.message || "Failed to connect wallet");

            // Error toast
            toast.error("Failed to connect wallet", {
                id: "connect-wallet",
                description: error.message || "Please try again"
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleManualNetworkConfig = () => {
        // Get network config from service
        const networkConfig = monadGameService.getMonadNetworkConfig();

        // Format for display
        const formattedConfig = {
            networkName: networkConfig.chainName,
            chainId: networkConfig.chainId,
            currencySymbol: networkConfig.nativeCurrency.symbol,
            rpcUrl: networkConfig.rpcUrls[0],
            blockExplorer: networkConfig.blockExplorerUrls[0]
        };

        // Show network config in toast
        toast("Manual Network Configuration", {
            description: "Add this network manually in MetaMask",
            action: {
                label: "Copy Details",
                onClick: () => {
                    navigator.clipboard.writeText(JSON.stringify(formattedConfig, null, 2));
                    toast.success("Network details copied to clipboard");
                }
            },
            duration: 10000
        });

        // Log to console for easy copy-paste
        console.log("Manual Network Configuration:", formattedConfig);
    };

    const handleRemoveNetwork = async () => {
        try {
            toast.loading("Removing network from MetaMask...", { id: "remove-network" });
            await monadGameService.tryRemoveMonadNetwork();
            toast.success("Network removed successfully", {
                id: "remove-network",
                description: "Please try connecting again"
            });
        } catch (error: any) {
            toast.error("Failed to remove network", {
                id: "remove-network",
                description: error.message || "Please try manually in MetaMask"
            });
        }
    };

    if (!walletConnected) {
        return (
            <UICard className="glassmorphism border-emerald-500/30 p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6">Connect your MetaMask wallet to play Monad Chain Game</p>

                <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 mb-4 w-full max-w-xs"
                >
                    {isConnecting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                        </>
                    ) : "Connect MetaMask"}
                </Button>

                {connectionError && (
                    <div className="text-red-400 text-sm mt-2 mb-4">
                        {connectionError}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-400 text-sm mb-3">Having trouble connecting?</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualNetworkConfig}
                            className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        >
                            Manual Network Config
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveNetwork}
                            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            Remove Network
                        </Button>
                    </div>
                </div>
            </UICard>
        );
    }

    if (!isRegistered) {
        return (
            <UICard className="glassmorphism border-emerald-500/30 p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Register to Play</h2>
                <p className="text-gray-400 mb-6">Register your wallet to start playing Monad Chain Game</p>
                <Button
                    onClick={async () => {
                        // Disable the button to prevent multiple clicks
                        const button = document.activeElement as HTMLButtonElement;
                        if (button) button.disabled = true;

                        const toastId = "register-player-toast";
                        toast.loading("Registering player on Monad blockchain...", { id: toastId });

                        try {
                            // Call the service to register the player - get the real transaction hash
                            const result = await monadGameService.registerPlayer();
                            const txHash = result.txHash;

                            // Registration successful
                            toast.success("Successfully registered!", {
                                id: toastId,
                                description: `Transaction hash: ${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`
                            });

                            // Add a button to view the transaction in the explorer
                            const explorerUrl = getTransactionExplorerUrl(txHash);
                            toast.success(
                              <div className="flex flex-col space-y-2">
                                <span>View registration on MONAD Explorer</span>
                                <button
                                  onClick={() => {
                                    console.log('Opening explorer URL:', explorerUrl);
                                    window.open(explorerUrl, '_blank');
                                  }}
                                  className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 py-1 px-2 rounded flex items-center justify-center"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open Explorer
                                </button>
                              </div>,
                              {
                                duration: 5000,
                              }
                            );

                            // Update the UI state
                            setIsRegistered(true);
                        } catch (error: any) {
                            console.error("Registration failed:", error);

                            // If there was an error, show it to the user
                            const errorMessage = error.message || "Failed to register. Please try again.";
                            toast.error("Registration failed", {
                                id: toastId,
                                description: errorMessage
                            });

                            // Re-enable the button
                            if (button) button.disabled = false;
                        }
                    }}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500"
                >
                    Register Player
                </Button>
            </UICard>
        );
    }

    switch (gameStatus) {
      case 'mode_select':
        return <GameModeMenu onSelectMode={handleSelectGameMode} />;

      case 'room_select':
        return (
          <div className="space-y-4">
            <GameRoomSelector onSelectDifficulty={handleSelectDifficulty} />

            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="text-xs text-gray-400 hover:text-white"
                onClick={backToModeSelection}
              >
                Back to Game Modes
              </Button>
            </div>
          </div>
        );

      case 'gameroom':
        return (
          <GameRoomManager
            onStartGame={handleGameRoomStart}
            onBack={backToModeSelection}
            walletAddress={walletAddress}
            username={currentPlayer.username}
          />
        );

      case 'inventory':
        return (
          <PlayerInventory
            playerCards={allPlayerCards}
            onClose={closeInventory}
            onSelectCards={handleCardSelection}
            maxSelectable={3}
            selectionMode={opponentCards.length > 0} // Only enable selection mode if we came from difficulty selection
          />
        );

      case 'waiting':
        return (
          <UICard className="glassmorphism border-emerald-500/30 h-[600px] flex flex-col">
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-16 h-16 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Battle on MONAD?</h2>
              <p className="text-gray-300 mb-8 text-center max-w-md">
                Challenge an opponent on the MONAD blockchain. All game moves are recorded as on-chain transactions, giving you true ownership of your battle history and rewards.
              </p>

              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full max-w-md">
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform transition-all hover:scale-105"
                  onClick={startGame}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Battle
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 transform transition-all hover:scale-105"
                  onClick={openInventory}
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Inventory
                </Button>
              </div>

              <div className="mt-8 p-3 rounded-md bg-emerald-900/20 border border-emerald-500/30">
                <h3 className="text-sm font-semibold text-emerald-300 mb-2">Game Setup:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-300">Difficulty:</div>
                  <div className="text-emerald-400 font-semibold capitalize">{aiDifficulty}</div>
                  <div className="text-gray-300">Your Deck:</div>
                  <div className="text-emerald-400 font-semibold">{playerDeck.length} Cards Ready</div>
                  <div className="text-gray-300">Opponent:</div>
                  <div className="text-emerald-400 font-semibold">{opponentCards.length} Cards Ready</div>
                  <div className="text-gray-300">Shard Reward:</div>
                  <div className="text-emerald-400 font-semibold">{getShardReward()} Shards</div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-white"
                  onClick={backToRoomSelection}
                >
                  Return to Room Selection
                </Button>
              </div>
            </div>
          </UICard>
        );

      case 'playing':
        return (
          <UICard className="glassmorphism border-emerald-500/30">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">MONAD Battle</h2>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm">
                      {gameMode === GameMode.PRACTICE ? (
                        <>
                          Difficulty: <span className="text-emerald-400 capitalize">{aiDifficulty}</span>
                          <span className="mx-2">•</span>
                          {renderManaExplanation()}
                        </>
                      ) : (
                        <>
                          Mode: <span className="text-blue-400">1v1 Game Room</span>
                          <span className="mx-2">•</span>
                          {renderManaExplanation()}
                          {currentRoom && (
                            <>
                              <span className="mx-2">•</span>
                              Room: <span className="text-blue-400 font-mono">{currentRoom.roomCode}</span>
                            </>
                          )}
                        </>
                      )}
                    </p>

                    {/* Connection status indicator */}
                    {!isConnected && (
                      <div className="flex items-center bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Reconnecting...
                      </div>
                    )}
                  </div>

                  {/* Game Sync Status - Only show for Game Room mode */}
                  {gameMode === GameMode.GAMEROOM && currentRoom && (
                    <div className="mt-2">
                      <GameSyncStatus roomCode={currentRoom.roomCode} />
                    </div>
                  )}
                </div>
                <ShardManager
                  player={playerData}
                  onRedeemShards={handleShardRedemption}
                />
              </div>

              {/* Show MonadStatus and ConsensusStatus in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <MonadStatus />
                <ConsensusStatus />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <UICard className="bg-black/30 border-emerald-500/20">
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="text-emerald-400 text-sm mb-1 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Your Health
                          </div>
                          <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${(playerHealth / 20) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-white">{playerHealth}</span>
                            <span className="text-xs text-gray-500">20</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-red-400 text-sm mb-1 text-right flex items-center justify-end">
                            Opponent Health
                            <Shield className="w-4 h-4 ml-1" />
                          </div>
                          <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${(opponentHealth / 20) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-white">{opponentHealth}</span>
                            <span className="text-xs text-gray-500">20</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div id="player-mana-meter" className="relative">
                          <div className="absolute -top-1 -right-1">
                            <button
                              onClick={() => setShowManaGuide(true)}
                              className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 hover:bg-blue-500/50 flex items-center justify-center text-xs transition-colors"
                            >
                              ?
                            </button>
                          </div>
                          <ManaMeter
                            currentMana={playerMana}
                            maxMana={10}
                            showAnimation={currentTurn === 'player'}
                            size="md"
                            variant="tech"
                            playerType="player"
                          />
                        </div>
                        <div>
                          <ManaMeter
                            currentMana={opponentMana}
                            maxMana={10}
                            showAnimation={currentTurn === 'opponent'}
                            size="md"
                            variant="tech"
                            playerType="opponent"
                            className="opacity-90"
                          />
                        </div>
                      </div>

                      {/* MonadDb Status Button */}
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 w-full"
                          onClick={() => setShowMonadDbStatus(!showMonadDbStatus)}
                        >
                          <Database className="h-3 w-3 mr-1" />
                          {showMonadDbStatus ? 'Hide' : 'Show'} MonadDb Status
                        </Button>
                      </div>

                      {/* MonadDb Status Panel */}
                      {showMonadDbStatus && (
                        <div className="mb-4">
                          <MonadDbStatus />
                        </div>
                      )}

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-white text-sm flex items-center">
                            Battle Log
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${currentTurn === 'player' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {currentTurn === 'player' ? 'Your Turn' : 'AI Turn'}
                            </span>
                          </h3>
                          {currentTurn === 'player' && gameMode === GameMode.GAMEROOM && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => endTurn('opponent')}
                              className="text-xs h-7 px-2 border-gray-700"
                            >
                              Skip Turn
                            </Button>
                          )}
                        </div>

                        {/* Turn Timer */}
                        {currentTurn === 'player' && gameMode === GameMode.GAMEROOM && (
                          <div className="mb-2">
                            <TurnTimer
                              isActive={currentTurn === 'player'}
                              duration={60} // 60 seconds per turn
                              onTimeExpired={handleTurnTimeExpired}
                            />
                          </div>
                        )}
                        <div className="bg-black/40 rounded-md p-2 h-40 overflow-y-auto border border-white/10">
                          {battleLog.map((log, index) => (
                            <p key={index} className={`text-xs mb-1 ${index === battleLog.length - 1 ? 'text-emerald-400' : 'text-gray-300'}`}>
                              {log}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-white text-sm mb-2 flex items-center">
                          <Sword className="w-4 h-4 mr-1" />
                          Your Cards
                          {isBattleConsensusReady && (
                            <span className="ml-2 text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded-full flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                              Battle Recording
                            </span>
                          )}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {playerDeck.map(card => (
                            <div
                              key={card.id}
                              onClick={() => playCard(card)}
                              className={`cursor-pointer transform hover:-translate-y-1 transition-transform ${
                                currentTurn !== 'player' || playerMana < card.mana ? 'opacity-50' : 'hover:scale-105'
                              }`}
                            >
                              <GameCard card={card} showDetails={false} />
                            </div>
                          ))}
                          {playerDeck.length === 0 && (
                            <div className="col-span-3 text-center p-4 border border-dashed border-gray-700 rounded-md">
                              <p className="text-gray-400 text-sm">No cards in hand</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </UICard>
                </div>

                <div>
                  <MonadBoostMechanic
                    playerMonadBalance={playerMonadBalance}
                    onActivateBoost={handleBoostActivation}
                    boostActive={boostActive}
                    boostDetails={boostDetails}
                  />

                  <UICard className="bg-black/30 border-emerald-500/20 mt-4">
                    <div className="p-4">
                      <h3 className="text-white text-sm mb-2">Game Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Turn:</span>
                          <span className={`text-xs ${currentTurn === 'player' ? 'text-emerald-400' : 'text-red-400'} capitalize`}>
                            {currentTurn}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Cards Left:</span>
                          <span className="text-xs text-white">You: {playerDeck.length} | Opponent: {opponentCards.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Fatigue:</span>
                          <span className="text-xs text-amber-400">{fatigueDamage} Damage</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Shards:</span>
                          <span className="text-xs text-emerald-400">{playerData.shards}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">AI Difficulty:</span>
                          <span className="text-xs text-emerald-400 capitalize">{aiDifficulty}</span>
                        </div>
                      </div>
                    </div>
                  </UICard>

                  {aiDifficulty === AIDifficultyTier.LEGEND && (
                    <div className="mt-4 p-3 rounded-md bg-red-900/20 border border-red-500/30 animate-pulse">
                      <p className="text-xs text-red-400 font-semibold">
                        ⚠️ LEGEND MODE ACTIVE: AI has enhanced abilities and advanced strategy algorithms.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </UICard>
        );

      case 'end':
        return (
          <UICard className="glassmorphism border-emerald-500/30 h-[600px] flex flex-col">
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-16 h-16 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Battle Complete</h2>
              <div className="bg-black/30 rounded-md p-4 mb-6 w-full max-w-md">
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-400 mb-1">Final Result</div>
                  <div className={`text-lg font-bold ${playerHealth <= 0 ? 'text-red-400' : opponentHealth <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {playerHealth <= 0 ? 'Defeat' : opponentHealth <= 0 ? 'Victory!' : 'Draw'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Your Health
                    </div>
                    <div className="text-lg font-bold">{playerHealth}/20</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1 flex items-center justify-end">
                      Opponent Health
                      <Shield className="w-4 h-4 ml-1" />
                    </div>
                    <div className="text-lg font-bold text-right">{opponentHealth}/20</div>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-400 mb-1">Total Shards</div>
                  <div className="text-3xl font-bold text-amber-400">{playerData.shards}</div>
                  <div className="text-xs text-gray-400 mt-1">Use these to redeem new cards!</div>
                </div>
                <div className="bg-black/30 rounded p-3">
                  <div className="text-sm text-gray-400 mb-1">Battle Log</div>
                  <div className="max-h-32 overflow-y-auto text-xs text-gray-300">
                    {battleLog.map((log, index) => (
                      <p key={index} className="mb-1">{log}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 w-full max-w-md">
                <Button onClick={backToRoomSelection} className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 transform transition-all hover:scale-105">
                  <Zap className="w-4 h-4 mr-2" />
                  New Battle
                </Button>
                <Button onClick={openInventory} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform transition-all hover:scale-105">
                  <Package className="w-4 h-4 mr-2" />
                  View Inventory
                </Button>
              </div>
            </div>
          </UICard>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {renderGameContent()}
      {gameStatus === 'playing' && (
        <OnChainMoves
          moves={pendingMoves}
          isVisible={showOnChainMoves}
          onToggle={() => setShowOnChainMoves(!showOnChainMoves)}
        />
      )}

      {/* Mana effect animation */}
      {showManaEffect && (
        <ManaEffect
          show={showManaEffect}
          amount={manaEffectAmount}
          position={manaEffectPosition}
          onComplete={() => setShowManaEffect(false)}
        />
      )}

      {/* Mana guide modal */}
      {showManaGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <ManaGuide onClose={() => setShowManaGuide(false)} />
        </div>
      )}
    </div>
  );
}

export default Game;
