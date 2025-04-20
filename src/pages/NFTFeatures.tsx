import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card as UICard } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles, Flame, Trophy, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import CardFusionManager from '../components/CardFusionManager';
import LimitedEditionDrops from '../components/LimitedEditionDrops';
import TournamentRewards from '../components/TournamentRewards';
import { MonadGameService } from '../services/MonadGameService';
import { usePlayer } from '../contexts/PlayerContext';

const NFTFeatures: React.FC = () => {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();

  // Initialize player data if not available
  React.useEffect(() => {
    if (!player || Object.keys(player).length === 0) {
      setPlayer({
        monadAddress: '',
        username: 'Player',
        level: 1,
        experience: 0,
        wins: 0,
        losses: 0,
        shards: 0,
        cards: [],
        isRegistered: false,
        dailyTrialsRemaining: 3,
        lastTrialTime: 0,
        transactionHistory: []
      });
    }
  }, [player, setPlayer]);
  const [activeTab, setActiveTab] = useState('fusion');
  const [playerCards, setPlayerCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monadGameService] = useState(() => new MonadGameService());
  const [walletConnected, setWalletConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await monadGameService.isConnected();
        setWalletConnected(isConnected);

        if (isConnected) {
          const address = await monadGameService.getWalletAddress();
          const playerData = await monadGameService.getPlayer(address);
          setIsRegistered(playerData.isRegistered);

          if (playerData.isRegistered) {
            // Fetch player's cards
            const cards = await monadGameService.getPlayerCards(address);
            setPlayerCards(cards);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [monadGameService]);

  const handleConnectWallet = async () => {
    try {
      await monadGameService.connectWallet();
      setWalletConnected(true);

      const address = await monadGameService.getWalletAddress();
      const playerData = await monadGameService.getPlayer(address);
      setIsRegistered(playerData.isRegistered);

      if (playerData.isRegistered) {
        // Fetch player's cards
        const cards = await monadGameService.getPlayerCards(address);
        setPlayerCards(cards);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleRegisterPlayer = async () => {
    try {
      const toastId = 'register-player-toast';
      toast.loading('Registering player on Monad blockchain...', { id: toastId });

      const result = await monadGameService.registerPlayer();

      toast.success('Successfully registered!', {
        id: toastId,
        description: `Transaction confirmed in block #${result.blockNumber}`
      });

      setIsRegistered(true);

      // Fetch player's cards (should be empty for new player)
      const address = await monadGameService.getWalletAddress();
      const cards = await monadGameService.getPlayerCards(address);
      setPlayerCards(cards);
    } catch (error) {
      console.error('Error registering player:', error);
      toast.error('Failed to register player');
    }
  };

  const handleFusionComplete = async () => {
    try {
      // Refresh player's cards
      const address = await monadGameService.getWalletAddress();
      const cards = await monadGameService.getPlayerCards(address);
      setPlayerCards(cards);

      // Refresh player data
      const playerData = await monadGameService.getPlayer(address);
      setPlayer({
        ...player,
        shards: playerData.shards
      });
    } catch (error) {
      console.error('Error refreshing data after fusion:', error);
    }
  };

  const handleDropClaimed = async () => {
    try {
      // Refresh player's cards
      const address = await monadGameService.getWalletAddress();
      const cards = await monadGameService.getPlayerCards(address);
      setPlayerCards(cards);
    } catch (error) {
      console.error('Error refreshing data after claiming drop:', error);
    }
  };

  const handleRewardClaimed = async () => {
    try {
      // Refresh player's cards
      const address = await monadGameService.getWalletAddress();
      const cards = await monadGameService.getPlayerCards(address);
      setPlayerCards(cards);
    } catch (error) {
      console.error('Error refreshing data after claiming reward:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <UICard className="glassmorphism border-emerald-500/30 p-6 text-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading NFT Features</h2>
          <p className="text-gray-400">Please wait while we connect to the Monad blockchain...</p>
        </UICard>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <UICard className="glassmorphism border-emerald-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to access advanced NFT features</p>
          <Button
            onClick={handleConnectWallet}
            className="bg-gradient-to-r from-emerald-400 to-teal-500"
          >
            Connect MetaMask
          </Button>
        </UICard>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <UICard className="glassmorphism border-emerald-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Register to Play</h2>
          <p className="text-gray-400 mb-6">Register your wallet to access advanced NFT features</p>
          <Button
            onClick={handleRegisterPlayer}
            className="bg-gradient-to-r from-emerald-400 to-teal-500"
          >
            Register Player
          </Button>
        </UICard>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Advanced NFT Features</h1>
          <p className="text-gray-400">Explore the advanced NFT capabilities powered by Monad</p>
        </div>

        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={() => navigate('/game')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Game
        </Button>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="fusion" className="data-[state=active]:bg-emerald-900/50 data-[state=active]:text-emerald-400">
            <Flame className="w-4 h-4 mr-2" />
            Card Evolution & Fusion
          </TabsTrigger>
          <TabsTrigger value="drops" className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-400">
            <Sparkles className="w-4 h-4 mr-2" />
            Limited Edition Drops
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-400">
            <Trophy className="w-4 h-4 mr-2" />
            Tournament Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fusion">
          <CardFusionManager
            playerCards={playerCards}
            monadGameService={monadGameService}
            onFusionComplete={handleFusionComplete}
          />
        </TabsContent>

        <TabsContent value="drops">
          <LimitedEditionDrops
            monadGameService={monadGameService}
            onDropClaimed={handleDropClaimed}
          />
        </TabsContent>

        <TabsContent value="tournaments">
          <TournamentRewards
            monadGameService={monadGameService}
            onRewardClaimed={handleRewardClaimed}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-8 mb-8 flex justify-center">
        <Button
          className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-lg"
          onClick={() => navigate('/nft-viewer')}
        >
          <Search className="w-5 h-5 mr-2" />
          Browse NFTs by Address
        </Button>
      </div>

      <div className="mt-8 bg-black/30 rounded-md p-4 border border-blue-500/20">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">Monad Blockchain Advantages</h2>
        <p className="text-sm text-gray-300 mb-4">
          All NFT operations on Monad Chain Game benefit from Monad's unique blockchain architecture:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Parallel Execution</h3>
            <p className="text-xs text-gray-300">
              Batch operations like evolving multiple cards or listing several NFTs happen in parallel,
              significantly reducing transaction times.
            </p>
          </div>

          <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">High Throughput</h3>
            <p className="text-xs text-gray-300">
              Monad's high transaction throughput ensures that even during peak usage,
              your NFT transactions are processed quickly.
            </p>
          </div>

          <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Low Transaction Costs</h3>
            <p className="text-xs text-gray-300">
              Enjoy lower gas fees for all NFT operations, making even small-value
              transactions economically viable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTFeatures;
