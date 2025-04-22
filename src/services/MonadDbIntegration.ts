import { GameStateManager, CheckpointType, GameStateCheckpoint } from './GameStateManager';
import { MonadDbService, monadDb } from './MonadDbService';
import { GameState } from './GameSyncService';
import { StateSyncService, stateSyncService } from './StateSyncService';
import { StateSyncPriority } from '@/types/sync';
import { toast } from 'sonner';
import { MerkleTree } from '@/utils/merkleTree';
import { compressGameState } from '@/utils/compression';
import { consensusIntegration } from './ConsensusIntegration';
import { ConsensusBlock } from './consensus';

/**
 * MonadDbIntegration - Integrates the GameStateManager with MonadDb
 *
 * This class extends the functionality of GameStateManager to use MonadDb
 * as a high-performance storage backend for game state.
 */
export class MonadDbIntegration {
  private gameStateManager: GameStateManager;
  private monadDb: MonadDbService;
  private stateSyncService: StateSyncService;
  private isInitialized: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly CHECKPOINT_NAMESPACE = 'gamestate:checkpoints';
  private readonly STATE_NAMESPACE = 'gamestate:current';
  // Namespace for storing game state history
  private readonly HISTORY_NAMESPACE = 'gamestate:history';
  private readonly TRANSACTION_NAMESPACE = 'monad:transactions';
  private readonly MERKLE_NAMESPACE = 'monad:merkle';
  private readonly BLOCKCHAIN_NAMESPACE = 'monad:blockchain';
  private readonly STATESYNC_NAMESPACE = 'monad:statesync';
  private readonly CONSENSUS_BLOCKS_NAMESPACE = 'monad:consensus:blocks';
  private consensusEnabled: boolean = false;

  // Performance metrics
  private syncCount: number = 0;
  private lastSyncTime: number = 0;
  private syncDurations: number[] = [];
  private verificationCount: number = 0;

  constructor() {
    this.gameStateManager = GameStateManager.getInstance();
    this.monadDb = monadDb;
    this.stateSyncService = stateSyncService;
  }

  /**
   * Initialize the integration
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('MonadDbIntegration already initialized');
      return;
    }

    // Initialize MonadDb if not already initialized
    if (!this.monadDb['isInitialized']) {
      this.monadDb.initialize({
        cacheSize: 512, // 512MB cache
        persistToDisk: true,
        logLevel: 'info'
      });
    }

    // Initialize StateSyncService
    if (!this.stateSyncService['isInitialized']) {
      this.stateSyncService.initialize();
    }

    // Initialize consensus with dummy validators for now
    // In a real implementation, validators would be fetched from the network
    await consensusIntegration.initialize(
      ['validator1', 'validator2', 'validator3', 'validator4'],
      'validator1' // This node's ID
    );
    this.consensusEnabled = true;

    // Start periodic sync
    this.syncInterval = setInterval(() => this.syncWithMonadDb(), 10000);

    this.isInitialized = true;
    console.log('MonadDbIntegration initialized');

    // Perform initial sync
    await this.syncWithMonadDb();

    // Add listener for state sync updates
    this.stateSyncService.addSyncListener(this.handleStateSyncUpdate.bind(this));
  }

  /**
   * Sync game state with MonadDb
   */
  public async syncWithMonadDb(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    const startTime = performance.now();
    this.syncCount++;

    try {
      // Get current state from GameStateManager
      const currentState = this.gameStateManager.getCurrentState();
      if (!currentState) {
        return;
      }

      // Get latest consensus block
      const latestBlock = await consensusIntegration.getLatestBlock();
      
      // Create state entry
      const stateEntry = {
        ...currentState,
        _blockNumber: latestBlock?.number || 0,
        _blockHash: latestBlock?.merkleRoot || '0'.repeat(64),
        _timestamp: Date.now()
      };

      // Submit state update as transaction if consensus is enabled
      if (this.consensusEnabled) {
        const transactions = [JSON.stringify(stateEntry)];
        const block = await consensusIntegration.submitTransactions(transactions);
        if (block) {
          console.log(`State update included in block ${block.number}`);
        }
      }

      // Compress and store current state in MonadDb
      const { compressedData, originalSize, compressedSize } = compressGameState(stateEntry);

      // Create a merkle tree for the state
      const stateEntries = Object.entries(currentState)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}:${JSON.stringify(value)}`);

      const merkleTree = new MerkleTree(stateEntries);
      const merkleRoot = merkleTree.getRoot();

      // Store the merkle root
      await this.monadDb.put('currentStateRoot', {
        root: merkleRoot,
        timestamp: Date.now(),
        stateHash: merkleRoot.substring(0, 10),
        blockNumber: latestBlock?.number || 0
      }, this.MERKLE_NAMESPACE);

      // Store the compressed state with merkle root
      await this.monadDb.put('current', {
        ...stateEntry,
        _compressed: true,
        _compressedData: compressedData,
        _originalSize: originalSize,
        _compressedSize: compressedSize,
        _merkleRoot: merkleRoot,
        _lastSync: Date.now()
      }, this.STATE_NAMESPACE);

      // Sync checkpoints
      await this.syncCheckpoints();

      // Record sync metrics
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.syncDurations.push(duration);
      if (this.syncDurations.length > 10) {
        this.syncDurations.shift(); // Keep only last 10 sync durations
      }
      this.lastSyncTime = Date.now();

      console.log(`Synced game state with MonadDb in ${duration.toFixed(2)}ms`);

      // Record a transaction for this sync
      await this.recordSyncTransaction(merkleRoot, {
        syncTime: duration,
        compressionRatio: originalSize / compressedSize,
        timestamp: Date.now(),
        blockNumber: latestBlock?.number || 0
      });
    } catch (error) {
      console.error('Error syncing with MonadDb:', error);
      toast.error('Sync Error', {
        description: 'Failed to sync with MonadDb. Retrying...'
      });
    }
  }

  /**
   * Sync with blockchain
   */
  public async syncWithBlockchain(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    try {
      // Notify user of sync start
      toast.info('Syncing with Monad blockchain...', {
        description: 'Retrieving latest state from blockchain'
      });

      // Verify chain integrity first
      const isChainValid = await consensusIntegration.verifyChainIntegrity();
      if (!isChainValid) {
        throw new Error('Blockchain integrity check failed');
      }

      // Get current state
      const currentState = this.gameStateManager.getCurrentState();
      if (!currentState) {
        return;
      }

      // Get latest consensus block
      const latestBlock = await consensusIntegration.getLatestBlock();
      if (!latestBlock) {
        console.warn('No consensus blocks available');
        return;
      }

      // Request sync to latest block
      const syncId = await this.stateSyncService.requestSync({
        targetBlock: latestBlock.number,
        includeAccounts: true,
        includeStorage: true,
        priority: StateSyncPriority.HIGH
      });

      // Record the sync request in MonadDb
      await this.monadDb.put(`sync-${syncId}`, {
        syncId,
        targetBlock: latestBlock.number,
        blockHash: latestBlock.merkleRoot,
        timestamp: Date.now(),
        gameState: currentState.roomCode || 'unknown'
      }, this.STATESYNC_NAMESPACE);

      toast.success('Synced with Monad blockchain', {
        description: `Synced to block ${latestBlock.number}`
      });
    } catch (error) {
      console.error('Error syncing with blockchain:', error);
      toast.error('Blockchain Sync Error', {
        description: 'Failed to sync with Monad blockchain'
      });
    }
  }

  /**
   * Create a checkpoint and store it in MonadDb
   */
  public async createCheckpoint(type: CheckpointType, moveId?: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    // Create checkpoint using GameStateManager
    const checkpointId = this.gameStateManager.createCheckpoint(type, moveId);

    // Get all checkpoints
    const checkpoints = this.gameStateManager.getCheckpoints();
    const checkpointEntry = checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpointEntry) {
      throw new Error('Failed to create checkpoint');
    }

    const checkpoint = checkpointEntry.checkpoint;

    // Store in MonadDb
    await this.monadDb.put(checkpointId, checkpoint, this.CHECKPOINT_NAMESPACE);

    return checkpointId;
  }

  /**
   * Restore a checkpoint from MonadDb
   */
  public async restoreCheckpoint(checkpointId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    // Try to get checkpoint from GameStateManager first
    const checkpoints = this.gameStateManager.getCheckpoints();
    const checkpointEntry = checkpoints.find(cp => cp.id === checkpointId);
    let checkpoint = checkpointEntry?.checkpoint;

    // If not found, try to get from MonadDb
    if (!checkpoint) {
      const dbCheckpoint = await this.monadDb.get(checkpointId, this.CHECKPOINT_NAMESPACE);

      if (!dbCheckpoint) {
        toast.error('Checkpoint not found', {
          description: 'The requested checkpoint could not be found'
        });
        return false;
      }

      checkpoint = dbCheckpoint as GameStateCheckpoint;

      // We can't directly add to GameStateManager as it doesn't have an addCheckpoint method
      // Instead, we'll create a new checkpoint with this data
      this.gameStateManager.createCheckpoint(checkpoint.type, checkpoint.moveId);
    }

    // Restore using GameStateManager
    return this.gameStateManager.restoreCheckpoint(checkpointId);
  }

  /**
   * Get all checkpoints from MonadDb
   */
  public async getAllCheckpoints(): Promise<GameStateCheckpoint[]> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    return this.monadDb.getAllCheckpoints(this.CHECKPOINT_NAMESPACE);
  }

  /**
   * Update game state and store in MonadDb
   */
  public async updateState(newState: Partial<GameState>, recordHistory: boolean = true): Promise<GameState> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    // Update state using GameStateManager
    const updatedState = this.gameStateManager.updateState(newState, recordHistory);

    // Store in MonadDb
    await this.monadDb.put('current', updatedState, this.STATE_NAMESPACE);

    return updatedState;
  }

  /**
   * Get the current state from MonadDb
   */
  public async getCurrentState(): Promise<GameState | null> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    // Try to get from GameStateManager first
    const state = this.gameStateManager.getCurrentState();
    if (state) {
      return state;
    }

    // If not found, try to get from MonadDb
    return this.monadDb.get<GameState>('current', this.STATE_NAMESPACE);
  }

  /**
   * Verify the current state against a Merkle root
   */
  public async verifyCurrentState(expectedRoot?: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    this.verificationCount++;

    try {
      // Get the current state
      const currentState = await this.getCurrentState();
      if (!currentState) {
        return false;
      }

      // If no expected root provided, get the latest one from MonadDb
      if (!expectedRoot) {
        const rootData = await this.monadDb.get('currentStateRoot', this.MERKLE_NAMESPACE);
        if (!rootData || !(rootData as any).root) {
          return false;
        }
        expectedRoot = (rootData as any).root;
      }

      // Create a merkle tree for the current state
      const stateEntries = Object.entries(currentState)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}:${JSON.stringify(value)}`);

      const merkleTree = new MerkleTree(stateEntries);
      const actualRoot = merkleTree.getRoot();

      // Compare roots
      const isValid = actualRoot === expectedRoot;

      // Record verification result
      await this.monadDb.put(`verification-${Date.now()}`, {
        isValid,
        expectedRoot,
        actualRoot,
        timestamp: Date.now()
      }, this.MERKLE_NAMESPACE);

      return isValid;
    } catch (error) {
      console.error('Error verifying state:', error);
      return false;
    }
  }

  /**
   * Get MonadDb statistics
   */
  public getMonadDbStats(): any {
    const dbStats = this.monadDb.getStats();

    // Calculate average sync time
    const avgSyncTime = this.syncDurations.length > 0
      ? this.syncDurations.reduce((sum, time) => sum + time, 0) / this.syncDurations.length
      : 0;

    return {
      ...dbStats,
      syncCount: this.syncCount,
      lastSyncTime: this.lastSyncTime,
      averageSyncTime: avgSyncTime,
      verificationCount: this.verificationCount,
      integrityVerified: this.lastSyncTime > 0
    };
  }

  /**
   * Shutdown the integration
   */
  public shutdown(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Final sync
    this.syncWithMonadDb().catch(console.error);

    // Shutdown state sync service
    this.stateSyncService.shutdown();

    this.isInitialized = false;
    console.log('MonadDbIntegration shut down');
  }

  /**
   * Sync checkpoints between GameStateManager and MonadDb
   */
  private async syncCheckpoints(): Promise<void> {
    // Get checkpoints from GameStateManager
    const gameManagerCheckpoints = this.gameStateManager.getCheckpoints();

    // Get checkpoints from MonadDb (commented out for now as we're not using it)
    // const monadDbCheckpoints = await this.monadDb.getAllCheckpoints(this.CHECKPOINT_NAMESPACE);

    // Sync from GameStateManager to MonadDb
    for (const { id, checkpoint } of gameManagerCheckpoints) {
      await this.monadDb.put(id, checkpoint, this.CHECKPOINT_NAMESPACE);
    }

    // Sync from MonadDb to GameStateManager is more complex since we can't directly add checkpoints
    // For now, we'll just ensure the MonadDb has all the checkpoints from the GameStateManager
    // In a real implementation, we would need to handle this differently
  }

  /**
   * Record a sync transaction
   */
  private async recordSyncTransaction(merkleRoot: string, data: any): Promise<void> {
    const txId = `sync-${Date.now()}`;
    await this.monadDb.put(txId, {
      type: 'sync',
      merkleRoot,
      ...data
    }, this.TRANSACTION_NAMESPACE);
  }

  /**
   * Record a blockchain transaction
   */
  private async recordBlockchainTransaction(txHash: string, data: any): Promise<void> {
    await this.monadDb.put(txHash, {
      type: 'blockchain',
      ...data
    }, this.TRANSACTION_NAMESPACE);
  }

  /**
   * Sync to a specific block
   *
   * @param blockNumber The target block number to sync to
   * @returns Promise resolving to the sync ID
   */
  public async syncToBlock(blockNumber: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    try {
      // Notify user of sync start
      toast.info(`Syncing to block ${blockNumber}...`, {
        description: 'Retrieving state from Monad blockchain'
      });

      // Request sync to the specified block
      const syncId = await this.stateSyncService.requestSync({
        targetBlock: blockNumber,
        includeAccounts: true,
        includeStorage: true,
        priority: StateSyncPriority.MEDIUM
      });

      // Get current state
      const currentState = this.gameStateManager.getCurrentState();
      if (currentState) {
        // Record the sync request in MonadDb
        await this.monadDb.put(`sync-${syncId}`, {
          syncId,
          targetBlock: blockNumber,
          timestamp: Date.now(),
          gameState: currentState.roomCode || 'unknown'
        }, this.STATESYNC_NAMESPACE);
      }

      return syncId;
    } catch (error) {
      console.error(`Error syncing to block ${blockNumber}:`, error);
      toast.error('Block Sync Error', {
        description: `Failed to sync to block ${blockNumber}`
      });
      throw error;
    }
  }

  /**
   * Get state sync statistics
   *
   * @returns State sync statistics
   */
  public getStateSyncStats(): any {
    if (!this.isInitialized) {
      throw new Error('MonadDbIntegration not initialized');
    }

    return this.stateSyncService.getStats();
  }

  /**
   * Handle state sync status updates
   *
   * @param status The updated sync status
   */
  private handleStateSyncUpdate(status: any): void {
    // Store the status update in MonadDb
    this.monadDb.put(`status-${status.syncId}`, status, this.STATESYNC_NAMESPACE)
      .catch(error => console.error('Error storing sync status:', error));

    // If sync completed, update game state with blockchain data
    if (status.status === 'completed') {
      this.processCompletedSync(status.syncId)
        .catch(error => console.error('Error processing completed sync:', error));
    }
  }

  /**
   * Process a completed sync
   *
   * @param syncId The sync ID
   */
  private async processCompletedSync(syncId: string): Promise<void> {
    try {
      // Verify the sync
      const verification = await this.stateSyncService.verifySync(syncId);

      if (!verification.isValid) {
        console.error('Sync verification failed:', verification.errors);
        toast.error('Sync Verification Failed', {
          description: 'The synced state could not be verified'
        });
        return;
      }

      // Get the sync status
      const status = this.stateSyncService.getSyncStatus(syncId);
      if (!status) {
        console.error('Sync status not found for ID:', syncId);
        return;
      }

      // Get block header for the target block
      const blockHeader = this.stateSyncService.getBlockHeader(status.targetBlock);
      if (!blockHeader) {
        console.error('Block header not found for block:', status.targetBlock);
        return;
      }

      // Create a checkpoint for this sync
      const checkpointId = await this.createCheckpoint(CheckpointType.SYNC_COMPLETE);

      // Record the successful sync in MonadDb
      await this.monadDb.put(`completed-${syncId}`, {
        syncId,
        targetBlock: status.targetBlock,
        blockHash: blockHeader.blockHash,
        timestamp: Date.now(),
        checkpointId,
        verification
      }, this.BLOCKCHAIN_NAMESPACE);

      toast.success('State sync verified', {
        description: `Successfully verified sync to block ${status.targetBlock}`
      });
    } catch (error) {
      console.error('Error processing completed sync:', error);
    }
  }
}

// Export singleton instance
export const monadDbIntegration = new MonadDbIntegration();
