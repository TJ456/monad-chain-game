import { GameState } from './GameSyncService';
import { MerkleTree, createGameStateMerkleTree, verifyGameState } from '../utils/merkleTree';
import { ZKProofService, ZKVerifiableMove } from './ZKProofService';
import { keccak256 } from 'js-sha3';
import { toast } from 'sonner';

/**
 * Security event types
 */
export enum SecurityEventType {
  STATE_TAMPERING = 'state_tampering',
  INVALID_MOVE = 'invalid_move',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  REPLAY_ATTACK = 'replay_attack',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

/**
 * Interface for security events
 */
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  playerAddress?: string;
  resolved: boolean;
}

/**
 * Service for security-related functionality
 */
export class SecurityService {
  private static instance: SecurityService;
  private zkProofService: ZKProofService;
  private securityEvents: SecurityEvent[] = [];
  private stateHashes: Map<number, string> = new Map(); // Map of version to state hash
  private moveHashes: Set<string> = new Set(); // Set of move hashes to detect replay attacks
  private suspiciousActivityThreshold = 3; // Number of security events before a player is considered suspicious
  private suspiciousPlayers: Map<string, number> = new Map(); // Map of player address to security event count
  private securityEventListeners: ((event: SecurityEvent) => void)[] = [];
  private autoReportEnabled = true;

  private constructor() {
    this.zkProofService = ZKProofService.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Detect tampering in a game state
   * @returns True if tampering is detected
   */
  public detectStateTampering(state: GameState, expectedMerkleRoot?: string): boolean {
    // If we have an expected Merkle root, verify against it
    if (expectedMerkleRoot) {
      const isValid = verifyGameState(state, expectedMerkleRoot);
      
      if (!isValid) {
        this.recordSecurityEvent({
          type: SecurityEventType.STATE_TAMPERING,
          timestamp: Date.now(),
          details: {
            state,
            expectedMerkleRoot,
            actualMerkleRoot: createGameStateMerkleTree(state).getRoot()
          },
          severity: 'high',
          playerAddress: state.playerAddress,
          resolved: false
        });
        
        return true; // Tampering detected
      }
      
      return false; // No tampering
    }
    
    // If we don't have an expected root, check against our stored hash for this version
    if (this.stateHashes.has(state.version)) {
      const storedHash = this.stateHashes.get(state.version)!;
      const currentHash = this.hashState(state);
      
      if (storedHash !== currentHash) {
        this.recordSecurityEvent({
          type: SecurityEventType.STATE_TAMPERING,
          timestamp: Date.now(),
          details: {
            state,
            expectedHash: storedHash,
            actualHash: currentHash
          },
          severity: 'high',
          playerAddress: state.playerAddress,
          resolved: false
        });
        
        return true; // Tampering detected
      }
      
      return false; // No tampering
    }
    
    // If we don't have a stored hash for this version, store the current hash
    this.stateHashes.set(state.version, this.hashState(state));
    return false; // No tampering (first time seeing this version)
  }

  /**
   * Verify a move using ZK proofs
   */
  public async verifyMove(move: ZKVerifiableMove): Promise<boolean> {
    // Check for replay attacks
    const moveHash = this.hashMove(move);
    if (this.moveHashes.has(moveHash)) {
      this.recordSecurityEvent({
        type: SecurityEventType.REPLAY_ATTACK,
        timestamp: Date.now(),
        details: { move },
        severity: 'medium',
        playerAddress: move.playerAddress,
        resolved: false
      });
      
      return false;
    }
    
    // Verify the move using ZK proofs
    const result = await this.zkProofService.verifyProof(move);
    
    if (!result.isValid) {
      this.recordSecurityEvent({
        type: SecurityEventType.INVALID_MOVE,
        timestamp: Date.now(),
        details: {
          move,
          reason: result.reason
        },
        severity: 'high',
        playerAddress: move.playerAddress,
        resolved: false
      });
      
      return false;
    }
    
    // Store the move hash to prevent replay attacks
    this.moveHashes.add(moveHash);
    
    return true;
  }

  /**
   * Check if a player has exceeded the rate limit
   */
  public checkRateLimit(playerAddress: string, actionType: string, limit: number, windowMs: number): boolean {
    // This would typically be implemented with a more sophisticated rate limiting system
    // For this simulation, we'll just return true
    return true;
  }

  /**
   * Detect suspicious activity patterns
   */
  public detectSuspiciousActivity(playerAddress: string, actions: any[]): boolean {
    // This would typically analyze patterns of actions to detect suspicious behavior
    // For this simulation, we'll just check if the player has had multiple security events
    const eventCount = this.suspiciousPlayers.get(playerAddress) || 0;
    
    if (eventCount >= this.suspiciousActivityThreshold) {
      this.recordSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        timestamp: Date.now(),
        details: {
          playerAddress,
          eventCount,
          recentActions: actions
        },
        severity: 'medium',
        playerAddress,
        resolved: false
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Record a security event
   */
  public recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Update suspicious player count
    if (event.playerAddress) {
      const currentCount = this.suspiciousPlayers.get(event.playerAddress) || 0;
      this.suspiciousPlayers.set(event.playerAddress, currentCount + 1);
    }
    
    // Notify listeners
    this.notifySecurityEventListeners(event);
    
    // Auto-report if enabled
    if (this.autoReportEnabled && event.severity === 'critical') {
      this.reportSecurityEvent(event);
    }
    
    // Show toast for high severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      toast.error(`Security alert: ${event.type}`, {
        description: 'Potential security issue detected'
      });
    }
  }

  /**
   * Report a security event to the server
   */
  public reportSecurityEvent(event: SecurityEvent): void {
    // In a real implementation, this would send the event to a server
    console.log('Reporting security event:', event);
    
    // Mark as resolved
    event.resolved = true;
  }

  /**
   * Get all security events
   */
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get security events for a specific player
   */
  public getPlayerSecurityEvents(playerAddress: string): SecurityEvent[] {
    return this.securityEvents.filter(event => event.playerAddress === playerAddress);
  }

  /**
   * Clear security events
   */
  public clearSecurityEvents(): void {
    this.securityEvents = [];
    this.suspiciousPlayers.clear();
  }

  /**
   * Add a security event listener
   */
  public addSecurityEventListener(listener: (event: SecurityEvent) => void): void {
    this.securityEventListeners.push(listener);
  }

  /**
   * Remove a security event listener
   */
  public removeSecurityEventListener(listener: (event: SecurityEvent) => void): void {
    this.securityEventListeners = this.securityEventListeners.filter(l => l !== listener);
  }

  /**
   * Notify all security event listeners
   */
  private notifySecurityEventListeners(event: SecurityEvent): void {
    for (const listener of this.securityEventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in security event listener:', error);
      }
    }
  }

  /**
   * Hash a game state
   */
  private hashState(state: GameState): string {
    // Create a deterministic string representation of the state
    const stateString = JSON.stringify(state, (key, value) => {
      // Skip non-essential properties
      if (key.startsWith('_') || key === 'merkleRoot' || key === 'merkleProof') {
        return undefined;
      }
      return value;
    });
    
    return keccak256(stateString);
  }

  /**
   * Hash a move to detect replay attacks
   */
  private hashMove(move: ZKVerifiableMove): string {
    const moveString = `${move.playerAddress}:${move.cardId}:${move.moveType}:${move.timestamp}:${move.nonce}`;
    return keccak256(moveString);
  }

  /**
   * Enable or disable auto-reporting
   */
  public setAutoReportEnabled(enabled: boolean): void {
    this.autoReportEnabled = enabled;
  }
}
