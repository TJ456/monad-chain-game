/**
 * Enhanced GameSyncService with the following features:
 * - Merkle tree verification for game state integrity
 * - State rollback and checkpointing for error recovery
 * - WebRTC fallback for faster peer-to-peer communication
 * - State compression for efficient network usage
 * - ZK-proof validation for move verification
 * - Improved reconnection with state recovery
 * - Security features for tamper detection
 */

import WebSocketService, {
  WebSocketMessage,
  WebSocketMessageType,
  GameStateUpdate,
  TransactionUpdate
} from './WebSocketService';
import { WebRTCService } from './WebRTCService';
import {
  WebRTCMessageType,
  ConnectionQuality
} from './WebRTCService';
import { GameStateManager, CheckpointType } from './GameStateManager';
import { SecurityService, SecurityEventType } from './SecurityService';
import { ZKProofService } from './ZKProofService';
import { createGameStateMerkleTree } from '../utils/merkleTree';
import { compressGameState } from '../utils/compression';
import { Card as GameCardType } from '@/types/game';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Game state interface for local tracking
export interface GameState {
  // Basic game state
  roomCode: string;
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  playerDeck: GameCardType[];
  opponentDeckSize: number;
  currentTurn: 'player' | 'opponent';
  lastMove?: {
    player: 'player' | 'opponent';
    cardId: string;
    effect: string;
  };

  // Player identification
  playerAddress?: string;
  opponentAddress?: string;
  playerUsername?: string;
  opponentUsername?: string;

  // Blockchain transaction data
  transactionHash?: string;
  transactionStatus?: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;

  // State management
  timestamp: number;
  version: number;
  isSyncing: boolean;
  lastSyncTime: number;
  conflictResolutionStrategy: 'server' | 'client' | 'merge';

  // Merkle tree verification
  merkleRoot?: string;
  merkleProof?: string[];
  lastVerifiedVersion?: number;

  // Connection status
  connectionType?: 'websocket' | 'webrtc' | 'offline';
  connectionQuality?: ConnectionQuality;

  // Security
  moveVerification?: {
    lastVerifiedMoveId?: string;
    pendingMoveIds?: string[];
    zkProofEnabled: boolean;
  };

  // Recovery data
  recoveryCheckpointId?: string;
  lastRecoveryTime?: number;
}

// Conflict resolution strategies
export enum ConflictResolutionStrategy {
  SERVER_WINS = 'server', // Always use server state
  CLIENT_WINS = 'client', // Always use client state
  MERGE = 'merge' // Try to merge states intelligently
}

// Singleton Game Sync Service
class GameSyncService {
  private static instance: GameSyncService;

  // Services
  private wsService: WebSocketService;
  private rtcService: WebRTCService;
  private stateManager: GameStateManager;
  private securityService: SecurityService;
  private zkProofService: ZKProofService;

  // State
  private gameState: GameState | null = null;
  private stateUpdateListeners: ((state: GameState) => void)[] = [];
  private transactionUpdateListeners: ((update: TransactionUpdate) => void)[] = [];
  private syncStatusListeners: ((syncing: boolean) => void)[] = [];
  private connectionStatusListeners: ((status: { type: string, quality: ConnectionQuality }) => void)[] = [];
  private securityEventListeners: ((event: SecurityEventType) => void)[] = [];

  // Game data
  private pendingMoves: { id: string, cardId: string, moveType: string, timestamp: number }[] = [];
  private verifiedMoves: Set<string> = new Set();
  private conflictResolutionStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.MERGE;

  // Connection management
  private useWebRTCFallback: boolean = true;

  // Security settings
  private enableMerkleVerification: boolean = true;
  private enableZKProofValidation: boolean = true;
  private compressionEnabled: boolean = true;

  // Cleanup callbacks
  private cleanupCallbacks: (() => void)[] = [];

  private constructor() {
    // Initialize services
    this.wsService = WebSocketService.getInstance();
    this.rtcService = WebRTCService.getInstance();
    this.stateManager = GameStateManager.getInstance();
    this.securityService = SecurityService.getInstance();
    this.zkProofService = ZKProofService.getInstance();

    // Set up listeners
    this.setupWebSocketListeners();
    this.setupWebRTCListeners();
    this.setupSecurityListeners();

    // Configure state manager
    this.stateManager.setCompressionEnabled(this.compressionEnabled);
  }

  public static getInstance(): GameSyncService {
    if (!GameSyncService.instance) {
      GameSyncService.instance = new GameSyncService();
    }
    return GameSyncService.instance;
  }

  public initializeGameState(roomCode: string, initialState: Partial<GameState>): void {
    // Create a complete game state with all required fields
    this.gameState = {
      // Basic game state
      roomCode,
      playerHealth: 20,
      opponentHealth: 20,
      playerMana: 1,
      opponentMana: 1,
      playerDeck: [],
      opponentDeckSize: 0,
      currentTurn: 'player',

      // State management
      timestamp: Date.now(),
      version: 0,
      isSyncing: false,
      lastSyncTime: 0,
      conflictResolutionStrategy: 'merge',

      // Connection status
      connectionType: 'websocket',
      connectionQuality: ConnectionQuality.GOOD,

      // Security
      moveVerification: {
        pendingMoveIds: [],
        zkProofEnabled: this.enableZKProofValidation
      },

      // Override with any provided values
      ...initialState
    };

    // Initialize the state manager with our initial state
    this.stateManager.initialize(this.gameState);

    // Create a Merkle root for the initial state
    const merkleRoot = createGameStateMerkleTree(this.gameState).getRoot();
    this.gameState.merkleRoot = merkleRoot;

    // Join the WebSocket room
    this.wsService.joinRoom(roomCode);

    // If WebRTC is enabled, initialize it with a unique ID
    if (this.useWebRTCFallback) {
      const localId = `player-${this.gameState.playerAddress || uuidv4()}`;
      this.rtcService.initialize(localId);

      // If we have an opponent address, try to connect to them
      if (this.gameState.opponentAddress) {
        const remoteId = `player-${this.gameState.opponentAddress}`;
        this.rtcService.createOffer(remoteId);
      }
    }

    // Start periodic state verification
    this.startStateVerification();

    // Notify listeners of initial state
    this.notifyStateUpdateListeners();
  }

  public updateGameState(update: Partial<GameState>, sendToServer: boolean = true): void {
    if (!this.gameState) {
      console.error('Cannot update game state: not initialized');
      return;
    }

    // Create a checkpoint before updating state if it's a significant change
    if (this.stateManager && (update.playerHealth !== undefined || update.opponentHealth !== undefined || update.lastMove !== undefined)) {
      this.stateManager.createCheckpoint(CheckpointType.MOVE_APPLIED);
    }

    // Update local state
    this.gameState = {
      ...this.gameState,
      ...update,
      version: this.gameState.version + 1,
      timestamp: Date.now()
    };

    // Update the state in the state manager
    if (this.stateManager) {
      this.stateManager.updateState(this.gameState);
    }

    // Update Merkle root for verification
    if (this.enableMerkleVerification) {
      this.gameState.merkleRoot = createGameStateMerkleTree(this.gameState).getRoot();
    }

    // Notify listeners
    this.notifyStateUpdateListeners();

    // Send to server if requested
    if (sendToServer) {
      const stateUpdate: GameStateUpdate = {
        roomCode: this.gameState.roomCode,
        playerHealth: this.gameState.playerHealth,
        opponentHealth: this.gameState.opponentHealth,
        playerMana: this.gameState.playerMana,
        opponentMana: this.gameState.opponentMana,
        playerDeck: this.gameState.playerDeck,
        opponentDeckSize: this.gameState.opponentDeckSize,
        currentTurn: this.gameState.currentTurn,
        lastMove: this.gameState.lastMove,
        transactionHash: this.gameState.transactionHash,
        transactionStatus: this.gameState.transactionStatus,
        blockNumber: this.gameState.blockNumber,
        timestamp: this.gameState.timestamp,
        version: this.gameState.version
        // merkleRoot is not part of the WebSocket protocol yet
      };

      // Send via WebSocket
      this.wsService.sendGameStateUpdate(stateUpdate);

      // If WebRTC is connected, also send via WebRTC for faster updates
      if (this.useWebRTCFallback && this.rtcService.isConnected()) {
        // Compress the state for WebRTC to reduce bandwidth
        if (this.compressionEnabled) {
          const compressed = compressGameState(this.gameState);
          console.log(`State compressed: ${compressed.originalSize} -> ${compressed.compressedSize} bytes (${Math.round((compressed.compressedSize / compressed.originalSize) * 100)}%)`);

          // Send the compressed state
          this.rtcService.sendMessage({
            type: WebRTCMessageType.GAME_STATE,
            payload: compressed.compressedData,
            timestamp: Date.now(),
            sender: this.gameState.playerAddress || 'unknown',
            compressed: true
          });
        } else {
          // Send uncompressed state
          this.rtcService.sendGameState(this.gameState);
        }
      }
    }
  }

  public recordPlayerMove(cardId: string, moveType: 'attack' | 'defense' | 'special'): void {
    // Generate a unique ID for this move
    const moveId = uuidv4();

    // Add to pending moves
    this.pendingMoves.push({
      id: moveId,
      cardId,
      moveType,
      timestamp: Date.now()
    });

    // Create a checkpoint before applying the move
    if (this.gameState && this.stateManager) {
      this.stateManager.createCheckpoint(CheckpointType.MOVE_APPLIED, moveId);
    }

    // If ZK proof validation is enabled, generate and verify a proof
    if (this.enableZKProofValidation && this.gameState) {
      this.generateAndVerifyMoveProof(moveId, cardId, moveType);
    }

    // Send to server via WebSocket
    this.wsService.sendPlayerMove(cardId, moveType);

    // If WebRTC is connected, also send via WebRTC for faster updates
    if (this.rtcService.isConnected()) {
      this.rtcService.sendMove({
        moveId,
        cardId,
        moveType,
        timestamp: Date.now()
      });
    }
  }

  public requestSync(): void {
    if (!this.gameState) {
      console.error('Cannot request sync: game state not initialized');
      return;
    }

    this.setSyncStatus(true);

    // Create a checkpoint before syncing
    if (this.stateManager) {
      this.stateManager.createCheckpoint(CheckpointType.SYNC_COMPLETE);
    }

    // Try WebRTC first if connected (faster)
    if (this.useWebRTCFallback && this.rtcService.isConnected()) {
      this.rtcService.requestSync();

      // Set a timeout to fall back to WebSocket if WebRTC sync fails
      setTimeout(() => {
        if (this.gameState?.isSyncing) {
          console.log('WebRTC sync timed out, falling back to WebSocket');
          this.wsService.requestSync();
        }
      }, 2000); // Wait 2 seconds before falling back
    } else {
      // Use WebSocket sync
      this.wsService.requestSync();
    }
  }

  public getGameState(): GameState | null {
    return this.gameState;
  }

  public setConflictResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictResolutionStrategy = strategy;

    if (this.gameState) {
      this.gameState.conflictResolutionStrategy = strategy;
    }
  }

  public addStateUpdateListener(listener: (state: GameState) => void): void {
    this.stateUpdateListeners.push(listener);
    // Immediately notify with current state if available
    if (this.gameState) {
      listener(this.gameState);
    }
  }

  public removeStateUpdateListener(listener: (state: GameState) => void): void {
    this.stateUpdateListeners = this.stateUpdateListeners.filter(l => l !== listener);
  }

  public addTransactionUpdateListener(listener: (update: TransactionUpdate) => void): void {
    this.transactionUpdateListeners.push(listener);
  }

  public removeTransactionUpdateListener(listener: (update: TransactionUpdate) => void): void {
    this.transactionUpdateListeners = this.transactionUpdateListeners.filter(l => l !== listener);
  }

  public addSyncStatusListener(listener: (syncing: boolean) => void): void {
    this.syncStatusListeners.push(listener);
    // Immediately notify with current status
    if (this.gameState) {
      listener(this.gameState.isSyncing);
    }
  }

  public removeSyncStatusListener(listener: (syncing: boolean) => void): void {
    this.syncStatusListeners = this.syncStatusListeners.filter(l => l !== listener);
  }

  private setupWebSocketListeners(): void {
    // Listen for WebSocket messages
    this.wsService.addMessageListener(this.handleWebSocketMessage.bind(this));

    // Listen for connection status changes
    this.wsService.addConnectionStatusListener(this.handleConnectionStatusChange.bind(this));

    // Listen for sync status changes
    this.wsService.addSyncStatusListener(this.handleSyncStatusChange.bind(this));
  }

  private setupWebRTCListeners(): void {
    // Listen for WebRTC messages
    this.rtcService.addMessageListener(this.handleWebRTCMessage.bind(this));

    // Listen for connection status changes
    this.rtcService.addConnectionStateListener(this.handleWebRTCConnectionChange.bind(this));

    // Listen for connection quality metrics
    this.rtcService.addQualityMetricsListener(this.handleConnectionQualityChange.bind(this));
  }

  private setupSecurityListeners(): void {
    // Listen for security events
    this.securityService.addSecurityEventListener(this.handleSecurityEvent.bind(this));
  }

  private handleWebRTCMessage(message: any): void {
    // Handle different types of WebRTC messages
    switch (message.type) {
      case WebRTCMessageType.GAME_STATE:
        this.handleWebRTCGameState(message.payload);
        break;

      case WebRTCMessageType.MOVE:
        this.handleWebRTCMove(message.payload);
        break;

      case WebRTCMessageType.SYNC_REQUEST:
        this.handleWebRTCSyncRequest(message.payload);
        break;

      case WebRTCMessageType.SYNC_RESPONSE:
        this.handleWebRTCSyncResponse(message.payload);
        break;
    }
  }

  private handleWebRTCGameState(state: any): void {
    // Only update if we have a game state and it's newer than our current state
    if (!this.gameState || state.version > this.gameState.version) {
      this.updateGameState(state, false); // Don't send back to server
    }
  }

  private handleWebRTCMove(move: any): void {
    // Process the move if it's not already in our pending moves
    const existingMove = this.pendingMoves.find(m => m.id === move.moveId);
    if (!existingMove && this.gameState) {
      // Apply the move to our game state
      // This would typically update health, mana, etc. based on the move
      // For now, just record it as the last move
      this.updateGameState({
        lastMove: {
          player: 'opponent', // Assume it's from the opponent
          cardId: move.cardId,
          effect: move.moveType
        }
      }, false); // Don't send back to server
    }
  }

  private handleWebRTCSyncRequest(_request: any): void {
    // Send our current state to the requester
    if (this.gameState && this.rtcService.isConnected()) {
      this.rtcService.sendMessage({
        type: WebRTCMessageType.SYNC_RESPONSE,
        payload: this.gameState,
        timestamp: Date.now(),
        sender: this.gameState.playerAddress || 'unknown'
      });
    }
  }

  private handleWebRTCSyncResponse(response: any): void {
    // Update our state with the response if it's newer
    if (this.gameState && response.version > this.gameState.version) {
      this.updateGameState(response, false); // Don't send back to server
    }
  }

  private handleWebRTCConnectionChange(connected: boolean): void {
    if (this.gameState) {
      // Update connection type in game state
      this.updateGameState({
        connectionType: connected ? 'webrtc' : 'websocket'
      }, false);

      // Notify connection status listeners
      this.notifyConnectionStatusListeners({
        type: connected ? 'webrtc' : 'websocket',
        quality: connected ? ConnectionQuality.GOOD : ConnectionQuality.POOR
      });

      // If connected, send our current state
      if (connected) {
        this.rtcService.sendGameState(this.gameState);
      }
    }
  }

  private handleConnectionQualityChange(metrics: any): void {
    if (this.gameState) {
      // Update connection quality in game state
      this.updateGameState({
        connectionQuality: metrics.quality
      }, false);

      // Notify connection status listeners
      this.notifyConnectionStatusListeners({
        type: this.gameState.connectionType || 'websocket',
        quality: metrics.quality
      });
    }
  }

  private handleSecurityEvent(event: SecurityEventType): void {
    // Notify security event listeners
    this.notifySecurityEventListeners(event);

    // Handle critical security events
    if (event === SecurityEventType.STATE_TAMPERING) {
      // Roll back to last verified state
      this.rollbackToLastVerified();

      toast.error('Security alert: State tampering detected', {
        description: 'Game state has been restored to last verified state'
      });
    }
  }

  private generateAndVerifyMoveProof(moveId: string, cardId: string, moveType: string): void {
    if (!this.gameState || !this.gameState.playerAddress) return;

    // Generate a ZK proof for the move
    this.zkProofService.generateProof(
      this.gameState.playerAddress,
      cardId,
      moveType as any,
      this.gameState
    ).then(verifiableMove => {
      // Verify the proof
      return this.zkProofService.verifyProof(verifiableMove);
    }).then(result => {
      if (result.isValid) {
        // Mark the move as verified
        this.verifiedMoves.add(moveId);

        // Update the game state with verification info
        if (this.gameState && this.gameState.moveVerification) {
          this.updateGameState({
            moveVerification: {
              ...this.gameState.moveVerification,
              lastVerifiedMoveId: moveId
            }
          }, false);
        }
      } else {
        console.error('Move verification failed:', result.reason);
        toast.error('Move verification failed', {
          description: result.reason
        });
      }
    }).catch(error => {
      console.error('Error verifying move:', error);
    });
  }

  private rollbackToLastVerified(): void {
    if (this.stateManager) {
      const success = this.stateManager.rollbackToLastVerified();

      if (success && this.stateManager.getCurrentState()) {
        // Update our game state with the rolled back state
        this.gameState = this.stateManager.getCurrentState();
        this.notifyStateUpdateListeners();
      }
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case WebSocketMessageType.GAME_STATE_UPDATE:
        this.handleGameStateUpdate(message.payload);
        break;

      case WebSocketMessageType.TRANSACTION_UPDATE:
        this.handleTransactionUpdate(message.payload);
        break;

      case WebSocketMessageType.SYNC_RESPONSE:
        this.handleSyncResponse(message.payload);
        break;
    }
  }

  private handleGameStateUpdate(update: GameStateUpdate): void {
    if (!this.gameState) {
      console.warn('Received game state update but no local state initialized');
      return;
    }

    // Check for version conflicts
    if (update.version < this.gameState.version) {
      console.warn('Received outdated game state update, requesting sync');
      this.requestSync();
      return;
    }

    if (update.version === this.gameState.version && update.timestamp !== this.gameState.timestamp) {
      // Same version but different timestamps - conflict!
      this.resolveStateConflict(update);
      return;
    }

    // No conflict, just update
    this.updateLocalStateFromServer(update);
  }

  private handleTransactionUpdate(update: TransactionUpdate): void {
    if (!this.gameState || update.roomCode !== this.gameState.roomCode) {
      return;
    }

    // Update transaction status in game state
    this.updateGameState({
      transactionHash: update.transactionHash,
      transactionStatus: update.status,
      blockNumber: update.blockNumber
    }, false); // Don't send back to server

    // Notify transaction listeners
    this.notifyTransactionUpdateListeners(update);

    // Show toast notification for transaction status changes
    if (update.status === 'confirmed') {
      toast.success('Transaction confirmed', {
        description: `Block #${update.blockNumber}`
      });
    } else if (update.status === 'failed') {
      toast.error('Transaction failed', {
        description: 'Please try again'
      });
    }
  }

  private handleSyncResponse(response: { gameState: GameStateUpdate }): void {
    if (!this.gameState) {
      console.warn('Received sync response but no local state initialized');
      return;
    }

    // Update local state with server state
    this.updateLocalStateFromServer(response.gameState);

    // Clear syncing status
    this.setSyncStatus(false);

    toast.success('Game synchronized', {
      description: 'Latest game state loaded'
    });
  }

  private handleConnectionStatusChange(connected: boolean): void {
    if (connected && this.gameState) {
      // Reconnected, request sync
      this.requestSync();
    }
  }

  private handleSyncStatusChange(syncing: boolean): void {
    this.setSyncStatus(syncing);
  }

  private updateLocalStateFromServer(serverState: GameStateUpdate): void {
    if (!this.gameState) return;

    this.gameState = {
      ...this.gameState,
      playerHealth: serverState.playerHealth,
      opponentHealth: serverState.opponentHealth,
      playerMana: serverState.playerMana,
      opponentMana: serverState.opponentMana,
      playerDeck: serverState.playerDeck,
      opponentDeckSize: serverState.opponentDeckSize,
      currentTurn: serverState.currentTurn,
      lastMove: serverState.lastMove,
      transactionHash: serverState.transactionHash,
      transactionStatus: serverState.transactionStatus,
      blockNumber: serverState.blockNumber,
      version: serverState.version,
      timestamp: serverState.timestamp,
      lastSyncTime: Date.now()
    };

    // Notify listeners
    this.notifyStateUpdateListeners();
  }

  private resolveStateConflict(serverState: GameStateUpdate): void {
    if (!this.gameState) return;

    switch (this.conflictResolutionStrategy) {
      case ConflictResolutionStrategy.SERVER_WINS:
        // Just use server state
        this.updateLocalStateFromServer(serverState);
        break;

      case ConflictResolutionStrategy.CLIENT_WINS:
        // Keep client state, but increment version
        this.updateGameState({
          version: Math.max(this.gameState.version, serverState.version) + 1
        }, true);
        break;

      case ConflictResolutionStrategy.MERGE:
        // Try to merge states intelligently
        this.mergeGameStates(serverState);
        break;
    }
  }

  /**
   * Advanced state conflict resolution
   * Merges local and server states intelligently based on game rules and timestamps
   */
  private mergeGameStates(serverState: GameStateUpdate): void {
    if (!this.gameState) return;

    // Create a checkpoint before merging states
    if (this.stateManager) {
      this.stateManager.createCheckpoint(CheckpointType.SYNC_COMPLETE, `conflict-${Date.now()}`);
    }

    // Log the conflict for debugging
    console.log('Resolving state conflict:', {
      localVersion: this.gameState.version,
      serverVersion: serverState.version,
      localTimestamp: this.gameState.timestamp,
      serverTimestamp: serverState.timestamp
    });

    // Create a merged state using advanced conflict resolution
    const mergedState: Partial<GameState> = {};

    // Health and mana resolution - use server values for opponent, but be careful with player values
    // If player values differ significantly, something might be wrong
    mergedState.opponentHealth = serverState.opponentHealth;
    mergedState.opponentMana = serverState.opponentMana;

    // For player health and mana, detect suspicious differences
    const healthDiff = Math.abs(this.gameState.playerHealth - serverState.playerHealth);
    const manaDiff = Math.abs(this.gameState.playerMana - serverState.playerMana);

    if (healthDiff > 5) { // Significant health difference
      console.warn(`Suspicious player health difference: local=${this.gameState.playerHealth}, server=${serverState.playerHealth}`);
      // Use the lower value to prevent cheating
      mergedState.playerHealth = Math.min(this.gameState.playerHealth, serverState.playerHealth);

      // Report potential tampering
      if (this.securityService) {
        this.securityService.recordSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          timestamp: Date.now(),
          details: { healthDiff, localHealth: this.gameState.playerHealth, serverHealth: serverState.playerHealth },
          severity: 'medium',
          playerAddress: this.gameState.playerAddress,
          resolved: false
        });
      }
    } else {
      // Small difference, use server value
      mergedState.playerHealth = serverState.playerHealth;
    }

    if (manaDiff > 3) { // Significant mana difference
      console.warn(`Suspicious player mana difference: local=${this.gameState.playerMana}, server=${serverState.playerMana}`);
      // Use the lower value to prevent cheating
      mergedState.playerMana = Math.min(this.gameState.playerMana, serverState.playerMana);
    } else {
      // Small difference, use server value
      mergedState.playerMana = serverState.playerMana;
    }

    // Deck information - always use server's deck information for consistency
    mergedState.playerDeck = serverState.playerDeck;
    mergedState.opponentDeckSize = serverState.opponentDeckSize;

    // Turn resolution - this is critical for game consistency
    if (this.gameState.currentTurn !== serverState.currentTurn) {
      console.warn(`Turn conflict: local=${this.gameState.currentTurn}, server=${serverState.currentTurn}`);
      // Use server's turn information, but notify the player
      mergedState.currentTurn = serverState.currentTurn;

      toast.warning('Turn synchronization issue', {
        description: `Your turn was ${this.gameState.currentTurn}, but the server says it's ${serverState.currentTurn}'s turn`
      });
    } else {
      mergedState.currentTurn = serverState.currentTurn;
    }

    // Move resolution - compare timestamps and move IDs
    if (serverState.lastMove && this.gameState.lastMove) {
      // Both have moves, use the more recent one
      const serverMoveTime = serverState.timestamp;
      const localMoveTime = this.gameState.timestamp;

      if (serverMoveTime > localMoveTime) {
        mergedState.lastMove = serverState.lastMove;
      } else {
        // Local move is newer, but verify it's in our pending moves
        const moveInPending = this.pendingMoves.some(m => m.cardId === this.gameState?.lastMove?.cardId);
        if (moveInPending) {
          mergedState.lastMove = this.gameState.lastMove;
        } else {
          // Local move not in pending moves, use server move
          mergedState.lastMove = serverState.lastMove;
        }
      }
    } else if (serverState.lastMove) {
      // Only server has a move
      mergedState.lastMove = serverState.lastMove;
    } else if (this.gameState.lastMove) {
      // Only local has a move
      mergedState.lastMove = this.gameState.lastMove;
    }

    // Transaction information - always take the most recent
    mergedState.transactionHash = serverState.transactionHash || this.gameState.transactionHash;
    mergedState.transactionStatus = serverState.transactionStatus || this.gameState.transactionStatus;
    mergedState.blockNumber = serverState.blockNumber || this.gameState.blockNumber;

    // Version and timestamps
    mergedState.version = Math.max(serverState.version, this.gameState.version) + 1;
    mergedState.timestamp = Date.now();
    mergedState.lastSyncTime = Date.now();

    // Generate a new Merkle root for the merged state
    const tempState = { ...this.gameState, ...mergedState };
    mergedState.merkleRoot = createGameStateMerkleTree(tempState).getRoot();

    // Update local state with merged state
    this.updateGameState(mergedState, true);

    console.log('Successfully merged conflicting game states');

    // Notify the user
    toast.success('Game state synchronized', {
      description: 'Resolved differences between local and server state'
    });
  }

  private setSyncStatus(syncing: boolean): void {
    if (this.gameState && this.gameState.isSyncing !== syncing) {
      this.gameState.isSyncing = syncing;
      this.notifySyncStatusListeners(syncing);
    }
  }

  private notifyStateUpdateListeners(): void {
    if (!this.gameState) return;

    this.stateUpdateListeners.forEach(listener => {
      try {
        listener(this.gameState!);
      } catch (error) {
        console.error('Error in state update listener:', error);
      }
    });
  }

  private notifyTransactionUpdateListeners(update: TransactionUpdate): void {
    this.transactionUpdateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in transaction update listener:', error);
      }
    });
  }

  private notifySyncStatusListeners(syncing: boolean): void {
    this.syncStatusListeners.forEach(listener => {
      try {
        listener(syncing);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  private notifyConnectionStatusListeners(status: { type: string, quality: ConnectionQuality }): void {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  private notifySecurityEventListeners(event: SecurityEventType): void {
    this.securityEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in security event listener:', error);
      }
    });
  }

  public addConnectionStatusListener(listener: (status: { type: string, quality: ConnectionQuality }) => void): void {
    this.connectionStatusListeners.push(listener);
    // Immediately notify with current status if available
    if (this.gameState && this.gameState.connectionType) {
      listener({
        type: this.gameState.connectionType,
        quality: this.gameState.connectionQuality || ConnectionQuality.GOOD
      });
    }
  }

  public removeConnectionStatusListener(listener: (status: { type: string, quality: ConnectionQuality }) => void): void {
    this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
  }

  public addSecurityEventListener(listener: (event: SecurityEventType) => void): void {
    this.securityEventListeners.push(listener);
  }

  public removeSecurityEventListener(listener: (event: SecurityEventType) => void): void {
    this.securityEventListeners = this.securityEventListeners.filter(l => l !== listener);
  }

  /**
   * Start periodic state verification and checkpointing
   * This helps ensure the integrity of the game state and provides recovery points
   */
  private startStateVerification(): void {
    if (!this.enableMerkleVerification) return;

    // Set up an interval to verify the state periodically
    const verificationInterval = setInterval(() => {
      if (!this.gameState) return;

      // Create a Merkle tree from the current state
      const merkleRoot = createGameStateMerkleTree(this.gameState).getRoot();

      // Check if the root matches the stored root
      if (this.gameState.merkleRoot && this.gameState.merkleRoot !== merkleRoot) {
        // State tampering detected!
        this.securityService.detectStateTampering(this.gameState, this.gameState.merkleRoot);

        // Log the tampering attempt
        console.error('State tampering detected!', {
          storedRoot: this.gameState.merkleRoot,
          calculatedRoot: merkleRoot,
          stateVersion: this.gameState.version
        });
      } else {
        // Update the Merkle root
        this.gameState.merkleRoot = merkleRoot;
        this.gameState.lastVerifiedVersion = this.gameState.version;
      }
    }, 10000); // Check every 10 seconds

    // Set up automatic checkpointing
    const checkpointInterval = setInterval(() => {
      if (!this.gameState || !this.stateManager) return;

      // Create a regular checkpoint
      const checkpointId = this.stateManager.createCheckpoint(CheckpointType.MANUAL, `auto-${Date.now()}`);

      // Update the game state with the checkpoint ID
      this.updateGameState({
        recoveryCheckpointId: checkpointId
      }, false);

      console.log(`Created automatic checkpoint: ${checkpointId}`);

      // Prune old checkpoints if we have too many
      this.pruneOldCheckpoints();

    }, 60000); // Create checkpoint every minute

    // Store the intervals for cleanup
    this.cleanupCallbacks.push(() => {
      clearInterval(verificationInterval);
      clearInterval(checkpointInterval);
    });
  }

  /**
   * Create a manual checkpoint of the current game state
   * @param label Optional label for the checkpoint
   * @returns The ID of the created checkpoint
   */
  public createManualCheckpoint(label?: string): string | null {
    if (!this.gameState || !this.stateManager) {
      console.error('Cannot create checkpoint: game state not initialized');
      return null;
    }

    // Create a checkpoint with the provided label or a default one
    const checkpointId = this.stateManager.createCheckpoint(
      CheckpointType.MANUAL,
      label || `manual-${Date.now()}`
    );

    // Update the game state with the checkpoint ID
    this.updateGameState({
      recoveryCheckpointId: checkpointId
    }, false);

    // Notify the user
    toast.success('Game checkpoint created', {
      description: label ? `Checkpoint "${label}" created` : 'Manual checkpoint created'
    });

    return checkpointId;
  }

  /**
   * Restore the game state to a specific checkpoint
   * @param checkpointId The ID of the checkpoint to restore, or null to use the latest
   * @returns True if the restoration was successful
   */
  public restoreCheckpoint(checkpointId?: string): boolean {
    if (!this.stateManager) {
      console.error('Cannot restore checkpoint: state manager not initialized');
      return false;
    }

    // If no checkpoint ID provided, use the latest recovery checkpoint
    const targetCheckpointId = checkpointId || this.gameState?.recoveryCheckpointId;

    if (!targetCheckpointId) {
      console.error('No checkpoint ID provided and no recovery checkpoint available');
      toast.error('Cannot restore checkpoint', {
        description: 'No checkpoint ID provided and no recovery checkpoint available'
      });
      return false;
    }

    // Create a checkpoint of the current state before restoring
    if (this.gameState) {
      this.stateManager.createCheckpoint(CheckpointType.MANUAL, `pre-restore-${Date.now()}`);
    }

    // Attempt to restore the checkpoint
    const success = this.stateManager.restoreCheckpoint(targetCheckpointId);

    if (success) {
      // Get the restored state from the state manager
      const restoredState = this.stateManager.getCurrentState();

      if (restoredState) {
        // Update our game state with the restored state
        this.gameState = restoredState;

        // Update the last recovery time
        this.gameState.lastRecoveryTime = Date.now();

        // Notify listeners
        this.notifyStateUpdateListeners();

        // Notify the user
        toast.success('Game state restored', {
          description: `Restored to checkpoint ${targetCheckpointId.substring(0, 8)}...`
        });

        // Send the restored state to the server
        if (this.gameState) {
          this.updateGameState({
            lastRecoveryTime: Date.now()
          }, true);
        }
      }
    } else {
      // Restoration failed
      toast.error('Failed to restore checkpoint', {
        description: 'The checkpoint may be corrupted or no longer exists'
      });
    }

    return success;
  }

  /**
   * Get a list of available checkpoints
   * @returns Array of checkpoint information
   */
  public getAvailableCheckpoints(): { id: string, timestamp: number, type: string, label?: string }[] {
    if (!this.stateManager) return [];

    const checkpoints = this.stateManager.getCheckpoints();
    return checkpoints.map(({ id, checkpoint }) => ({
      id,
      timestamp: checkpoint.timestamp,
      type: checkpoint.type,
      label: checkpoint.moveId
    }));
  }

  /**
   * Prune old checkpoints to prevent memory bloat
   * Keeps important checkpoints and removes older automatic ones
   */
  private pruneOldCheckpoints(): void {
    if (!this.stateManager) return;

    const checkpoints = this.stateManager.getCheckpoints();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // Sort checkpoints by timestamp (newest first)
    const sortedCheckpoints = [...checkpoints].sort((a, b) =>
      b.checkpoint.timestamp - a.checkpoint.timestamp
    );

    // Always keep the 5 most recent checkpoints
    const checkpointsToKeep = sortedCheckpoints.slice(0, 5).map(c => c.id);

    // Also keep manual checkpoints that are less than 1 hour old
    for (let i = 5; i < sortedCheckpoints.length; i++) {
      const { id, checkpoint } = sortedCheckpoints[i];

      // Keep manual checkpoints that are recent
      if (checkpoint.type === CheckpointType.MANUAL &&
          now - checkpoint.timestamp < ONE_HOUR) {
        checkpointsToKeep.push(id);
      }

      // Keep the current recovery checkpoint
      if (this.gameState?.recoveryCheckpointId === id) {
        checkpointsToKeep.push(id);
      }
    }

    // Delete checkpoints that aren't in the keep list
    for (const { id } of checkpoints) {
      if (!checkpointsToKeep.includes(id)) {
        // Remove the checkpoint
        // Note: We're using a workaround since deleteCheckpoint might not exist
        // In a real implementation, you would add this method to GameStateManager
        if (typeof this.stateManager['deleteCheckpoint'] === 'function') {
          (this.stateManager as any).deleteCheckpoint(id);
        } else {
          console.log(`Would delete checkpoint ${id} if method existed`);
        }
      }
    }
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  public cleanup(): void {
    // Run all cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    }

    // Clean up WebRTC
    this.rtcService.cleanup();

    // Clean up state manager
    this.stateManager.cleanup();

    // Clear all listeners
    this.stateUpdateListeners = [];
    this.transactionUpdateListeners = [];
    this.syncStatusListeners = [];
    this.connectionStatusListeners = [];
    this.securityEventListeners = [];

    // Clear game state
    this.gameState = null;
    this.pendingMoves = [];
    this.verifiedMoves.clear();

    // Clear cleanup callbacks
    this.cleanupCallbacks = [];

    console.log('GameSyncService cleaned up successfully');
  }
}

export default GameSyncService;
