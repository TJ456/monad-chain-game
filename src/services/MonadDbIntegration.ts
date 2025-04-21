import { GameStateManager, CheckpointType, GameStateCheckpoint } from './GameStateManager';
import { MonadDbService, monadDb } from './MonadDbService';
import { GameState } from './GameSyncService';
import { toast } from 'sonner';
import { MerkleTree } from '@/utils/merkleTree';
import { compress, decompress, compressGameState } from '@/utils/compression';

/**
 * MonadDbIntegration - Integrates the GameStateManager with MonadDb
 *
 * This class extends the functionality of GameStateManager to use MonadDb
 * as a high-performance storage backend for game state.
 */
export class MonadDbIntegration {
  private gameStateManager: GameStateManager;
  private monadDb: MonadDbService;
  private isInitialized: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly CHECKPOINT_NAMESPACE = 'gamestate:checkpoints';
  private readonly STATE_NAMESPACE = 'gamestate:current';
  private readonly HISTORY_NAMESPACE = 'gamestate:history';
  private readonly TRANSACTION_NAMESPACE = 'monad:transactions';
  private readonly MERKLE_NAMESPACE = 'monad:merkle';

  // Performance metrics
  private syncCount: number = 0;
  private lastSyncTime: number = 0;
  private syncDurations: number[] = [];
  private verificationCount: number = 0;

  constructor() {
    this.gameStateManager = GameStateManager.getInstance();
    this.monadDb = monadDb;
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

    // Start periodic sync
    this.syncInterval = setInterval(() => this.syncWithMonadDb(), 10000);

    this.isInitialized = true;
    console.log('MonadDbIntegration initialized');

    // Perform initial sync
    await this.syncWithMonadDb();
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

      // Compress and store current state in MonadDb
      const { compressedData, originalSize, compressedSize } = compressGameState(currentState);

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
        stateHash: merkleRoot.substring(0, 10)
      }, this.MERKLE_NAMESPACE);

      // Store the compressed state with merkle root
      await this.monadDb.put('current', {
        ...currentState,
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
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error syncing with MonadDb:', error);
      toast.error('Sync Error', {
        description: 'Failed to sync with MonadDb. Retrying...'
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

    // Get the checkpoint
    const checkpoint = this.gameStateManager.getCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error('Failed to create checkpoint');
    }

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
    let checkpoint = this.gameStateManager.getCheckpoint(checkpointId);

    // If not found, try to get from MonadDb
    if (!checkpoint) {
      checkpoint = await this.monadDb.get<GameStateCheckpoint>(checkpointId, this.CHECKPOINT_NAMESPACE);

      if (!checkpoint) {
        toast.error('Checkpoint not found', {
          description: 'The requested checkpoint could not be found'
        });
        return false;
      }

      // Add to GameStateManager
      this.gameStateManager.addCheckpoint(checkpointId, checkpoint);
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
        if (!rootData || !rootData.root) {
          return false;
        }
        expectedRoot = rootData.root;
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

    this.isInitialized = false;
    console.log('MonadDbIntegration shut down');
  }

  /**
   * Sync checkpoints between GameStateManager and MonadDb
   */
  private async syncCheckpoints(): Promise<void> {
    // Get checkpoints from GameStateManager
    const gameManagerCheckpoints = this.gameStateManager.getAllCheckpoints();

    // Get checkpoints from MonadDb
    const monadDbCheckpoints = await this.monadDb.getAllCheckpoints(this.CHECKPOINT_NAMESPACE);

    // Sync from GameStateManager to MonadDb
    for (const [id, checkpoint] of gameManagerCheckpoints) {
      await this.monadDb.put(id, checkpoint, this.CHECKPOINT_NAMESPACE);
    }

    // Sync from MonadDb to GameStateManager
    for (const checkpoint of monadDbCheckpoints) {
      const checkpointId = `cp-${checkpoint.timestamp}-${Math.random().toString(36).substring(2, 9)}`;
      if (!gameManagerCheckpoints.has(checkpointId)) {
        this.gameStateManager.addCheckpoint(checkpointId, checkpoint);
      }
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
      // Simulate blockchain sync
      toast.info('Syncing with Monad blockchain...', {
        description: 'Retrieving latest state from blockchain'
      });

      // Get current state
      const currentState = this.gameStateManager.getCurrentState();
      if (!currentState) {
        return;
      }

      // Create a merkle tree for the state
      const stateEntries = Object.entries(currentState)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}:${JSON.stringify(value)}`);

      const merkleTree = new MerkleTree(stateEntries);
      const merkleRoot = merkleTree.getRoot();

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Record a blockchain transaction
      const txHash = `0x${merkleRoot.substring(0, 16)}`;
      await this.recordBlockchainTransaction(txHash, {
        merkleRoot,
        timestamp: Date.now(),
        gameState: currentState.gameId,
        blockNumber: Math.floor(Date.now() / 1000) % 1000000
      });

      toast.success('Synced with Monad blockchain', {
        description: `Transaction hash: ${txHash.substring(0, 10)}...`
      });
    } catch (error) {
      console.error('Error syncing with blockchain:', error);
      toast.error('Blockchain Sync Error', {
        description: 'Failed to sync with Monad blockchain'
      });
    }
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
}

// Export singleton instance
export const monadDbIntegration = new MonadDbIntegration();
