import { GameState } from './GameSyncService';
import { MerkleTree, createGameStateMerkleTree, verifyGameState } from '../utils/merkleTree';
import { toast } from 'sonner';
import { compress, decompress } from '../utils/compression';

/**
 * Types of game state checkpoints
 */
export enum CheckpointType {
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',
  MOVE_APPLIED = 'move_applied',
  SYNC_COMPLETE = 'sync_complete',
  MANUAL = 'manual'
}

/**
 * Interface for game state checkpoint
 */
export interface GameStateCheckpoint {
  state: GameState;
  merkleRoot: string;
  timestamp: number;
  type: CheckpointType;
  moveId?: string;
  version: number;
  compressed: boolean;
}

/**
 * Interface for game state history entry
 */
export interface GameStateHistoryEntry {
  moveId: string;
  previousState: GameState;
  currentState: GameState;
  merkleRoot: string;
  timestamp: number;
  verified: boolean;
}

/**
 * Class for managing game state, including rollback and checkpointing
 */
export class GameStateManager {
  private static instance: GameStateManager;
  private currentState: GameState | null = null;
  private stateHistory: GameStateHistoryEntry[] = [];
  private checkpoints: Map<string, GameStateCheckpoint> = new Map();
  private lastVerifiedState: GameState | null = null;
  private stateVersion = 0;
  private maxHistoryLength = 50;
  private maxCheckpoints = 10;
  private autoCheckpointInterval: NodeJS.Timeout | null = null;
  private compressionEnabled = true;
  private listeners: ((state: GameState) => void)[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Initialize the state manager with an initial state
   */
  public initialize(initialState: GameState): void {
    this.currentState = { ...initialState, version: 0 };
    this.stateVersion = 0;
    this.lastVerifiedState = { ...initialState, version: 0 };
    
    // Create initial checkpoint
    this.createCheckpoint(CheckpointType.MANUAL);
    
    // Start auto-checkpointing
    this.startAutoCheckpointing();
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Update the current game state
   */
  public updateState(newState: Partial<GameState>, recordHistory = true): GameState {
    if (!this.currentState) {
      throw new Error('Game state not initialized');
    }
    
    // Create history entry if needed
    if (recordHistory && newState.lastMove) {
      const previousState = { ...this.currentState };
      
      // Update the state
      this.currentState = {
        ...this.currentState,
        ...newState,
        version: this.stateVersion + 1
      };
      
      this.stateVersion++;
      
      // Record in history
      const merkleRoot = createGameStateMerkleTree(this.currentState).getRoot();
      
      this.stateHistory.unshift({
        moveId: newState.lastMove.cardId || `move-${Date.now()}`,
        previousState,
        currentState: { ...this.currentState },
        merkleRoot,
        timestamp: Date.now(),
        verified: false
      });
      
      // Trim history if needed
      if (this.stateHistory.length > this.maxHistoryLength) {
        this.stateHistory = this.stateHistory.slice(0, this.maxHistoryLength);
      }
    } else {
      // Simple update without history
      this.currentState = {
        ...this.currentState,
        ...newState,
        version: this.stateVersion + 1
      };
      
      this.stateVersion++;
    }
    
    // Notify listeners
    this.notifyListeners();
    
    return { ...this.currentState };
  }

  /**
   * Get the current game state
   */
  public getCurrentState(): GameState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Create a checkpoint of the current state
   */
  public createCheckpoint(type: CheckpointType, moveId?: string): string {
    if (!this.currentState) {
      throw new Error('Game state not initialized');
    }
    
    const stateCopy = { ...this.currentState };
    let stateData: any = stateCopy;
    
    // Compress the state if enabled
    const compressed = this.compressionEnabled;
    if (compressed) {
      stateData = compress(JSON.stringify(stateCopy));
    }
    
    const merkleRoot = createGameStateMerkleTree(stateCopy).getRoot();
    const checkpointId = `cp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const checkpoint: GameStateCheckpoint = {
      state: compressed ? {} as GameState : stateCopy,
      merkleRoot,
      timestamp: Date.now(),
      type,
      moveId,
      version: this.stateVersion,
      compressed
    };
    
    // If compressed, store the compressed data
    if (compressed) {
      (checkpoint as any).compressedData = stateData;
    }
    
    this.checkpoints.set(checkpointId, checkpoint);
    
    // Trim checkpoints if needed
    if (this.checkpoints.size > this.maxCheckpoints) {
      // Find oldest checkpoint
      let oldestId = '';
      let oldestTime = Date.now();
      
      for (const [id, cp] of this.checkpoints.entries()) {
        if (cp.timestamp < oldestTime) {
          oldestTime = cp.timestamp;
          oldestId = id;
        }
      }
      
      if (oldestId) {
        this.checkpoints.delete(oldestId);
      }
    }
    
    return checkpointId;
  }

  /**
   * Restore state from a checkpoint
   */
  public restoreCheckpoint(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    
    if (!checkpoint) {
      console.error(`Checkpoint ${checkpointId} not found`);
      return false;
    }
    
    try {
      let state: GameState;
      
      // Decompress if needed
      if (checkpoint.compressed) {
        const compressedData = (checkpoint as any).compressedData;
        if (!compressedData) {
          throw new Error('Compressed data not found in checkpoint');
        }
        
        const decompressed = decompress(compressedData);
        state = JSON.parse(decompressed);
      } else {
        state = checkpoint.state;
      }
      
      // Verify the state integrity
      const calculatedRoot = createGameStateMerkleTree(state).getRoot();
      if (calculatedRoot !== checkpoint.merkleRoot) {
        throw new Error('Checkpoint integrity verification failed');
      }
      
      // Restore the state
      this.currentState = { ...state };
      this.stateVersion = checkpoint.version;
      
      // Notify listeners
      this.notifyListeners();
      
      toast.success('Game state restored', {
        description: `Restored to checkpoint from ${new Date(checkpoint.timestamp).toLocaleTimeString()}`
      });
      
      return true;
    } catch (error) {
      console.error('Error restoring checkpoint:', error);
      toast.error('Failed to restore checkpoint', {
        description: 'The checkpoint data may be corrupted'
      });
      return false;
    }
  }

  /**
   * Roll back to a previous state
   */
  public rollbackToMove(moveId: string): boolean {
    // Find the move in history
    const historyEntry = this.stateHistory.find(entry => entry.moveId === moveId);
    
    if (!historyEntry) {
      console.error(`Move ${moveId} not found in history`);
      return false;
    }
    
    // Restore the previous state
    this.currentState = { ...historyEntry.previousState };
    this.stateVersion = historyEntry.previousState.version;
    
    // Remove all history entries after this one
    const index = this.stateHistory.findIndex(entry => entry.moveId === moveId);
    if (index !== -1) {
      this.stateHistory = this.stateHistory.slice(index);
    }
    
    // Notify listeners
    this.notifyListeners();
    
    toast.info('Game state rolled back', {
      description: `Rolled back to before move ${moveId}`
    });
    
    return true;
  }

  /**
   * Roll back to the last verified state
   */
  public rollbackToLastVerified(): boolean {
    if (!this.lastVerifiedState) {
      console.error('No verified state available');
      return false;
    }
    
    // Restore the last verified state
    this.currentState = { ...this.lastVerifiedState };
    this.stateVersion = this.lastVerifiedState.version;
    
    // Notify listeners
    this.notifyListeners();
    
    toast.info('Game state rolled back', {
      description: 'Rolled back to last verified state'
    });
    
    return true;
  }

  /**
   * Verify the current state against a Merkle root
   */
  public verifyCurrentState(expectedRoot: string): boolean {
    if (!this.currentState) {
      return false;
    }
    
    const isValid = verifyGameState(this.currentState, expectedRoot);
    
    if (isValid) {
      // Update last verified state
      this.lastVerifiedState = { ...this.currentState };
      
      // Mark relevant history entries as verified
      for (const entry of this.stateHistory) {
        if (entry.currentState.version <= this.currentState.version) {
          entry.verified = true;
        }
      }
    }
    
    return isValid;
  }

  /**
   * Get all available checkpoints
   */
  public getCheckpoints(): { id: string; checkpoint: GameStateCheckpoint }[] {
    return Array.from(this.checkpoints.entries()).map(([id, checkpoint]) => ({
      id,
      checkpoint: {
        ...checkpoint,
        // Don't include the actual state data to save memory
        state: {} as GameState
      }
    }));
  }

  /**
   * Get state history
   */
  public getStateHistory(): GameStateHistoryEntry[] {
    return [...this.stateHistory];
  }

  /**
   * Start automatic checkpointing
   */
  private startAutoCheckpointing(): void {
    // Create checkpoints every 30 seconds
    this.autoCheckpointInterval = setInterval(() => {
      if (this.currentState) {
        this.createCheckpoint(CheckpointType.MANUAL);
      }
    }, 30000);
  }

  /**
   * Stop automatic checkpointing
   */
  public stopAutoCheckpointing(): void {
    if (this.autoCheckpointInterval) {
      clearInterval(this.autoCheckpointInterval);
      this.autoCheckpointInterval = null;
    }
  }

  /**
   * Set compression enabled/disabled
   */
  public setCompressionEnabled(enabled: boolean): void {
    this.compressionEnabled = enabled;
  }

  /**
   * Add a state change listener
   */
  public addListener(listener: (state: GameState) => void): void {
    this.listeners.push(listener);
    
    // Immediately notify with current state if available
    if (this.currentState) {
      listener({ ...this.currentState });
    }
  }

  /**
   * Remove a state change listener
   */
  public removeListener(listener: (state: GameState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    if (!this.currentState) return;
    
    for (const listener of this.listeners) {
      try {
        listener({ ...this.currentState });
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAutoCheckpointing();
    this.listeners = [];
    this.checkpoints.clear();
    this.stateHistory = [];
  }
}
