import { PBFTConsensus, ConsensusBlock, ConsensusMessage } from './consensus';
import { monadDb } from './MonadDbService';
import { stateSyncService } from './StateSyncService';
import { toast } from 'sonner';
import { MerkleTree } from '@/utils/merkleTree';
import { StateSyncPriority } from '@/types/sync';
import { GameStateManager, CheckpointType } from './GameStateManager';

// Forward declaration to avoid circular dependency
interface GameConsensusServiceType {
    initialize(validators: string[], nodeId: string, config?: any): Promise<void>;
    handleGameConsensusMessage(message: ConsensusMessage): Promise<void>;
}

// Reference to the game consensus service, to be set later
let gameConsensusService: GameConsensusServiceType | null = null;

// Function to set the game consensus service reference
export function setGameConsensusService(service: GameConsensusServiceType): void {
    gameConsensusService = service;
}

/**
 * ConsensusIntegration - Connects PBFT consensus with MonadDb and state sync
 *
 * This service handles:
 * - Block validation and storage in MonadDb
 * - State synchronization after block commits
 * - Merkle tree verification of block state
 */
export class ConsensusIntegration {
    private static instance: ConsensusIntegration;
    private consensus: PBFTConsensus;
    private gameStateManager: GameStateManager;
    private readonly BLOCK_NAMESPACE = 'monad:blocks';
    private readonly CONSENSUS_NAMESPACE = 'monad:consensus';
    private isInitialized: boolean = false;
    private gameConsensusEnabled: boolean = false;

    private constructor() {
        this.consensus = PBFTConsensus.getInstance();
        this.gameStateManager = GameStateManager.getInstance();
    }

    public static getInstance(): ConsensusIntegration {
        if (!ConsensusIntegration.instance) {
            ConsensusIntegration.instance = new ConsensusIntegration();
        }
        return ConsensusIntegration.instance;
    }

    public async initialize(validators: string[], nodeId: string, enableGameConsensus: boolean = true): Promise<void> {
        if (this.isInitialized) {
            console.warn('ConsensusIntegration already initialized');
            return;
        }

        // Initialize PBFT consensus
        await this.consensus.initialize(validators, nodeId);

        // Initialize required namespaces in MonadDb
        await this.setupNamespaces();

        // Initialize game consensus if enabled
        this.gameConsensusEnabled = enableGameConsensus;
        if (enableGameConsensus && gameConsensusService) {
            try {
                await gameConsensusService.initialize(validators, nodeId);
            } catch (error) {
                console.error('Error initializing game consensus service:', error);
                // Continue initialization even if game consensus fails
            }
        } else if (enableGameConsensus) {
            console.warn('Game consensus service not available yet, will be initialized later');
        }

        this.isInitialized = true;
        console.log('ConsensusIntegration initialized');
    }

    /**
     * Submit transactions for consensus and block creation
     */
    public async submitTransactions(transactions: string[]): Promise<ConsensusBlock | null> {
        if (!this.isInitialized) {
            throw new Error('ConsensusIntegration not initialized');
        }

        try {
            const block = await this.consensus.proposeBlock(transactions);
            if (block) {
                // Store the proposed block
                await this.storeBlock(block);

                // If game consensus is enabled, also process game-specific logic
                if (this.gameConsensusEnabled) {
                    // Extract game state updates from transactions
                    const gameStateUpdates = this.extractGameStateUpdates(transactions);
                    if (gameStateUpdates.length > 0) {
                        // Update game state manager with the latest state
                        const latestGameState = gameStateUpdates[gameStateUpdates.length - 1];
                        this.gameStateManager.updateState(latestGameState, true);
                    }
                }

                return block;
            }
            return null;
        } catch (error) {
            console.error('Error submitting transactions:', error);
            toast.error('Transaction submission failed', {
                description: 'Failed to submit transactions for consensus'
            });
            return null;
        }
    }

    /**
     * Handle a new consensus message
     */
    public async handleConsensusMessage(message: ConsensusMessage): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('ConsensusIntegration not initialized');
        }

        try {
            await this.consensus.handleMessage(message);

            // Store consensus message for audit
            await this.storeConsensusMessage(message);

            // If game consensus is enabled, also handle in game consensus service
            if (this.gameConsensusEnabled && gameConsensusService) {
                try {
                    await gameConsensusService.handleGameConsensusMessage(message);
                } catch (gameError) {
                    console.error('Error handling message in game consensus service:', gameError);
                    // Continue processing even if game consensus handling fails
                }
            } else if (this.gameConsensusEnabled) {
                console.warn('Game consensus service not available for message handling');
            }
        } catch (error) {
            console.error('Error handling consensus message:', error);
        }
    }

    /**
     * Store a block in MonadDb
     */
    private async storeBlock(block: ConsensusBlock): Promise<void> {
        const merkleRoot = new MerkleTree([JSON.stringify(block)]).getRoot();

        await monadDb.put(`block-${block.number}`, {
            ...block,
            _merkleRoot: merkleRoot,
            _timestamp: Date.now()
        }, this.BLOCK_NAMESPACE);

        // Trigger state sync after block storage
        await this.syncBlockState(block);
    }

    /**
     * Store a consensus message in MonadDb
     */
    private async storeConsensusMessage(message: ConsensusMessage): Promise<void> {
        const messageId = `${message.type}-${message.viewNumber}-${message.sequenceNumber}`;

        await monadDb.put(messageId, {
            ...message,
            _timestamp: Date.now()
        }, this.CONSENSUS_NAMESPACE);
    }

    /**
     * Sync state after block commit
     */
    private async syncBlockState(block: ConsensusBlock): Promise<void> {
        try {
            // Request state sync to this block
            const syncId = await stateSyncService.requestSync({
                targetBlock: block.number,
                includeAccounts: true,
                includeStorage: true,
                priority: StateSyncPriority.HIGH
            });

            console.log(`Initiated state sync for block ${block.number}, sync ID: ${syncId}`);

            // If game consensus is enabled, create a checkpoint after sync
            if (this.gameConsensusEnabled) {
                const gameState = this.gameStateManager.getCurrentState();
                if (gameState) {
                    this.gameStateManager.createCheckpoint(CheckpointType.SYNC_COMPLETE);
                }
            }
        } catch (error) {
            console.error('Error syncing block state:', error);
            toast.error('State sync failed', {
                description: `Failed to sync state for block ${block.number}`
            });
        }
    }

    /**
     * Setup required MonadDb namespaces
     */
    private async setupNamespaces(): Promise<void> {
        // Ensure MonadDb is initialized
        if (!monadDb['isInitialized']) {
            console.warn('MonadDb not initialized, initializing now...');
            try {
                await monadDb.initialize({
                    cacheSize: 512, // 512MB cache
                    persistToDisk: true,
                    logLevel: 'info'
                });
                console.log('MonadDb initialized from ConsensusIntegration');
            } catch (error) {
                console.error('Failed to initialize MonadDb from ConsensusIntegration:', error);
                throw new Error('MonadDb initialization failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }

        // This ensures the namespaces are properly initialized in MonadDb
        try {
            await monadDb.put('namespace-init', {
                timestamp: Date.now(),
                initialized: true
            }, this.BLOCK_NAMESPACE);

            await monadDb.put('namespace-init', {
                timestamp: Date.now(),
                initialized: true
            }, this.CONSENSUS_NAMESPACE);

            console.log('ConsensusIntegration namespaces initialized');
        } catch (error) {
            console.error('Error setting up namespaces:', error);
            throw error;
        }
    }

    /**
     * Get the latest committed block
     */
    public async getLatestBlock(): Promise<ConsensusBlock | null> {
        if (!this.isInitialized) {
            console.warn('ConsensusIntegration not initialized when getting latest block');
            return null;
        }

        try {
            const blocks = await monadDb.getAllInNamespace<ConsensusBlock>(this.BLOCK_NAMESPACE);
            if (!blocks.length) return null;

            // Sort by block number and return the latest
            return blocks.sort((a, b) => b.number - a.number)[0];
        } catch (error) {
            console.error('Error getting latest block:', error);
            return null;
        }
    }

    /**
     * Verify the integrity of the block chain
     */
    public async verifyChainIntegrity(): Promise<boolean> {
        const blocks = await monadDb.getAllInNamespace<ConsensusBlock>(this.BLOCK_NAMESPACE);
        if (!blocks.length) return true;

        // Sort blocks by number
        blocks.sort((a, b) => a.number - b.number);

        // Verify each block's parent hash matches the previous block
        for (let i = 1; i < blocks.length; i++) {
            const currentBlock = blocks[i];
            const previousBlock = blocks[i - 1];
            const calculatedHash = new MerkleTree([JSON.stringify(previousBlock)]).getRoot();

            if (currentBlock.parentHash !== calculatedHash) {
                console.error(`Chain integrity violation at block ${currentBlock.number}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Extract game state updates from transactions
     * @param transactions Array of transaction strings
     * @returns Array of game state objects
     */
    private extractGameStateUpdates(transactions: string[]): any[] {
        const gameStateUpdates: any[] = [];

        for (const tx of transactions) {
            try {
                const txData = JSON.parse(tx);

                // Check if this is a game state update transaction
                if (txData.type === 'GAME_STATE_UPDATE' && txData.gameState) {
                    gameStateUpdates.push(txData.gameState);
                }
            } catch (error) {
                console.warn('Failed to parse transaction:', error);
            }
        }

        return gameStateUpdates;
    }
}

// Export singleton instance
export const consensusIntegration = ConsensusIntegration.getInstance();