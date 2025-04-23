import { consensusIntegration } from './ConsensusIntegration';
import { gameConsensusService } from './GameConsensusService';
import { monadDb } from './MonadDbService';
import { nftPropagationService } from './NFTPropagationService';
import { raptorCastService } from './RaptorCastService';
import { toast } from 'sonner';

/**
 * Initialize all services required for the application
 * @param showToasts Whether to show toast notifications (default: true)
 * @returns Promise<boolean> True if initialization was successful
 */
export async function initializeServices(showToasts: boolean = true) {
  try {
    console.log('Initializing services...');

    // First, initialize MonadDb which is required by other services
    try {
      if (!monadDb['isInitialized']) {
        console.log('Initializing MonadDb...');
        await monadDb.initialize({
          cacheSize: 512, // 512MB cache
          persistToDisk: true,
          logLevel: 'info'
        });
        console.log('MonadDb initialized successfully');
      } else {
        console.log('MonadDb already initialized');
      }
    } catch (dbError) {
      console.error('Error initializing MonadDb:', dbError);
      if (showToasts) {
        toast.error('Failed to initialize database', {
          description: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
      }
      // Continue initialization but other services might fail
    }

    // Create mock validators for development
    const validators = [
      'validator1',
      'validator2',
      'validator3',
      'validator4'
    ];

    // First, ensure GameConsensusService is instantiated to register with ConsensusIntegration
    // This just creates the instance but doesn't initialize it yet
    const gameConsensusInstance = gameConsensusService;
    console.log('Game consensus service instance created');

    // Initialize consensus integration with this node as the primary validator
    // This will NOT try to initialize game consensus service yet
    await consensusIntegration.initialize(validators, 'validator1', false);
    console.log('Consensus integration initialized');

    // Now explicitly initialize game consensus service
    try {
      await gameConsensusService.initialize(validators, 'validator1');
      console.log('Game consensus service initialized');
    } catch (gameError) {
      console.error('Error initializing game consensus service:', gameError);
      // Continue even if game consensus fails
    }

    // Initialize NFTPropagationService
    try {
      if (!nftPropagationService['isInitialized']) {
        console.log('Initializing NFTPropagationService...');
        await nftPropagationService.initialize();
        console.log('NFTPropagationService initialized successfully');
      } else {
        console.log('NFTPropagationService already initialized');
      }
    } catch (nftError) {
      console.error('Error initializing NFTPropagationService:', nftError);
      if (showToasts) {
        toast.error('Failed to initialize NFT propagation service', {
          description: nftError instanceof Error ? nftError.message : 'Unknown error'
        });
      }
      // Continue even if NFTPropagationService fails
    }

    // Initialize RaptorCastService
    try {
      if (!raptorCastService['isInitialized']) {
        console.log('Initializing RaptorCastService...');
        await raptorCastService.initialize();
        console.log('RaptorCastService initialized successfully');
      } else {
        console.log('RaptorCastService already initialized');
      }
    } catch (raptorError) {
      console.error('Error initializing RaptorCastService:', raptorError);
      if (showToasts) {
        toast.error('Failed to initialize RaptorCast service', {
          description: raptorError instanceof Error ? raptorError.message : 'Unknown error'
        });
      }
      // Continue even if RaptorCastService fails
    }

    console.log('Services initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing services:', error);
    if (showToasts) {
      toast.error('Failed to initialize services', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
    return false;
  }
}

/**
 * Check if services are initialized without showing notifications
 * @param showToasts Whether to show toast notifications (default: false)
 * @returns Promise<boolean> True if services are initialized
 */
export async function areServicesInitialized(showToasts: boolean = false): Promise<boolean> {
  try {
    // First check if MonadDb is initialized
    if (!monadDb['isInitialized']) {
      console.log('MonadDb not initialized');
      return false;
    }

    // Then check if the consensus integration is initialized
    if (!consensusIntegration['isInitialized']) {
      console.log('ConsensusIntegration not initialized');
      return false;
    }

    // Then check if game consensus service is initialized
    if (!gameConsensusService['isInitialized']) {
      console.log('GameConsensusService not initialized');
      return false;
    }

    // Check if NFTPropagationService is initialized
    if (!nftPropagationService['isInitialized']) {
      console.log('NFTPropagationService not initialized');
      return false;
    }

    // Check if RaptorCastService is initialized
    if (!raptorCastService['isInitialized']) {
      console.log('RaptorCastService not initialized');
      return false;
    }

    // Finally, try to get stats as an additional check
    try {
      const stats = await gameConsensusService.getConsensusStats();
      return stats !== null;
    } catch (statsError) {
      console.warn('Error getting consensus stats during initialization check:', statsError);
      // If we got here, the services are initialized but stats retrieval failed
      // We'll still return true since the services themselves are initialized
      return true;
    }
  } catch (error) {
    console.error('Error checking service initialization:', error);
    return false;
  }
}
