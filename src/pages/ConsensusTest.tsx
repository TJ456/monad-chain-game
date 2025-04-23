import React, { useState, useEffect } from 'react';
import { ConsensusStatus } from '@/components/ConsensusStatus';
import { gameConsensusService } from '@/services/GameConsensusService';
import { consensusIntegration } from '@/services/ConsensusIntegration';
import { monadDb } from '@/services/MonadDbService';
import { initializeServices, areServicesInitialized } from '@/services/initServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ConsensusTest = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // This effect runs when the ConsensusTest page is loaded
    console.log('ConsensusTest page loaded - checking initialization status');

    // Check if consensus is already initialized
    const checkInitialization = async () => {
      try {
        // First check if MonadDb is initialized
        if (!monadDb['isInitialized']) {
          console.log('MonadDb not initialized on page load');
          setIsInitialized(false);
          return;
        }

        // Don't show toasts during initial check
        const initialized = await areServicesInitialized(false);
        console.log('Services initialized check result:', initialized);
        setIsInitialized(initialized);
      } catch (error) {
        console.error('Error checking consensus initialization:', error);
        setIsInitialized(false);
      }
    };

    checkInitialization();
  }, []);

  const handleInitializeConsensus = async () => {
    setIsLoading(true);
    try {
      // First check if services are already initialized - show toasts here
      const alreadyInitialized = await areServicesInitialized(true);

      if (alreadyInitialized) {
        toast.info('Consensus already initialized', {
          description: 'Monad BFT consensus system is already active'
        });
        setIsInitialized(true);
      } else {
        // First, ensure MonadDb is initialized
        if (!monadDb['isInitialized']) {
          console.log('Initializing MonadDb first...');
          try {
            await monadDb.initialize({
              cacheSize: 512, // 512MB cache
              persistToDisk: true,
              logLevel: 'info'
            });
            console.log('MonadDb initialized successfully');
          } catch (dbError) {
            console.error('Error initializing MonadDb:', dbError);
            toast.error('Failed to initialize database', {
              description: dbError instanceof Error ? dbError.message : 'Unknown error'
            });
            setIsLoading(false);
            return;
          }
        }

        // Use the centralized initialization service
        console.log('Initializing consensus services...');
        const success = await initializeServices();

        if (success) {
          toast.success('Consensus initialized', {
            description: 'Monad BFT consensus system is now active'
          });
          setIsInitialized(true);
        } else {
          toast.error('Failed to initialize consensus', {
            description: 'Check console for details'
          });
        }
      }
    } catch (error) {
      console.error('Error initializing consensus:', error);
      toast.error('Failed to initialize consensus', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBlock = async () => {
    setIsLoading(true);
    try {
      // First check if MonadDb is initialized
      if (!monadDb['isInitialized']) {
        toast.error('Database not initialized', {
          description: 'Please initialize the consensus system first'
        });
        setIsLoading(false);
        return;
      }

      // Then check if services are initialized - show toasts here
      const initialized = await areServicesInitialized(true);
      if (!initialized) {
        toast.error('Consensus not initialized', {
          description: 'Please initialize the consensus system first'
        });
        setIsLoading(false);
        return;
      }

      // Create a game state update with rich game data
      const gameState = {
        roomCode: 'battle-arena-' + Math.floor(Math.random() * 1000),
        playerHealth: 20,
        opponentHealth: 15,
        playerMana: 5,
        opponentMana: 4,
        currentTurn: 'player',
        moveHistory: ['attack:lightning-strike', 'defend:mystic-shield', 'special:mana-surge'],
        lastMove: {
          player: 'player',
          cardId: 'card-' + Math.floor(Math.random() * 10),
          effect: 'Dealt 5 damage to opponent'
        },
        playerDeck: [
          {
            id: 'card-' + Math.floor(Math.random() * 1000),
            name: 'Monad Disruptor',
            type: 'attack',
            attack: 7,
            mana: 3
          },
          {
            id: 'card-' + Math.floor(Math.random() * 1000),
            name: 'Consensus Shield',
            type: 'defense',
            defense: 6,
            mana: 2
          }
        ],
        opponentDeckSize: 5,
        gameMode: 'ranked',
        battleEffects: ['critical', 'parallelExecution'],
        timestamp: Date.now(),
        version: Math.floor(Math.random() * 100),
        zkProofEnabled: true
      };

      console.log('Submitting game state update to create a block...');

      // Submit the game state update to create a new block
      try {
        const result = await gameConsensusService.submitGameStateUpdate(gameState);

        if (result) {
          toast.success('Battle recorded on blockchain!', {
            description: `Battle Block #${result.number} has been created with ${result.transactions.length} card moves`
          });
        } else {
          toast.info('Battle verification in progress', {
            description: 'Your battle moves are being verified by validator nodes'
          });
        }
      } catch (submitError) {
        console.error('Error submitting game state update:', submitError);
        toast.error('Battle recording failed', {
          description: submitError instanceof Error ? submitError.message : 'The validator nodes could not verify your battle'
        });
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Battle consensus failed', {
        description: error instanceof Error ? error.message : 'The Monad network could not reach consensus on your battle'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Monad BFT Consensus Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Consensus Controls</CardTitle>
              <CardDescription>Initialize and test the consensus system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleInitializeConsensus}
                disabled={isInitialized || isLoading}
                className="w-full"
              >
                {isLoading ? 'Initializing...' : isInitialized ? 'Consensus Initialized' : 'Initialize Consensus'}
              </Button>

              <Button
                onClick={handleCreateBlock}
                disabled={!isInitialized || isLoading}
                variant="outline"
                className="w-full"
              >
                Create Game Battle Block
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <ConsensusStatus />
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Monad Battle Consensus Engine</CardTitle>
            <CardDescription>Blockchain-powered game state verification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Monad Battle Consensus Engine powers the game's blockchain features, ensuring
              fair play and tamper-proof battle records. Each card move, battle outcome, and NFT
              evolution is recorded on-chain with cryptographic verification, allowing players to
              prove ownership and battle history.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Battle Consensus Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Verifiable card battles with ZK-proofs</li>
                  <li>• Shard rewards for winning tournaments</li>
                  <li>• NFT evolution tracking on-chain</li>
                  <li>• Cross-shard card trading & battles</li>
                  <li>• Parallel execution of game moves</li>
                </ul>
              </div>
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Battle Verification Flow</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Card Move: Player executes a card move</li>
                  <li>2. Merkle Proof: Move is hashed into Merkle tree</li>
                  <li>3. Validator Consensus: Move verified by validators</li>
                  <li>4. Block Creation: Move recorded in blockchain</li>
                  <li>5. Reward Distribution: Shards awarded for victories</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsensusTest;
