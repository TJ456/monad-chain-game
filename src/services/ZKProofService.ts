import { keccak256 } from 'js-sha3';
import { toast } from 'sonner';
import { GameState } from './GameSyncService';

/**
 * Enhanced ZKProofService with:
 * - Improved proof generation and validation
 * - Better integration with game state
 * - Proof caching for performance
 * - Batch verification for multiple moves
 * - Timeout handling for proof verification
 */

/**
 * Interface for a move with ZK proof
 */
export interface ZKVerifiableMove {
  // Basic move information
  moveId: string;
  playerAddress: string;
  cardId: string;
  moveType: 'attack' | 'defense' | 'special';
  timestamp: number;

  // Proof data
  nonce: string;
  proof: string;
  publicInputs: string[];

  // Game state context
  gameStateVersion?: number;
  gameStateHash?: string;

  // Verification metadata
  verified?: boolean;
  verificationTime?: number;
  verifier?: string;
  signature?: string;
}

/**
 * Interface for a move verification result
 */
export interface MoveVerificationResult {
  isValid: boolean;
  reason?: string;
  verificationTime: number;
  moveId: string;
  gameStateVersion?: number;
  confidence: 'high' | 'medium' | 'low';
  verificationMethod: 'zk-proof' | 'signature' | 'hash' | 'cached';
  timestamp: number;
  verifier?: string;
  signature?: string;
}

/**
 * Service for ZK proof generation and verification
 *
 * Note: This is a simplified implementation that simulates ZK proofs.
 * In a real implementation, this would use a proper ZK proof library
 * like snarkjs, circom, or a similar framework.
 */
export class ZKProofService {
  private static instance: ZKProofService;

  // Keys for proof generation and verification
  private verificationKey: string = 'monad-game-verification-key';
  private provingKey: string = 'monad-game-proving-key';

  // Rate limiting
  private rateLimit: Map<string, number[]> = new Map(); // Map of player address to timestamps
  private rateLimitWindow = 5000; // 5 seconds
  private rateLimitCount = 10; // Max 10 moves in the window

  // Caching
  private moveCache: Map<string, ZKVerifiableMove> = new Map(); // Cache of verified moves
  private stateHashCache: Map<string, string> = new Map(); // Cache of game state hashes
  private maxCacheSize = 1000; // Maximum number of moves to cache

  // Verification settings
  private verificationTimeout = 5000; // 5 seconds
  private verifierAddress = 'monad-game-verifier';
  private useSignatureVerification = true;
  private useHashVerification = true;

  // Performance metrics
  private averageVerificationTime = 0;
  private totalVerifications = 0;
  private verificationErrors = 0;

  // Batch verification
  private pendingBatchVerifications: ZKVerifiableMove[] = [];
  private batchVerificationInterval: NodeJS.Timeout | null = null;
  private batchVerificationSize = 10;
  private batchVerificationDelay = 1000; // 1 second

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ZKProofService {
    if (!ZKProofService.instance) {
      ZKProofService.instance = new ZKProofService();
      ZKProofService.instance.initializeBatchVerification();
    }
    return ZKProofService.instance;
  }

  /**
   * Initialize batch verification interval
   */
  private initializeBatchVerification(): void {
    // Clear any existing interval
    if (this.batchVerificationInterval) {
      clearInterval(this.batchVerificationInterval);
    }

    // Set up interval to process batch verifications
    this.batchVerificationInterval = setInterval(() => {
      this.processPendingBatchVerifications();
    }, this.batchVerificationDelay);

    console.log('Batch verification initialized');
  }

  /**
   * Process pending batch verifications
   */
  private async processPendingBatchVerifications(): Promise<void> {
    if (this.pendingBatchVerifications.length === 0) {
      return;
    }

    // Take a batch of moves to verify
    const batch = this.pendingBatchVerifications.splice(0, this.batchVerificationSize);

    console.log(`Processing batch verification of ${batch.length} moves`);

    try {
      // Generate a batch proof
      const batchProof = await this.generateBatchProof(batch);

      // Verify the batch proof
      const isValid = await this.verifyBatchProof(batchProof, batch);

      if (isValid) {
        console.log(`Batch verification successful for ${batch.length} moves`);

        // Mark all moves as verified
        batch.forEach(move => {
          move.verified = true;
          move.verificationTime = Date.now();
          move.verifier = this.verifierAddress;

          // Update the cache
          this.moveCache.set(move.moveId, move);
        });
      } else {
        console.error(`Batch verification failed for ${batch.length} moves`);

        // Verify each move individually
        for (const move of batch) {
          await this.verifyProof(move);
        }
      }
    } catch (error) {
      console.error('Error in batch verification:', error);
      this.verificationErrors++;

      // Verify each move individually
      for (const move of batch) {
        try {
          await this.verifyProof(move);
        } catch (e) {
          console.error(`Error verifying move ${move.moveId}:`, e);
        }
      }
    }
  }

  /**
   * Generate a ZK proof for a move
   *
   * In a real implementation, this would use a ZK proof library to generate
   * a proof that the move is valid without revealing the player's strategy.
   */
  public async generateProof(
    playerAddress: string,
    cardId: string,
    moveType: 'attack' | 'defense' | 'special',
    gameState: GameState
  ): Promise<ZKVerifiableMove> {
    // Check rate limiting
    if (!this.checkRateLimit(playerAddress)) {
      throw new Error('Rate limit exceeded. Please wait before making more moves.');
    }

    // Generate a random nonce with high entropy
    const nonce = crypto.getRandomValues(new Uint8Array(16))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    // Create a move ID with timestamp and random component
    const moveId = `move-${Date.now()}-${crypto.getRandomValues(new Uint8Array(8))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}`;

    // Get game state hash or generate if not cached
    let gameStateHash = this.stateHashCache.get(gameState.version.toString());
    if (!gameStateHash) {
      // Create a hash of the relevant game state
      const stateString = JSON.stringify({
        playerHealth: gameState.playerHealth,
        opponentHealth: gameState.opponentHealth,
        playerMana: gameState.playerMana,
        opponentMana: gameState.opponentMana,
        currentTurn: gameState.currentTurn,
        version: gameState.version
      });
      gameStateHash = keccak256(stateString);

      // Cache the hash
      this.stateHashCache.set(gameState.version.toString(), gameStateHash);
    }

    // In a real implementation, we would:
    // 1. Create a circuit input with the move details and game state
    // 2. Generate a proof using the proving key
    // 3. Extract public inputs from the proof

    // For this simulation, we'll create a more sophisticated "proof"
    const timestamp = Date.now();

    // Create a hash of the move details and game state as a simulated proof
    const moveString = `${playerAddress}:${cardId}:${moveType}:${timestamp}:${nonce}:${gameStateHash}`;
    const proof = keccak256(moveString);

    // Create public inputs (in a real implementation, these would be derived from the proof)
    const publicInputs = [
      keccak256(playerAddress),
      keccak256(cardId),
      keccak256(moveType),
      timestamp.toString(),
      gameStateHash
    ];

    // Create the verifiable move with game state context
    const verifiableMove: ZKVerifiableMove = {
      moveId,
      playerAddress,
      cardId,
      moveType,
      timestamp,
      nonce,
      proof,
      publicInputs,
      gameStateVersion: gameState.version,
      gameStateHash,
      verified: false
    };

    // Update rate limit
    this.updateRateLimit(playerAddress);

    // Cache the move
    this.moveCache.set(moveId, verifiableMove);

    // Add to pending batch verifications
    this.pendingBatchVerifications.push(verifiableMove);

    // Log proof generation
    console.log(`Generated proof for move ${moveId} (${moveType} with card ${cardId})`);

    return verifiableMove;
  }

  /**
   * Verify a ZK proof for a move with timeout handling
   *
   * In a real implementation, this would use a ZK proof library to verify
   * the proof against the verification key.
   */
  public async verifyProof(move: ZKVerifiableMove): Promise<MoveVerificationResult> {
    const startTime = performance.now();
    this.totalVerifications++;

    // Create a promise that will reject after the timeout
    const timeoutPromise = new Promise<MoveVerificationResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Verification timeout'));
      }, this.verificationTimeout);
    });

    // Create the verification promise
    const verificationPromise = this.performVerification(move, startTime);

    // Race the promises
    try {
      const result = await Promise.race([verificationPromise, timeoutPromise]);

      // Update average verification time
      const verificationTime = performance.now() - startTime;
      this.averageVerificationTime =
        (this.averageVerificationTime * (this.totalVerifications - 1) + verificationTime) /
        this.totalVerifications;

      return result;
    } catch (error) {
      console.error('Verification failed or timed out:', error);
      this.verificationErrors++;

      // Return a timeout result
      return {
        isValid: false,
        reason: 'Verification timeout or error',
        verificationTime: performance.now() - startTime,
        moveId: move.moveId,
        confidence: 'low',
        verificationMethod: 'hash',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Perform the actual verification logic
   */
  private async performVerification(move: ZKVerifiableMove, startTime: number): Promise<MoveVerificationResult> {
    try {
      // Check if the move is already verified
      if (move.verified) {
        return {
          isValid: true,
          reason: 'Move already verified',
          verificationTime: performance.now() - startTime,
          moveId: move.moveId,
          gameStateVersion: move.gameStateVersion,
          confidence: 'high',
          verificationMethod: 'cached',
          timestamp: Date.now(),
          verifier: move.verifier,
          signature: move.signature
        };
      }

      // Check if the move is in the cache (already verified)
      if (this.moveCache.has(move.moveId)) {
        const cachedMove = this.moveCache.get(move.moveId)!;

        // Check if the proof matches
        if (cachedMove.proof !== move.proof) {
          return {
            isValid: false,
            reason: 'Proof mismatch with cached move',
            verificationTime: performance.now() - startTime,
            moveId: move.moveId,
            gameStateVersion: move.gameStateVersion,
            confidence: 'high',
            verificationMethod: 'cached',
            timestamp: Date.now()
          };
        }

        // If the cached move is verified, return success
        if (cachedMove.verified) {
          return {
            isValid: true,
            reason: 'Verified from cache',
            verificationTime: performance.now() - startTime,
            moveId: move.moveId,
            gameStateVersion: move.gameStateVersion,
            confidence: 'high',
            verificationMethod: 'cached',
            timestamp: Date.now(),
            verifier: cachedMove.verifier,
            signature: cachedMove.signature
          };
        }
      }

      // Check if the move is too old (more than 30 seconds)
      if (Date.now() - move.timestamp > 30000) {
        return {
          isValid: false,
          reason: 'Move is too old',
          verificationTime: performance.now() - startTime,
          moveId: move.moveId,
          gameStateVersion: move.gameStateVersion,
          confidence: 'high',
          verificationMethod: 'hash',
          timestamp: Date.now()
        };
      }

      // In a real implementation, we would:
      // 1. Verify the proof against the verification key and public inputs
      // 2. Check that the public inputs match the expected values

      let isValid = false;
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      let verificationMethod: 'zk-proof' | 'signature' | 'hash' | 'cached' = 'hash';
      let reason: string | undefined;

      // Try signature verification first if enabled
      if (this.useSignatureVerification && move.signature) {
        // In a real implementation, we would verify the signature
        // For this simulation, we'll assume it's valid if it exists
        isValid = true;
        confidence = 'high';
        verificationMethod = 'signature';
        reason = 'Verified by signature';
      }
      // Then try ZK proof verification
      else {
        // For this simulation, we'll recreate the hash and check if it matches
        // In a real implementation, we would use a proper ZK verification library

        // If we have a game state hash, include it in the verification
        let moveString;
        if (move.gameStateHash) {
          moveString = `${move.playerAddress}:${move.cardId}:${move.moveType}:${move.timestamp}:${move.nonce}:${move.gameStateHash}`;
          confidence = 'high'; // Higher confidence with game state context
        } else {
          moveString = `${move.playerAddress}:${move.cardId}:${move.moveType}:${move.timestamp}:${move.nonce}`;
          confidence = 'medium';
        }

        const expectedProof = keccak256(moveString);
        isValid = move.proof === expectedProof;
        verificationMethod = 'zk-proof';
        reason = isValid ? 'Proof verified' : 'Invalid proof';
      }

      // If valid, update the move and cache it
      if (isValid) {
        move.verified = true;
        move.verificationTime = Date.now();
        move.verifier = this.verifierAddress;

        // Generate a signature (in a real implementation, this would be a cryptographic signature)
        if (this.useSignatureVerification) {
          move.signature = keccak256(`${this.verifierAddress}:${move.moveId}:${Date.now()}`);
        }

        // Cache the move, managing cache size
        this.manageCache();
        this.moveCache.set(move.moveId, move);
      }

      // Return the verification result
      return {
        isValid,
        reason,
        verificationTime: performance.now() - startTime,
        moveId: move.moveId,
        gameStateVersion: move.gameStateVersion,
        confidence,
        verificationMethod,
        timestamp: Date.now(),
        verifier: isValid ? this.verifierAddress : undefined,
        signature: isValid && this.useSignatureVerification ? move.signature : undefined
      };
    } catch (error) {
      console.error('Error in verification process:', error);
      this.verificationErrors++;

      return {
        isValid: false,
        reason: `Error verifying proof: ${error instanceof Error ? error.message : 'Unknown error'}`,
        verificationTime: performance.now() - startTime,
        moveId: move.moveId,
        gameStateVersion: move.gameStateVersion,
        confidence: 'low',
        verificationMethod: 'hash',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Batch verify multiple proofs with optimized verification
   */
  public async batchVerifyProofs(moves: ZKVerifiableMove[]): Promise<MoveVerificationResult[]> {
    if (moves.length === 0) {
      return [];
    }

    console.log(`Batch verifying ${moves.length} proofs`);

    // First, try to verify as a batch
    try {
      // Generate a batch proof
      const batchProof = await this.generateBatchProof(moves);

      // Verify the batch proof
      const isValid = await this.verifyBatchProof(batchProof, moves);

      if (isValid) {
        console.log(`Batch verification successful for ${moves.length} moves`);

        // Create verification results for all moves
        return moves.map(move => {
          // Mark the move as verified
          move.verified = true;
          move.verificationTime = Date.now();
          move.verifier = this.verifierAddress;

          // Cache the move
          this.moveCache.set(move.moveId, move);

          // Return the verification result
          return {
            isValid: true,
            reason: 'Verified in batch',
            verificationTime: 0, // We don't have individual times for batch verification
            moveId: move.moveId,
            gameStateVersion: move.gameStateVersion,
            confidence: 'high',
            verificationMethod: 'zk-proof',
            timestamp: Date.now(),
            verifier: this.verifierAddress
          };
        });
      }
    } catch (error) {
      console.error('Batch verification failed, falling back to individual verification:', error);
    }

    // If batch verification failed or threw an error, verify each move individually
    return Promise.all(moves.map(move => this.verifyProof(move)));
  }

  /**
   * Manage the cache size
   */
  private manageCache(): void {
    // If the cache is under the limit, no need to clean up
    if (this.moveCache.size < this.maxCacheSize) {
      return;
    }

    console.log(`Cache size limit reached (${this.moveCache.size}/${this.maxCacheSize}), cleaning up...`);

    // Get all moves from the cache
    const moves = Array.from(this.moveCache.entries());

    // Sort by timestamp (oldest first)
    moves.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove the oldest moves to get under the limit
    // Keep 80% of the max to avoid frequent cleanups
    const targetSize = Math.floor(this.maxCacheSize * 0.8);
    const movesToRemove = moves.slice(0, moves.length - targetSize);

    // Remove from cache
    for (const [moveId] of movesToRemove) {
      this.moveCache.delete(moveId);
    }

    console.log(`Removed ${movesToRemove.length} old moves from cache, new size: ${this.moveCache.size}`);
  }

  /**
   * Check if a player has exceeded the rate limit
   */
  private checkRateLimit(playerAddress: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimit.get(playerAddress) || [];

    // Filter out timestamps outside the window
    const recentTimestamps = timestamps.filter(t => now - t < this.rateLimitWindow);

    return recentTimestamps.length < this.rateLimitCount;
  }

  /**
   * Update the rate limit for a player
   */
  private updateRateLimit(playerAddress: string): void {
    const now = Date.now();
    const timestamps = this.rateLimit.get(playerAddress) || [];

    // Filter out timestamps outside the window
    const recentTimestamps = timestamps.filter(t => now - t < this.rateLimitWindow);

    // Add the current timestamp
    recentTimestamps.push(now);

    // Update the map
    this.rateLimit.set(playerAddress, recentTimestamps);
  }

  /**
   * Generate a batch proof for multiple moves
   *
   * In a real implementation, this would use a ZK proof library to generate
   * a batch proof for multiple moves at once, which is more efficient than
   * generating individual proofs.
   */
  public async generateBatchProof(moves: ZKVerifiableMove[]): Promise<string> {
    // In a real implementation, this would generate a batch proof
    // For this simulation, we'll create a more sophisticated batch proof

    // Sort moves by timestamp to ensure deterministic ordering
    const sortedMoves = [...moves].sort((a, b) => a.timestamp - b.timestamp);

    // Create a Merkle-like structure of the proofs
    const leafProofs = sortedMoves.map(move => move.proof);
    let currentLevel = leafProofs;

    // Build up the tree
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      // Combine pairs of proofs
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Combine two proofs
          nextLevel.push(keccak256(currentLevel[i] + currentLevel[i + 1]));
        } else {
          // Odd number of proofs, just pass through
          nextLevel.push(currentLevel[i]);
        }
      }

      currentLevel = nextLevel;
    }

    // The root of the tree is our batch proof
    return currentLevel[0];
  }

  /**
   * Verify a batch proof
   *
   * In a real implementation, this would use a ZK proof library to verify
   * a batch proof for multiple moves at once.
   */
  public async verifyBatchProof(batchProof: string, moves: ZKVerifiableMove[]): Promise<boolean> {
    // In a real implementation, this would verify the batch proof
    // For this simulation, we'll recreate the batch proof and compare

    // Generate a new batch proof from the moves
    const generatedBatchProof = await this.generateBatchProof(moves);

    // Compare the proofs
    const isValid = batchProof === generatedBatchProof;

    // Log the result
    if (isValid) {
      console.log(`Batch proof verified for ${moves.length} moves`);
    } else {
      console.error(`Batch proof verification failed for ${moves.length} moves`);
    }

    return isValid;
  }

  /**
   * Clear the move cache
   */
  public clearCache(): void {
    this.moveCache.clear();
    this.stateHashCache.clear();
    console.log('ZKProofService caches cleared');
  }

  /**
   * Get verification statistics
   */
  public getVerificationStats(): {
    totalVerifications: number,
    averageTime: number,
    errorRate: number,
    cacheSize: number
  } {
    return {
      totalVerifications: this.totalVerifications,
      averageTime: this.averageVerificationTime,
      errorRate: this.totalVerifications > 0 ?
        (this.verificationErrors / this.totalVerifications) * 100 : 0,
      cacheSize: this.moveCache.size
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear the batch verification interval
    if (this.batchVerificationInterval) {
      clearInterval(this.batchVerificationInterval);
      this.batchVerificationInterval = null;
    }

    // Clear caches
    this.clearCache();

    // Clear pending batch verifications
    this.pendingBatchVerifications = [];

    console.log('ZKProofService cleaned up');
  }
}
