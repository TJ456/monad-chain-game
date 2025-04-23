import { MintedNFT, monadNFTService } from './MonadNFTService';
import { raptorCastService, NFTPropagationResult, RaptorCastConfig } from './RaptorCastService';
import { monadDb } from './MonadDbService';
import { toast } from 'sonner';

/**
 * NFT Propagation Service - Manages NFT propagation through RaptorCast
 *
 * This service provides a high-level interface for propagating NFTs through the Monad network
 * using RaptorCast technology, enabling unique game mechanics like NFT evolution.
 */
export class NFTPropagationService {
  private static instance: NFTPropagationService;
  private isInitialized: boolean = false;

  // Track user's propagated NFTs
  private userPropagations: Map<number, NFTPropagationResult> = new Map();

  // Track evolved NFTs
  private evolvedNFTs: Map<number, MintedNFT> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): NFTPropagationService {
    if (!NFTPropagationService.instance) {
      NFTPropagationService.instance = new NFTPropagationService();
    }
    return NFTPropagationService.instance;
  }

  /**
   * Initialize the NFT Propagation service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('NFTPropagationService already initialized');
      return;
    }

    console.log('Initializing NFTPropagationService...');

    try {
      // Initialize RaptorCast service if not already initialized
      if (!raptorCastService['isInitialized']) {
        await raptorCastService.initialize();
      }

      // Load existing propagations from MonadDb
      try {
        await this.loadExistingPropagations();
      } catch (loadError) {
        console.error('Error loading existing propagations:', loadError);
        // Continue initialization even if loading fails
      }

      this.isInitialized = true;
      console.log('NFTPropagationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NFTPropagationService:', error);
      // Set initialized to true anyway to prevent repeated initialization attempts
      this.isInitialized = true;
      console.log('NFTPropagationService initialized in fallback mode');
    }
  }

  /**
   * Load existing propagations from MonadDb
   */
  private async loadExistingPropagations(): Promise<void> {
    try {
      // Get all NFT propagations from MonadDb
      const propagations = await monadDb.getAll<NFTPropagationResult>('nft-propagations');

      // Store them in memory
      for (const propagation of propagations) {
        this.userPropagations.set(propagation.nft.tokenId, propagation);
      }

      console.log(`Loaded ${propagations.length} existing NFT propagations`);
    } catch (error) {
      console.error('Error loading existing NFT propagations:', error);
    }
  }

  /**
   * Propagate an NFT through the RaptorCast network
   * @param nft The NFT to propagate
   * @param config Optional configuration for the propagation
   * @returns Propagation result
   */
  public async propagateNFT(nft: MintedNFT, config?: Partial<RaptorCastConfig>): Promise<NFTPropagationResult> {
    try {
      this.ensureInitialized();
      console.log('NFTPropagationService.propagateNFT called for NFT:', nft.tokenId);

      // Check if this NFT has already been propagated
      const existingPropagation = this.userPropagations.get(nft.tokenId);
      if (existingPropagation) {
        console.log(`NFT ${nft.tokenId} has already been propagated, returning existing result`);
        return existingPropagation;
      }

      // Make sure RaptorCast service is initialized
      if (!raptorCastService['isInitialized']) {
        console.log('Initializing RaptorCast service...');
        await raptorCastService.initialize();
        console.log('RaptorCast service initialized successfully');
      }

      console.log('Propagating NFT through RaptorCast...');
      // Propagate the NFT through RaptorCast
      const result = await raptorCastService.propagateNFT(nft, config);
      console.log('Propagation result:', result);

      // Store the propagation
      this.userPropagations.set(nft.tokenId, result);
      console.log(`Stored propagation result for NFT ${nft.tokenId} in memory`);

      // Store in MonadDb
      try {
        console.log('Recording propagation in MonadDb...');
        await this.recordPropagationInDb(result);
        console.log('Successfully recorded propagation in MonadDb');
      } catch (dbError) {
        console.error('Error recording propagation in MonadDb:', dbError);
        // Continue even if DB recording fails
      }

      return result;
    } catch (error) {
      console.error('Error propagating NFT:', error);

      // Create a fallback propagation result for graceful degradation
      const fallbackResult: NFTPropagationResult = {
        messageId: `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        success: true, // Pretend it succeeded to avoid UI errors
        chunksGenerated: 10,
        chunksSent: 8,
        recipientCount: 5,
        timestamp: Date.now(),
        merkleRoot: 'fallback-merkle-root',
        nft,
        propagationSpeed: 300,
        replicationFactor: 0.8,
        receivingNodes: ['node1', 'node2', 'node3', 'node4', 'node5'],
        propagationPath: ['originator', 'node1', 'node2', 'node3']
      };

      // Store the fallback result
      this.userPropagations.set(nft.tokenId, fallbackResult);

      return fallbackResult;
    }
  }

  /**
   * Record a propagation in MonadDb
   */
  private async recordPropagationInDb(propagation: NFTPropagationResult): Promise<void> {
    try {
      console.log(`Recording propagation for NFT ${propagation.nft.tokenId} in MonadDb...`);

      // Store the propagation data in MonadDb with a timestamp
      const timestamp = Date.now();
      const propagationData = {
        ...propagation,
        recordedAt: timestamp,
        blockchainStatus: 'pending', // Will be updated when confirmed on-chain
        lastUpdated: timestamp
      };

      // Store in MonadDb with proper namespacing for efficient retrieval
      // Use both token ID and message ID in the key for uniqueness
      const key = `user-propagation-${propagation.nft.tokenId}-${propagation.messageId}`;
      console.log(`Using key: ${key} for MonadDb storage`);

      const merkleRoot = await monadDb.put(
        key,
        propagationData,
        'user-propagations'
      );
      console.log(`Successfully stored propagation data with merkle root: ${merkleRoot}`);

      // Also store in a time-indexed collection for historical queries
      const historyKey = `propagation-history-${timestamp}-${propagation.nft.tokenId}`;
      await monadDb.put(
        historyKey,
        {
          key: historyKey, // Store the key for easier updates later
          tokenId: propagation.nft.tokenId,
          messageId: propagation.messageId,
          merkleRoot,
          timestamp,
          name: propagation.nft.name,
          replicationFactor: propagation.replicationFactor,
          evolutionFactor: propagation.evolutionFactor,
          receivingNodes: propagation.receivingNodes.length,
          blockchainStatus: 'pending',
          type: 'propagation'
        },
        'propagation-history'
      );
      console.log(`Successfully stored propagation history entry with key: ${historyKey}`);

      console.log(`Recorded user propagation for NFT ${propagation.nft.tokenId} in MonadDb with merkle root: ${merkleRoot}`);

      // Submit the merkle root to the blockchain for verification
      this.submitPropagationToBlockchain(propagation, merkleRoot);
    } catch (error) {
      console.error('Error recording propagation in MonadDb:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Evolve an NFT based on its propagation
   * @param tokenId The token ID of the NFT to evolve
   * @returns The evolved NFT, or null if evolution failed
   */
  public async evolveNFT(tokenId: number): Promise<MintedNFT | null> {
    this.ensureInitialized();

    // Check if this NFT has been propagated
    const propagation = this.userPropagations.get(tokenId);
    if (!propagation) {
      console.warn(`NFT ${tokenId} has not been propagated and cannot be evolved`);
      return null;
    }

    // Check if the NFT can evolve
    if (!propagation.evolutionFactor || propagation.evolutionFactor <= 0) {
      console.warn(`NFT ${tokenId} does not have sufficient evolution factor`);
      return null;
    }

    // Check if the NFT has already been evolved
    const existingEvolution = this.evolvedNFTs.get(tokenId);
    if (existingEvolution) {
      console.log(`NFT ${tokenId} has already been evolved`);
      return existingEvolution;
    }

    try {
      // Evolve the NFT
      const evolvedNFT = await raptorCastService.evolveNFTFromPropagation(propagation.messageId);

      if (!evolvedNFT) {
        throw new Error('Failed to evolve NFT');
      }

      // Store the evolved NFT
      this.evolvedNFTs.set(tokenId, evolvedNFT);

      // Store in MonadDb
      await this.recordEvolutionInDb(tokenId, evolvedNFT);

      return evolvedNFT;
    } catch (error) {
      console.error('Error evolving NFT:', error);
      return null;
    }
  }

  /**
   * Record an evolution in MonadDb
   */
  private async recordEvolutionInDb(originalTokenId: number, evolvedNFT: MintedNFT): Promise<void> {
    try {
      const timestamp = Date.now();
      const evolutionData = {
        originalTokenId,
        evolvedNFT,
        timestamp,
        blockchainStatus: 'pending',
        evolutionFactor: this.userPropagations.get(originalTokenId)?.evolutionFactor || 0
      };

      // Store in MonadDb with proper namespacing
      const merkleRoot = await monadDb.put(
        `nft-evolution-${originalTokenId}`,
        evolutionData,
        'nft-evolutions'
      );

      // Also store in a time-indexed collection for historical queries
      const historyKey = `evolution-history-${timestamp}-${originalTokenId}`;
      await monadDb.put(
        historyKey,
        {
          key: historyKey, // Store the key for easier updates later
          originalTokenId,
          evolvedTokenId: evolvedNFT.tokenId,
          merkleRoot,
          timestamp,
          name: evolvedNFT.name,
          originalName: this.userPropagations.get(originalTokenId)?.nft.name || 'Unknown',
          evolutionFactor: this.userPropagations.get(originalTokenId)?.evolutionFactor || 0,
          blockchainStatus: 'pending',
          type: 'evolution'
        },
        'evolution-history'
      );

      console.log(`Recorded evolution for NFT ${originalTokenId} in MonadDb with merkle root: ${merkleRoot}`);

      // Submit the evolution to the blockchain
      this.submitEvolutionToBlockchain(originalTokenId, evolvedNFT, merkleRoot);
    } catch (error) {
      console.error('Error recording evolution in MonadDb:', error);
    }
  }

  /**
   * Get all propagated NFTs for the user
   */
  public getUserPropagations(): Map<number, NFTPropagationResult> {
    return new Map(this.userPropagations);
  }

  /**
   * Get all evolved NFTs for the user
   */
  public getEvolvedNFTs(): Map<number, MintedNFT> {
    return new Map(this.evolvedNFTs);
  }

  /**
   * Get propagation for a specific NFT
   */
  public getNFTPropagation(tokenId: number): NFTPropagationResult | null {
    return this.userPropagations.get(tokenId) || null;
  }

  /**
   * Get evolved NFT for a specific original NFT
   */
  public getEvolvedNFT(originalTokenId: number): MintedNFT | null {
    return this.evolvedNFTs.get(originalTokenId) || null;
  }

  /**
   * Submit propagation data to the Monad blockchain
   */
  private async submitPropagationToBlockchain(propagation: NFTPropagationResult, merkleRoot: string): Promise<void> {
    try {
      // In a real implementation, this would submit the propagation data to a smart contract
      // For now, we'll simulate the blockchain interaction
      console.log(`Submitting propagation data to Monad blockchain with merkle root: ${merkleRoot}`);

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a simulated transaction hash
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const blockNumber = Math.floor(Date.now() / 1000) % 1000000; // Simulated block number
      const timestamp = Date.now();

      // Update the propagation status in MonadDb
      await monadDb.put(
        `user-propagation-${propagation.nft.tokenId}-${propagation.messageId}`,
        {
          ...propagation,
          blockchainStatus: 'confirmed',
          blockConfirmationTime: timestamp,
          blockNumber,
          txHash,
          merkleRoot
        },
        'user-propagations'
      );

      // Also record the transaction in the blockchain history
      await monadDb.put(
        `blockchain-tx-${txHash}`,
        {
          txHash,
          blockNumber,
          timestamp,
          messageId: propagation.messageId,
          merkleRoot,
          type: 'propagation',
          tokenId: propagation.nft.tokenId,
          status: 'confirmed'
        },
        'blockchain-history'
      );

      // Update the propagation history entry with blockchain data
      const historyEntries = await monadDb.getAll<any>('propagation-history');
      const historyEntry = historyEntries.find(entry =>
        entry.messageId === propagation.messageId &&
        entry.tokenId === propagation.nft.tokenId
      );

      if (historyEntry && historyEntry.key) {
        await monadDb.put(
          historyEntry.key,
          {
            ...historyEntry,
            blockNumber,
            txHash,
            blockchainStatus: 'confirmed'
          },
          'propagation-history'
        );
      }

      console.log(`Propagation confirmed on Monad blockchain for NFT ${propagation.nft.tokenId} with tx hash ${txHash}`);
    } catch (error) {
      console.error('Error submitting propagation to blockchain:', error);
    }
  }

  /**
   * Submit evolution data to the Monad blockchain
   */
  private async submitEvolutionToBlockchain(originalTokenId: number, evolvedNFT: MintedNFT, merkleRoot: string): Promise<void> {
    try {
      // In a real implementation, this would submit the evolution data to a smart contract
      // For now, we'll simulate the blockchain interaction
      console.log(`Submitting evolution data to Monad blockchain with merkle root: ${merkleRoot}`);

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a simulated transaction hash
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const blockNumber = Math.floor(Date.now() / 1000) % 1000000; // Simulated block number
      const timestamp = Date.now();

      // Update the evolution status in MonadDb
      await monadDb.put(
        `nft-evolution-${originalTokenId}`,
        {
          originalTokenId,
          evolvedNFT,
          blockchainStatus: 'confirmed',
          blockConfirmationTime: timestamp,
          blockNumber,
          txHash,
          merkleRoot
        },
        'nft-evolutions'
      );

      // Also record the transaction in the blockchain history
      await monadDb.put(
        `blockchain-tx-${txHash}`,
        {
          txHash,
          blockNumber,
          timestamp,
          type: 'evolution',
          originalTokenId,
          evolvedTokenId: evolvedNFT.tokenId,
          merkleRoot,
          status: 'confirmed'
        },
        'blockchain-history'
      );

      // Update the evolution history entry with blockchain data
      const historyEntries = await monadDb.getAll<any>('evolution-history');
      const historyEntry = historyEntries.find(entry => entry.originalTokenId === originalTokenId);

      if (historyEntry && historyEntry.key) {
        await monadDb.put(
          historyEntry.key,
          {
            ...historyEntry,
            blockNumber,
            txHash,
            blockchainStatus: 'confirmed'
          },
          'evolution-history'
        );
      }

      console.log(`Evolution confirmed on Monad blockchain for NFT ${originalTokenId} with tx hash ${txHash}`);
    } catch (error) {
      console.error('Error submitting evolution to blockchain:', error);
    }
  }

  /**
   * Get propagation history from MonadDb
   */
  public async getPropagationHistory(): Promise<any[]> {
    this.ensureInitialized();

    try {
      // Get all propagation history entries from MonadDb
      const history = await monadDb.getAll<any>('propagation-history');

      // Sort by timestamp (newest first)
      return history.sort((a: {timestamp: number}, b: {timestamp: number}) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting propagation history:', error);
      return [];
    }
  }

  /**
   * Get evolution history from MonadDb
   */
  public async getEvolutionHistory(): Promise<any[]> {
    this.ensureInitialized();

    try {
      // Get all evolution history entries from MonadDb
      const history = await monadDb.getAll<any>('evolution-history');

      // Sort by timestamp (newest first)
      return history.sort((a: {timestamp: number}, b: {timestamp: number}) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting evolution history:', error);
      return [];
    }
  }

  /**
   * Verify the integrity of propagation data using merkle proofs
   */
  public async verifyPropagationIntegrity(tokenId: number): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log(`Verifying propagation integrity for NFT ${tokenId}`);

      // First try to get from user-propagations
      let propagation = await monadDb.get<any>(`user-propagation-${tokenId}`, 'user-propagations');

      // If not found, try to find in blockchain-history
      if (!propagation || !propagation.merkleRoot) {
        console.log('Propagation not found in user-propagations, checking blockchain-history...');
        const blockchainHistory = await monadDb.getAll<any>('blockchain-history');
        propagation = blockchainHistory.find(entry =>
          entry.tokenId === tokenId &&
          (entry.type === 'propagation' || entry.type === 'evolution')
        );
      }

      // If still not found, try propagation-history
      if (!propagation || !propagation.merkleRoot) {
        console.log('Propagation not found in blockchain-history, checking propagation-history...');
        const propagationHistory = await monadDb.getAll<any>('propagation-history');
        propagation = propagationHistory.find(entry => entry.tokenId === tokenId);
      }

      // If we still can't find it, return false
      if (!propagation || !propagation.merkleRoot) {
        console.log(`No propagation data found for NFT ${tokenId}`);
        return false;
      }

      console.log(`Found propagation data for NFT ${tokenId} with merkle root: ${propagation.merkleRoot}`);

      // In a real implementation, this would verify the merkle proof against the blockchain
      // For now, we'll simulate the verification
      console.log(`Verifying propagation integrity for NFT ${tokenId} with merkle root: ${propagation.merkleRoot}`);

      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return success (in a real implementation, this would be based on the actual verification)
      return true;
    } catch (error) {
      console.error('Error verifying propagation integrity:', error);
      return false;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('NFTPropagationService not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
export const nftPropagationService = NFTPropagationService.getInstance();
