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

      // Create a mock game state update
      const gameState = {
        roomCode: 'test-room',
        playerHealth: 20,
        opponentHealth: 15,
        currentTurn: 'player',
        moveHistory: ['move1', 'move2', 'move3'],
        timestamp: Date.now()
      };

      console.log('Submitting game state update to create a block...');

      // Submit the game state update to create a new block
      try {
        const result = await gameConsensusService.submitGameStateUpdate(gameState);

        if (result) {
          toast.success('Block created', {
            description: `Block #${result.number} has been created and committed`
          });
        } else {
          toast.info('Block creation pending', {
            description: 'The transaction has been submitted and is waiting to be included in a block'
          });
        }
      } catch (submitError) {
        console.error('Error submitting game state update:', submitError);
        toast.error('Failed to submit game state', {
          description: submitError instanceof Error ? submitError.message : 'An unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Failed to create block', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
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
                Create Test Block
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
            <CardTitle>About Monad BFT Consensus</CardTitle>
            <CardDescription>Practical Byzantine Fault Tolerance for game state</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Monad BFT consensus system implements a Byzantine Fault Tolerance algorithm
              specifically designed for game state synchronization. It ensures that all players
              have a consistent view of the game state, even in the presence of malicious actors
              or network failures.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Key Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PBFT consensus with 3f+1 fault tolerance</li>
                  <li>• Merkle tree verification of game states</li>
                  <li>• Automatic checkpointing and recovery</li>
                  <li>• Integration with MonadDb for state storage</li>
                </ul>
              </div>
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Consensus Process</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Pre-prepare: Primary proposes a block</li>
                  <li>2. Prepare: Validators verify and prepare the block</li>
                  <li>3. Commit: Validators commit the block</li>
                  <li>4. Reply: State is updated and synchronized</li>
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
