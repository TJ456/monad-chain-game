import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { monadDb } from '../services/MonadDbService';
import { nftPropagationService } from '../services/NFTPropagationService';
import { raptorCastService } from '../services/RaptorCastService';
import { initializeServices } from '../services/initServices';
import { RefreshCw, Plus, AlertCircle, Database } from 'lucide-react';

// Known valid transaction hash on Monad testnet for demo purposes
const DEMO_TX_HASH = '0x7d5cb9018c18bfaa9e4e7b5f7c9b3070f8a1655a5bc4a8fe8b6d20a2c3a616c0';

interface BlockchainHistoryCreatorProps {
  onHistoryCreated?: () => void;
}

const BlockchainHistoryCreator: React.FC<BlockchainHistoryCreatorProps> = ({
  onHistoryCreated
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Check if services are initialized when component mounts
  useEffect(() => {
    const initializeRequiredServices = async () => {
      try {
        // Step 1: Check if MonadDb is already initialized
        if (!monadDb['isInitialized']) {
          console.log('Initializing MonadDb...');
          try {
            await monadDb.initialize({
              cacheSize: 512, // 512MB cache
              persistToDisk: true,
              logLevel: 'info'
            });
            console.log('MonadDb initialized successfully');
          } catch (dbError) {
            console.error('Error initializing MonadDb:', dbError);
            throw new Error(`Failed to initialize database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
          }
        } else {
          console.log('MonadDb is already initialized');
        }

        // Step 2: Initialize NFTPropagationService
        if (!nftPropagationService['isInitialized']) {
          console.log('Initializing NFTPropagationService...');
          try {
            await nftPropagationService.initialize();
            console.log('NFTPropagationService initialized successfully');
          } catch (nftError) {
            console.error('Error initializing NFTPropagationService:', nftError);
            throw new Error(`Failed to initialize NFT service: ${nftError instanceof Error ? nftError.message : 'Unknown error'}`);
          }
        } else {
          console.log('NFTPropagationService is already initialized');
        }

        // Step 3: Initialize RaptorCastService if needed
        if (!raptorCastService['isInitialized']) {
          console.log('Initializing RaptorCastService...');
          try {
            await raptorCastService.initialize();
            console.log('RaptorCastService initialized successfully');
          } catch (raptorError) {
            console.error('Error initializing RaptorCastService:', raptorError);
            throw new Error(`Failed to initialize RaptorCast service: ${raptorError instanceof Error ? raptorError.message : 'Unknown error'}`);
          }
        } else {
          console.log('RaptorCastService is already initialized');
        }

        // All services initialized successfully
        setIsDbInitialized(true);
        setInitializationError(null);
      } catch (error) {
        console.error('Error initializing services:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error initializing services');
      }
    };

    initializeRequiredServices();
  }, []);

  const createHistoryEntry = async () => {
    setIsCreating(true);

    try {
      // Check if all required services are initialized
      if (!isDbInitialized) {
        console.log('Services not initialized, attempting to initialize...');
        try {
          // Initialize all required services
          await monadDb.initialize({
            cacheSize: 512, // 512MB cache
            persistToDisk: true,
            logLevel: 'info'
          });
          await nftPropagationService.initialize();
          await raptorCastService.initialize();

          console.log('All services initialized successfully');
          setIsDbInitialized(true);
          setInitializationError(null);
        } catch (initError) {
          console.error('Failed to initialize services:', initError);
          throw new Error('Required services not initialized. Please refresh the page and try again.');
        }
      }

      // Use a known valid transaction hash for demo purposes
      // This ensures the "View on Monad Explorer" link will work
      const txHash = DEMO_TX_HASH;
      const blockNumber = Math.floor(Date.now() / 1000) % 1000000;
      const timestamp = Date.now();
      const tokenId = Math.floor(Math.random() * 1000) + 1;

      // Create a blockchain history entry
      await monadDb.put(
        `blockchain-tx-${txHash}`,
        {
          txHash,
          blockNumber,
          timestamp,
          messageId: `msg-${Date.now()}`,
          merkleRoot: `merkle-${Date.now()}`,
          type: 'propagation',
          tokenId,
          name: `Crypto Card #${tokenId}`,
          status: 'confirmed',
          blockchainStatus: 'confirmed'
        },
        'blockchain-history'
      );

      console.log('Successfully created blockchain history entry');
      toast.success('Created blockchain history entry', {
        description: `Transaction ${txHash.substring(0, 10)}... added to blockchain history`
      });

      // Call the callback if provided
      if (onHistoryCreated) {
        onHistoryCreated();
      }
    } catch (error) {
      console.error('Error creating blockchain history entry:', error);
      toast.error('Failed to create blockchain history entry', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update initialization error if it's an initialization issue
      if (error instanceof Error && error.message.includes('not initialized')) {
        setInitializationError(error.message);
        setIsDbInitialized(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center my-4">
      {initializationError && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500/30 rounded-md flex flex-col text-sm text-red-300">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            <span className="font-medium">Initialization Error</span>
          </div>
          <p className="mt-1 ml-6 text-xs">{initializationError}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-800/40 self-start ml-6"
            onClick={async () => {
              setIsCreating(true);
              try {
                await monadDb.initialize({
                  cacheSize: 512,
                  persistToDisk: true,
                  logLevel: 'info'
                });

                await nftPropagationService.initialize();
                await raptorCastService.initialize();

                setIsDbInitialized(true);
                setInitializationError(null);
                toast.success('Services initialized successfully');
              } catch (error) {
                console.error('Error reinitializing services:', error);
                setInitializationError(`Failed to initialize services: ${error instanceof Error ? error.message : 'Unknown error'}`);
                toast.error('Failed to initialize services');
              } finally {
                setIsCreating(false);
              }
            }}
          >
            <Database className="w-3 h-3 mr-2" />
            Retry Initialization
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={createHistoryEntry}
        disabled={isCreating}
        className="bg-blue-900/30 border-blue-500/30 hover:bg-blue-800/40 hover:border-blue-500/50"
      >
        {isCreating ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        Create Blockchain Entry
      </Button>
    </div>
  );
};

export default BlockchainHistoryCreator;
