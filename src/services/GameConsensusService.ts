import { PBFTConsensus, ConsensusBlock, ConsensusMessage, ConsensusMessageType } from './consensus';
import { ConsensusIntegration, setGameConsensusService } from './ConsensusIntegration';
import { GameState } from './GameSyncService';
import { GameStateManager } from './GameStateManager';
import { MerkleTree, createGameStateMerkleTree, verifyGameState } from '@/utils/merkleTree';
import { monadDb } from './MonadDbService';
import { toast } from 'sonner';

/**
 * Enhanced ConsensusBlock with game-specific data
 */
export interface GameConsensusBlock extends ConsensusBlock {
  gameStateRoot: string;
  gameMetadata: {
    roomCode?: string;
    playerCount: number;
    moveCount: number;
    gameMode?: string;
    roundNumber?: number;
  };
  validatorSignatures: Record<string, string>;
}

/**
 * Game-specific consensus configuration
 */
export interface GameConsensusConfig {
  blockTime: number;
  minValidators: number;
  maxValidators: number;
  gameStateVerificationEnabled: boolean;
  autoCheckpointBlocks: number;
  viewChangeTimeout: number;
}

/**
 * GameConsensusService - Implements Monad BFT consensus for game state
 *
 * This service extends the base consensus implementation with game-specific
 * features like:
 * - Game state validation in blocks
 * - Game-specific block metadata
 * - Integration with game state checkpoints
 * - Merkle tree verification of game states
 */
export class GameConsensusService {
  private static instance: GameConsensusService;
  private consensusIntegration: ConsensusIntegration;
  private gameStateManager: GameStateManager;
  private readonly GAME_CONSENSUS_NAMESPACE = 'monad:game:consensus';
  private readonly GAME_BLOCK_NAMESPACE = 'monad:game:blocks';
  private isInitialized: boolean = false;
  private config: GameConsensusConfig = {
    blockTime: 5000, // 5 seconds
    minValidators: 3,
    maxValidators: 7,
    gameStateVerificationEnabled: true,
    autoCheckpointBlocks: 5,
    viewChangeTimeout: 15000 // 15 seconds
  };
  private validators: string[] = [];
  private nodeId: string = '';
  private lastBlockTime: number = 0;
  private blockTimer: NodeJS.Timeout | null = null;
  private pendingTransactions: string[] = [];

  private constructor() {
    this.consensusIntegration = ConsensusIntegration.getInstance();
    this.gameStateManager = GameStateManager.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): GameConsensusService {
    if (!GameConsensusService.instance) {
      GameConsensusService.instance = new GameConsensusService();
      // Register this instance with ConsensusIntegration to break circular dependency
      setGameConsensusService(GameConsensusService.instance);
    }
    return GameConsensusService.instance;
  }

  /**
   * Initialize the game consensus service
   */
  public async initialize(
    validators: string[],
    nodeId: string,
    config?: Partial<GameConsensusConfig>
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameConsensusService already initialized');
      return;
    }

    // Store validators and node ID
    this.validators = validators;
    this.nodeId = nodeId;

    // Apply custom config if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize consensus integration if not already initialized
    if (!this.consensusIntegration['isInitialized']) {
      await this.consensusIntegration.initialize(validators, nodeId);
    }

    // Initialize namespaces
    await this.setupNamespaces();

    // Start block timer if this node is a validator
    if (validators.includes(nodeId)) {
      this.startBlockTimer();
    }

    this.isInitialized = true;
    console.log('GameConsensusService initialized');
    toast.success('Game consensus initialized', {
      description: `Connected as ${validators.includes(nodeId) ? 'validator' : 'observer'} node`
    });
  }

  /**
   * Submit a game state update for consensus
   */
  public async submitGameStateUpdate(gameState: GameState): Promise<GameConsensusBlock | null> {
    if (!this.isInitialized) {
      console.warn('GameConsensusService not initialized when submitting game state update');
      toast.error('Consensus not initialized', {
        description: 'Please initialize the consensus system first'
      });
      return null;
    }

    try {
      // Validate game state
      if (!gameState || typeof gameState !== 'object') {
        throw new Error('Invalid game state provided');
      }

      // Create game state merkle root
      const gameStateRoot = createGameStateMerkleTree(gameState).getRoot();

      // Create transaction with game state
      const transaction = JSON.stringify({
        type: 'GAME_STATE_UPDATE',
        gameState,
        gameStateRoot,
        timestamp: Date.now(),
        sender: this.nodeId
      });

      // Add to pending transactions
      this.pendingTransactions.push(transaction);
      console.log(`Added transaction to pending queue. Total pending: ${this.pendingTransactions.length}`);

      // If we're the primary validator, propose a block immediately
      // Otherwise, the transaction will be included in the next block
      if (this.isPrimaryValidator()) {
        console.log('This node is the primary validator, proposing block immediately');
        return await this.proposeGameBlock();
      } else {
        console.log('This node is not the primary validator, transaction will be included in next block');
        toast.info('Transaction submitted', {
          description: 'Waiting for primary validator to create block'
        });
      }

      return null;
    } catch (error) {
      console.error('Error submitting game state update:', error);
      toast.error('Game state update failed', {
        description: error instanceof Error ? error.message : 'Failed to submit game state for consensus'
      });
      // Don't rethrow the error to prevent app crashes
      return null;
    }
  }

  /**
   * Propose a new game block with pending transactions
   */
  private async proposeGameBlock(): Promise<GameConsensusBlock | null> {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    try {
      // Get current game state
      const gameState = this.gameStateManager.getCurrentState();
      if (!gameState) {
        throw new Error('No game state available');
      }

      // Submit transactions to consensus
      const block = await this.consensusIntegration.submitTransactions([...this.pendingTransactions]);
      if (!block) {
        return null;
      }

      // Create enhanced game block
      const gameBlock: GameConsensusBlock = {
        ...block,
        gameStateRoot: createGameStateMerkleTree(gameState).getRoot(),
        gameMetadata: {
          roomCode: gameState.roomCode,
          playerCount: 2, // Assuming 2 players for now
          moveCount: gameState.moveHistory?.length || 0,
          gameMode: gameState.gameMode,
          roundNumber: gameState.currentTurn
        },
        validatorSignatures: {
          [this.nodeId]: this.generateSignature(block)
        }
      };

      // Store the game block
      await this.storeGameBlock(gameBlock);

      // Clear pending transactions
      this.pendingTransactions = [];

      // Reset block timer
      this.resetBlockTimer();

      return gameBlock;
    } catch (error) {
      console.error('Error proposing game block:', error);
      return null;
    }
  }

  /**
   * Handle a game consensus message
   */
  public async handleGameConsensusMessage(message: ConsensusMessage): Promise<void> {
    if (!this.isInitialized) {
      console.warn('GameConsensusService not initialized when handling consensus message');
      return;
    }

    try {
      // Forward to consensus integration
      await this.consensusIntegration.handleConsensusMessage(message);

      // If this is a commit message and we're the primary, create a checkpoint
      if (message.type === ConsensusMessageType.COMMIT && this.isPrimaryValidator()) {
        const gameState = this.gameStateManager.getCurrentState();
        if (gameState) {
          this.gameStateManager.createCheckpoint('CONSENSUS_COMMIT');
          console.log('Created game state checkpoint after consensus commit');
        }
      }
    } catch (error) {
      console.error('Error handling game consensus message:', error);
      // Don't rethrow to prevent app crashes
    }
  }

  /**
   * Verify a game block
   */
  public async verifyGameBlock(block: GameConsensusBlock): Promise<boolean> {
    // Verify basic block properties
    if (!block.gameStateRoot || !block.gameMetadata) {
      console.error('Invalid game block: missing game data');
      return false;
    }

    // Verify transactions
    for (const tx of block.transactions) {
      try {
        const txData = JSON.parse(tx);
        if (txData.type === 'GAME_STATE_UPDATE' && txData.gameStateRoot) {
          // Verify game state integrity
          if (!verifyGameState(txData.gameState, txData.gameStateRoot)) {
            console.error('Game state verification failed for transaction');
            return false;
          }
        }
      } catch (error) {
        console.error('Error parsing transaction:', error);
        return false;
      }
    }

    // Verify validator signatures
    const requiredSignatures = Math.floor((2 * this.validators.length) / 3) + 1;
    const validSignatures = Object.keys(block.validatorSignatures).filter(
      validator => this.validators.includes(validator)
    ).length;

    return validSignatures >= requiredSignatures;
  }

  /**
   * Get the latest game block
   */
  public async getLatestGameBlock(): Promise<GameConsensusBlock | null> {
    try {
      // Ensure MonadDb is initialized
      if (!monadDb['isInitialized']) {
        console.warn('MonadDb not initialized when getting latest game block');
        return null;
      }

      const blocks = await monadDb.getAllInNamespace<GameConsensusBlock>(this.GAME_BLOCK_NAMESPACE);
      if (!blocks.length) return null;

      // Sort by block number and return the latest
      return blocks.sort((a, b) => b.number - a.number)[0];
    } catch (error) {
      console.error('Error getting latest game block:', error);
      return null;
    }
  }

  /**
   * Check if this node is the primary validator
   */
  private isPrimaryValidator(): boolean {
    if (!this.validators.length) return false;

    // Simple primary selection based on view number
    const latestBlock = this.consensusIntegration['consensus']['committedBlocks'].values().next().value;
    const viewNumber = latestBlock?.viewNumber || 0;
    const primaryIndex = viewNumber % this.validators.length;
    return this.validators[primaryIndex] === this.nodeId;
  }

  /**
   * Generate a signature for a block
   */
  private generateSignature(block: ConsensusBlock): string {
    // In a real implementation, this would use cryptographic signing
    // For now, we'll just create a simple hash
    const blockData = JSON.stringify(block);
    return new MerkleTree([blockData + this.nodeId]).getRoot();
  }

  /**
   * Store a game block in MonadDb
   */
  private async storeGameBlock(block: GameConsensusBlock): Promise<void> {
    await monadDb.put(`block-${block.number}`, {
      ...block,
      _timestamp: Date.now()
    }, this.GAME_BLOCK_NAMESPACE);

    // Create a checkpoint if auto-checkpoint is enabled
    if (this.config.gameStateVerificationEnabled && block.number % this.config.autoCheckpointBlocks === 0) {
      const gameState = this.gameStateManager.getCurrentState();
      if (gameState) {
        this.gameStateManager.createCheckpoint('AUTO_CONSENSUS');
      }
    }
  }

  /**
   * Setup required MonadDb namespaces
   */
  private async setupNamespaces(): Promise<void> {
    // Ensure MonadDb is initialized
    if (!monadDb['isInitialized']) {
      console.warn('MonadDb not initialized in GameConsensusService, initializing now...');
      try {
        await monadDb.initialize({
          cacheSize: 512, // 512MB cache
          persistToDisk: true,
          logLevel: 'info'
        });
        console.log('MonadDb initialized from GameConsensusService');
      } catch (error) {
        console.error('Failed to initialize MonadDb from GameConsensusService:', error);
        throw new Error('MonadDb initialization failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    try {
      await monadDb.put('namespace-init', {
        timestamp: Date.now(),
        initialized: true
      }, this.GAME_CONSENSUS_NAMESPACE);

      await monadDb.put('namespace-init', {
        timestamp: Date.now(),
        initialized: true
      }, this.GAME_BLOCK_NAMESPACE);

      console.log('GameConsensusService namespaces initialized');
    } catch (error) {
      console.error('Error setting up GameConsensusService namespaces:', error);
      throw error;
    }
  }

  /**
   * Start the block timer
   */
  private startBlockTimer(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }

    this.blockTimer = setInterval(() => {
      this.blockTimerTick();
    }, this.config.blockTime);

    this.lastBlockTime = Date.now();
  }

  /**
   * Reset the block timer
   */
  private resetBlockTimer(): void {
    this.lastBlockTime = Date.now();
  }

  /**
   * Block timer tick handler
   */
  private async blockTimerTick(): Promise<void> {
    // Only primary validator proposes blocks
    if (!this.isPrimaryValidator()) {
      return;
    }

    // Check if it's time to propose a block
    const now = Date.now();
    if (now - this.lastBlockTime >= this.config.blockTime && this.pendingTransactions.length > 0) {
      await this.proposeGameBlock();
    }
  }

  /**
   * Stop the consensus service
   */
  public stop(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
      this.blockTimer = null;
    }
  }

  /**
   * Get consensus statistics
   */
  public async getConsensusStats(): Promise<{
    totalBlocks: number;
    lastBlockTime: number;
    activeValidators: number;
    pendingTransactions: number;
    isPrimary: boolean;
  }> {
    if (!this.isInitialized) {
      // Return default stats if not initialized to prevent errors
      return {
        totalBlocks: 0,
        lastBlockTime: 0,
        activeValidators: 0,
        pendingTransactions: 0,
        isPrimary: false
      };
    }

    try {
      // Ensure MonadDb is initialized
      if (!monadDb['isInitialized']) {
        console.warn('MonadDb not initialized when getting consensus stats');
        return {
          totalBlocks: 0,
          lastBlockTime: this.lastBlockTime || 0,
          activeValidators: this.validators.length || 0,
          pendingTransactions: this.pendingTransactions.length || 0,
          isPrimary: false
        };
      }

      const blocks = await monadDb.getAllInNamespace<GameConsensusBlock>(this.GAME_BLOCK_NAMESPACE);

      return {
        totalBlocks: blocks.length,
        lastBlockTime: this.lastBlockTime,
        activeValidators: this.validators.length,
        pendingTransactions: this.pendingTransactions.length,
        isPrimary: this.isPrimaryValidator()
      };
    } catch (error) {
      console.error('Error getting consensus stats:', error);
      // Return default stats on error
      return {
        totalBlocks: 0,
        lastBlockTime: this.lastBlockTime || 0,
        activeValidators: this.validators.length || 0,
        pendingTransactions: this.pendingTransactions.length || 0,
        isPrimary: false
      };
    }
  }
}

// Export singleton instance
export const gameConsensusService = GameConsensusService.getInstance();
