import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card as UICard } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles, Flame, Trophy, ArrowLeft, Search, Network, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import CardFusionManager from '../components/CardFusionManager';
import LimitedEditionDrops from '../components/LimitedEditionDrops';
import TournamentRewards from '../components/TournamentRewards';
import RaptorCastNFTCard from '../components/RaptorCastNFTCard';
import NFTPropagationVisualizer from '../components/NFTPropagationVisualizer';
import NFTPropagationHistory from '../components/NFTPropagationHistory';
import { MonadGameService } from '../services/MonadGameService';
import { monadNFTService, MintedNFT } from '../services/MonadNFTService';
import { nftPropagationService } from '../services/NFTPropagationService';
import { raptorCastService, NFTPropagationResult } from '../services/RaptorCastService';
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
  const [playerNFTs, setPlayerNFTs] = useState<MintedNFT[]>([]);
  const [propagatedNFTs, setPropagatedNFTs] = useState<Map<number, NFTPropagationResult>>(new Map());
  const [evolvedNFTs, setEvolvedNFTs] = useState<Map<number, MintedNFT>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [monadGameService] = useState(() => new MonadGameService());
  const [walletConnected, setWalletConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<MintedNFT | null>(null);
  const [showOnlyEvolved, setShowOnlyEvolved] = useState(false);

  // Filter NFTs based on the showOnlyEvolved state
  const filteredNFTs = React.useMemo(() => {
    if (showOnlyEvolved) {
      // Show only evolved NFTs
      return playerNFTs.filter(nft =>
        Array.from(evolvedNFTs.values()).some(evolved => evolved.tokenId === nft.tokenId)
      );
    } else {
      // Show all NFTs
      return playerNFTs;
    }
  }, [playerNFTs, evolvedNFTs, showOnlyEvolved]);

  // Load evolved NFTs from localStorage
  useEffect(() => {
    try {
      // Load evolved NFT IDs
      const evolvedIds = JSON.parse(localStorage.getItem('evolved-nft-ids') || '[]');

      // Create a map of original NFT ID to evolved NFT
      const loadedEvolutions = new Map<number, MintedNFT>();

      // For each original NFT, load its evolved version
      const storedKeys = Object.keys(localStorage).filter(key => key.startsWith('evolved-nft-'));
      for (const key of storedKeys) {
        const originalId = parseInt(key.replace('evolved-nft-', ''));
        try {
          const evolvedNFT = JSON.parse(localStorage.getItem(key) || '');
          if (evolvedNFT && evolvedNFT.tokenId) {
            loadedEvolutions.set(originalId, evolvedNFT);
          }
        } catch (e) {
          console.error(`Error parsing evolved NFT for key ${key}:`, e);
        }
      }

      if (loadedEvolutions.size > 0) {
        setEvolvedNFTs(loadedEvolutions);
      }
    } catch (error) {
      console.error('Error loading evolved NFTs from localStorage:', error);
    }
  }, []);

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

            // Initialize NFT propagation service
            await nftPropagationService.initialize();

            // Generate some sample NFTs for demo purposes
            const sampleNFTs = [];
            for (let i = 0; i < 3; i++) {
              sampleNFTs.push(monadNFTService.simulateMintedNFT());
            }

            // Add any evolved NFTs that aren't already in the sample NFTs
            const evolvedNFTValues = Array.from(evolvedNFTs.values());
            for (const evolvedNFT of evolvedNFTValues) {
              if (!sampleNFTs.some(nft => nft.tokenId === evolvedNFT.tokenId)) {
                sampleNFTs.push(evolvedNFT);
              }
            }

            setPlayerNFTs(sampleNFTs);

            // Get existing propagations
            setPropagatedNFTs(nftPropagationService.getUserPropagations());

            // Merge service evolved NFTs with localStorage evolved NFTs
            const serviceEvolved = nftPropagationService.getEvolvedNFTs();
            if (serviceEvolved.size > 0) {
              const mergedEvolved = new Map(evolvedNFTs);
              serviceEvolved.forEach((value, key) => {
                mergedEvolved.set(key, value);
              });
              setEvolvedNFTs(mergedEvolved);
            }
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [monadGameService, evolvedNFTs]);

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

      // Initialize NFT propagation service
      await nftPropagationService.initialize();

      // Generate some sample NFTs for demo purposes
      const sampleNFTs = [];
      for (let i = 0; i < 3; i++) {
        sampleNFTs.push(monadNFTService.simulateMintedNFT());
      }
      setPlayerNFTs(sampleNFTs);
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

  const handleNFTPropagationComplete = (result: NFTPropagationResult) => {
    // Update propagated NFTs
    const updatedPropagations = new Map(propagatedNFTs);
    updatedPropagations.set(result.nft.tokenId, result);
    setPropagatedNFTs(updatedPropagations);

    toast.success('NFT propagation complete!', {
      description: `Your NFT has been propagated through ${result.receivingNodes.length} nodes on the Monad network`
    });
  };

  const handleNFTEvolution = (evolvedNFT: MintedNFT) => {
    // Update evolved NFTs
    if (selectedNFT) {
      const updatedEvolutions = new Map(evolvedNFTs);
      updatedEvolutions.set(selectedNFT.tokenId, evolvedNFT);
      setEvolvedNFTs(updatedEvolutions);

      // Check if the evolved NFT is already in the player's NFTs
      const nftExists = playerNFTs.some(nft => nft.tokenId === evolvedNFT.tokenId);
      if (!nftExists) {
        // Add the evolved NFT to player's NFTs
        setPlayerNFTs([...playerNFTs, evolvedNFT]);
      }

      // Store the evolution in localStorage for persistence
      try {
        // Store the mapping between original and evolved NFT
        localStorage.setItem(`evolved-nft-${selectedNFT.tokenId}`, JSON.stringify(evolvedNFT));

        // Store the list of all evolved NFT IDs
        const evolvedIds = JSON.parse(localStorage.getItem('evolved-nft-ids') || '[]');
        if (!evolvedIds.includes(evolvedNFT.tokenId)) {
          evolvedIds.push(evolvedNFT.tokenId);
          localStorage.setItem('evolved-nft-ids', JSON.stringify(evolvedIds));
        }
      } catch (error) {
        console.error('Error storing evolution in localStorage:', error);
      }

      toast.success('NFT evolved successfully!', {
        description: `Your NFT has evolved to ${evolvedNFT.name} with quality ${evolvedNFT.quality}`
      });

      // Automatically switch to show evolved NFTs if this is the first evolution
      if (updatedEvolutions.size === 1) {
        setShowOnlyEvolved(true);
      }
    }
  };

  const mintNewNFT = async () => {
    try {
      const toastId = toast.loading('Minting new NFT...');

      // Mint a new NFT
      const newNFT = await monadNFTService.mintSurpriseToken();

      // Add to player's NFTs
      setPlayerNFTs([...playerNFTs, newNFT]);

      toast.success('New NFT minted!', {
        id: toastId,
        description: `${newNFT.name} with quality ${newNFT.quality} has been added to your wallet`
      });
    } catch (error) {
      console.error('Error minting new NFT:', error);
      toast.error('Failed to mint new NFT');
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
        <TabsList className="grid w-full grid-cols-4 mb-6">
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
          <TabsTrigger value="raptorcast" className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-400">
            <Network className="w-4 h-4 mr-2" />
            RaptorCast NFT Propagation
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

        <TabsContent value="raptorcast">
          <UICard className="glassmorphism border-blue-500/30 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Network className="w-5 h-5 mr-2 text-blue-400" />
                  RaptorCast NFT Propagation
                </h2>
                <p className="text-gray-400 mt-1">
                  Propagate your NFTs through the Monad network using RaptorCast technology and watch them evolve
                </p>
              </div>

              <Button
                onClick={mintNewNFT}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Mint New NFT
              </Button>
            </div>

            {/* NFT Collection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-400">Your NFT Collection</h3>

                {/* Filter buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs border-blue-500/30 ${!showOnlyEvolved ? 'bg-blue-900/30 text-blue-400' : 'bg-transparent text-gray-400'}`}
                    onClick={() => setShowOnlyEvolved(false)}
                  >
                    All NFTs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs border-purple-500/30 ${showOnlyEvolved ? 'bg-purple-900/30 text-purple-400' : 'bg-transparent text-gray-400'}`}
                    onClick={() => setShowOnlyEvolved(true)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Evolved Only
                  </Button>
                </div>
              </div>

              {playerNFTs.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-blue-500/30 rounded-md">
                  <p className="text-gray-400 mb-4">You don't have any NFTs yet</p>
                  <Button
                    onClick={mintNewNFT}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mint Your First NFT
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredNFTs.map((nft) => {
                    // Check if this NFT is evolved
                    const isEvolved = Array.from(evolvedNFTs.values()).some(evolved => evolved.tokenId === nft.tokenId);
                    // Check if this NFT is the original of an evolved NFT
                    const hasEvolved = Array.from(evolvedNFTs.keys()).includes(nft.tokenId);

                    return (
                      <div key={nft.tokenId} onClick={() => setSelectedNFT(nft)} className={hasEvolved ? 'relative' : ''}>
                        {hasEvolved && (
                          <div className="absolute -top-2 -right-2 z-10 bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <RaptorCastNFTCard
                          nft={nft}
                          onPropagationComplete={handleNFTPropagationComplete}
                          onEvolve={handleNFTEvolution}
                          isEvolved={isEvolved}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NFT Propagation Visualizer */}
            {selectedNFT && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">NFT Propagation Visualizer</h3>
                <NFTPropagationVisualizer
                  nft={selectedNFT}
                  propagationId={propagatedNFTs.get(selectedNFT.tokenId)?.messageId}
                  onComplete={handleNFTPropagationComplete}
                  onEvolve={handleNFTEvolution}
                />
              </div>
            )}
          </UICard>

          {/* MonadDb Blockchain History */}
          <UICard className="glassmorphism border-blue-500/30 p-6 mb-6">
            <NFTPropagationHistory />
          </UICard>

          {/* RaptorCast Technology Explanation */}
          <UICard className="glassmorphism border-blue-500/30 p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">About RaptorCast Technology</h3>
            <p className="text-sm text-gray-300 mb-4">
              RaptorCast is Monad's advanced message propagation protocol that uses erasure coding and efficient broadcast trees to ensure reliable data distribution across the network.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">Erasure Coding</h4>
                <p className="text-xs text-gray-300">
                  RaptorCast uses Raptor codes to encode data with redundancy, allowing receivers to reconstruct the original message even if some chunks are lost.
                </p>
              </div>

              <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">Broadcast Trees</h4>
                <p className="text-xs text-gray-300">
                  Messages are distributed through an efficient tree structure, where each node forwards data to multiple children, enabling rapid network-wide propagation.
                </p>
              </div>

              <div className="bg-blue-900/20 p-3 rounded-md border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">NFT Evolution</h4>
                <p className="text-xs text-gray-300">
                  As NFTs propagate through the network, they can evolve based on propagation metrics, gaining new attributes and increased quality.
                </p>
              </div>
            </div>
          </UICard>
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
