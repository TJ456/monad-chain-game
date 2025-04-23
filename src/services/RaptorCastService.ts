import { ethers } from 'ethers';
import { monadDb } from './MonadDbService';
import { MintedNFT, NFTMetadata, monadNFTService } from './MonadNFTService';

/**
 * Configuration options for RaptorCast operations
 */
export interface RaptorCastConfig {
  redundancyFactor: number;     // How much redundancy to add (1-7)
  chunkSize?: number;           // Size of each chunk in bytes (default: 1220)
  merkleTreeDepth?: number;     // Depth of the Merkle tree for signatures (default: 6)
  timeoutMs?: number;           // Timeout for operations in milliseconds
  minConfirmations?: number;    // Minimum confirmations required (0-1, percentage)
}

/**
 * Message broadcast result
 */
export interface BroadcastResult {
  messageId: string;            // Unique ID of the broadcast message
  success: boolean;             // Whether the broadcast was successful
  chunksGenerated: number;      // Number of chunks generated
  chunksSent: number;           // Number of chunks successfully sent
  recipientCount: number;       // Number of recipients
  timestamp: number;            // Timestamp of the broadcast
  merkleRoot: string;           // Merkle root of the message chunks
  nftId?: number;               // ID of the NFT if this is an NFT broadcast
}

/**
 * Encoded message ready for broadcast
 */
export interface EncodedMessage {
  messageId: string;            // Unique ID of the message
  chunks: Uint8Array[];         // Encoded chunks
  merkleRoot: string;           // Merkle root of the chunks
  sourceChunks: number;         // Number of source chunks
  encodedChunks: number;        // Number of encoded chunks
  metadata: Record<string, any>; // Additional metadata
  nft?: MintedNFT;              // NFT data if this is an NFT broadcast
}

/**
 * Message delivery verification result
 */
export interface DeliveryVerification {
  messageId: string;            // Message ID being verified
  success: boolean;             // Whether delivery was verified
  confirmationRate: number;     // Percentage of nodes that confirmed receipt
  timestamp: number;            // Timestamp of verification
}

/**
 * Broadcast tree node representing a participant in the distribution
 */
export interface BroadcastTreeNode {
  id: string;                   // Node identifier (address or other unique ID)
  weight: number;               // Weight of the node (e.g., stake)
  chunkRange: [number, number]; // Range of chunks assigned to this node
  children: BroadcastTreeNode[]; // Child nodes in the broadcast tree
  level: number;                // Level in the broadcast tree (0 = originator)
}

/**
 * NFT Propagation Result
 */
export interface NFTPropagationResult extends BroadcastResult {
  nft: MintedNFT;                // The NFT being propagated
  propagationSpeed: number;      // Speed of propagation in ms
  replicationFactor: number;     // How many replicas were created
  evolutionFactor?: number;      // Evolution factor if the NFT evolved during propagation
  receivingNodes: string[];      // Nodes that received the NFT
  propagationPath: string[];     // Path the NFT took through the network
}

/**
 * RaptorCastService - A service that provides an interface to Monad's RaptorCast technology
 *
 * This service simulates the behavior of RaptorCast for game mechanics and visualization
 * while providing hooks to integrate with the actual RaptorCast implementation in production.
 */
export class RaptorCastService {
  private static instance: RaptorCastService;
  private isInitialized: boolean = false;
  private defaultConfig: RaptorCastConfig = {
    redundancyFactor: 3,
    chunkSize: 1220,
    merkleTreeDepth: 6,
    timeoutMs: 10000,
    minConfirmations: 0.67
  };

  // Simulated network of nodes for the game
  private gameNodes: Map<string, { weight: number, online: boolean }> = new Map();

  // Track active broadcasts
  private activeBroadcasts: Map<string, BroadcastResult> = new Map();

  // Track broadcast trees
  private broadcastTrees: Map<string, BroadcastTreeNode> = new Map();

  // Track NFT propagations
  private nftPropagations: Map<string, NFTPropagationResult> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RaptorCastService {
    if (!RaptorCastService.instance) {
      RaptorCastService.instance = new RaptorCastService();
    }
    return RaptorCastService.instance;
  }

  /**
   * Initialize the RaptorCast service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('RaptorCastService already initialized');
      return;
    }

    console.log('Initializing RaptorCastService...');

    try {
      // Initialize simulated game nodes for visualization and game mechanics
      this.initializeGameNodes();

      // Check if we can connect to the Monad network
      const isConnectedToMonad = await this.checkMonadConnection();

      if (isConnectedToMonad) {
        console.log('Connected to Monad network for RaptorCast operations');
        // In a production environment, we would initialize the actual RaptorCast protocol here
        // For now, we'll still use our simulation for the game mechanics
      } else {
        console.warn('Could not connect to Monad network, using simulation mode');
      }

      this.isInitialized = true;
      console.log('RaptorCastService initialized successfully');
    } catch (error) {
      console.error('Error initializing RaptorCastService:', error);
      // Fall back to simulation mode
      this.initializeGameNodes();
      this.isInitialized = true;
      console.log('RaptorCastService initialized in simulation mode due to error');
    }
  }

  /**
   * Check connection to Monad network
   */
  private async checkMonadConnection(): Promise<boolean> {
    try {
      // In a real implementation, this would check the connection to the Monad network
      // For now, we'll simulate a successful connection

      // Use the existing RPC URL from the environment if available
      const rpcUrl = import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz/';

      // Try to connect to the Monad network
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      });

      const data = await response.json();

      // If we got a valid response, we're connected
      return !!data.result;
    } catch (error) {
      console.error('Error checking Monad connection:', error);
      return false;
    }
  }

  /**
   * Initialize simulated game nodes
   */
  private initializeGameNodes(): void {
    // Create a set of simulated nodes with different weights
    // In a real implementation, these would be actual validators on the network
    const nodeCount = 20;
    for (let i = 0; i < nodeCount; i++) {
      const id = `node-${i}`;
      // Randomize weights to simulate different stake amounts
      const weight = Math.floor(Math.random() * 10) + 1;
      this.gameNodes.set(id, { weight, online: true });
    }

    console.log(`Initialized ${nodeCount} simulated game nodes`);
  }

  /**
   * Encode a message using RaptorCast's erasure coding
   */
  public async encodeMessage(
    message: string | Uint8Array,
    config?: Partial<RaptorCastConfig>
  ): Promise<EncodedMessage> {
    this.ensureInitialized();

    const mergedConfig = { ...this.defaultConfig, ...config };
    const messageBuffer = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    // Calculate how many source chunks we need based on message size and chunk size
    const sourceChunks = Math.ceil(messageBuffer.length / mergedConfig.chunkSize!);

    // Calculate how many encoded chunks to generate based on redundancy factor
    const encodedChunksCount = sourceChunks * mergedConfig.redundancyFactor;

    // In a real implementation, this would use actual Raptor codes
    // For the game simulation, we'll create dummy chunks
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < encodedChunksCount; i++) {
      // Create a dummy chunk with a header indicating its position
      const chunk = new Uint8Array(mergedConfig.chunkSize!);
      // Set some identifiable data in the chunk
      const chunkHeader = new TextEncoder().encode(`chunk-${i}-of-${encodedChunksCount}`);
      chunk.set(chunkHeader.slice(0, Math.min(chunkHeader.length, 20)));

      // If this is a source chunk (i < sourceChunks), include some of the original data
      if (i < sourceChunks) {
        const start = i * mergedConfig.chunkSize!;
        const end = Math.min(start + mergedConfig.chunkSize!, messageBuffer.length);
        const dataSlice = messageBuffer.slice(start, end);
        chunk.set(dataSlice, 24); // Leave room for the header
      }

      chunks.push(chunk);
    }

    // Generate a message ID
    const messageId = ethers.utils.id(Date.now().toString() + Math.random().toString());

    // Generate a merkle root (simulated)
    const merkleRoot = ethers.utils.id('merkle-' + messageId);

    return {
      messageId,
      chunks,
      merkleRoot,
      sourceChunks,
      encodedChunks: encodedChunksCount,
      metadata: {
        timestamp: Date.now(),
        config: mergedConfig
      }
    };
  }

  /**
   * Broadcast a message using RaptorCast
   */
  public async broadcastMessage(
    message: string | Uint8Array,
    config?: Partial<RaptorCastConfig>
  ): Promise<BroadcastResult> {
    this.ensureInitialized();

    // First encode the message
    const encodedMessage = await this.encodeMessage(message, config);

    // Then broadcast the encoded message
    return this.broadcastEncodedMessage(encodedMessage, config);
  }

  /**
   * Broadcast an already encoded message
   */
  public async broadcastEncodedMessage(
    encodedMessage: EncodedMessage,
    config?: Partial<RaptorCastConfig>
  ): Promise<BroadcastResult> {
    this.ensureInitialized();

    // Merge configs but we don't need to use it directly
    const _mergedConfig = { ...this.defaultConfig, ...config };

    // Create a broadcast tree for this message
    const broadcastTree = this.createBroadcastTree(
      encodedMessage.messageId,
      encodedMessage.chunks.length,
      Array.from(this.gameNodes.entries())
    );

    // Store the broadcast tree
    this.broadcastTrees.set(encodedMessage.messageId, broadcastTree);

    // Simulate the broadcast process
    const result: BroadcastResult = {
      messageId: encodedMessage.messageId,
      success: true,
      chunksGenerated: encodedMessage.chunks.length,
      chunksSent: 0,
      recipientCount: this.gameNodes.size - 1, // Exclude the originator
      timestamp: Date.now(),
      merkleRoot: encodedMessage.merkleRoot
    };

    // Simulate chunk distribution
    // In a real implementation, this would actually send the chunks over the network
    result.chunksSent = this.simulateChunkDistribution(broadcastTree, encodedMessage.chunks);

    // Store the result
    this.activeBroadcasts.set(encodedMessage.messageId, result);

    // Record the broadcast in MonadDb for persistence
    await this.recordBroadcastInDb(result, encodedMessage);

    return result;
  }

  /**
   * Create a broadcast tree for message distribution
   */
  private createBroadcastTree(
    _messageId: string, // Using underscore to indicate it's not used directly
    chunkCount: number,
    nodes: [string, { weight: number, online: boolean }][]
  ): BroadcastTreeNode {
    // Filter to only include online nodes
    const onlineNodes = nodes.filter(([_, data]) => data.online);

    // Sort nodes by weight (descending)
    onlineNodes.sort(([_, a], [__, b]) => b.weight - a.weight);

    // Create the root node (originator)
    const root: BroadcastTreeNode = {
      id: 'originator',
      weight: 0, // Originator doesn't need a weight
      chunkRange: [0, chunkCount - 1],
      children: [],
      level: 0
    };

    // If there are no online nodes, return just the root
    if (onlineNodes.length === 0) {
      return root;
    }

    // Calculate total weight of all nodes
    const totalWeight = onlineNodes.reduce((sum, [_, data]) => sum + data.weight, 0);

    // Distribute chunks to level 1 nodes based on weight
    let chunkStart = 0;
    for (let i = 0; i < Math.min(onlineNodes.length, 5); i++) { // Limit to 5 level-1 nodes
      const [nodeId, data] = onlineNodes[i];
      const nodeWeight = data.weight;
      const chunkShare = Math.floor((nodeWeight / totalWeight) * chunkCount);
      const chunkEnd = Math.min(chunkStart + chunkShare - 1, chunkCount - 1);

      const level1Node: BroadcastTreeNode = {
        id: nodeId,
        weight: nodeWeight,
        chunkRange: [chunkStart, chunkEnd],
        children: [],
        level: 1
      };

      root.children.push(level1Node);
      chunkStart = chunkEnd + 1;

      // If we've assigned all chunks, break
      if (chunkStart >= chunkCount) break;
    }

    // If there are still chunks left, assign them to the last node
    if (chunkStart < chunkCount && root.children.length > 0) {
      root.children[root.children.length - 1].chunkRange[1] = chunkCount - 1;
    }

    // Now distribute level 2 nodes among level 1 nodes
    const level1NodeCount = root.children.length;
    const remainingNodes = onlineNodes.slice(level1NodeCount);

    // Distribute remaining nodes evenly among level 1 nodes
    for (let i = 0; i < remainingNodes.length; i++) {
      const [nodeId, data] = remainingNodes[i];
      const parentIndex = i % level1NodeCount;
      const parentNode = root.children[parentIndex];

      // Calculate chunk range for this level 2 node
      const parentRange = parentNode.chunkRange;
      const rangeSize = parentRange[1] - parentRange[0] + 1;
      const level2NodeCount = Math.ceil(remainingNodes.length / level1NodeCount);
      const nodeIndex = Math.floor(i / level1NodeCount);
      const chunkShare = Math.floor(rangeSize / level2NodeCount);

      const level2Start = parentRange[0] + nodeIndex * chunkShare;
      const level2End = Math.min(level2Start + chunkShare - 1, parentRange[1]);

      const level2Node: BroadcastTreeNode = {
        id: nodeId,
        weight: data.weight,
        chunkRange: [level2Start, level2End],
        children: [],
        level: 2
      };

      parentNode.children.push(level2Node);
    }

    return root;
  }

  /**
   * Simulate the distribution of chunks through the broadcast tree
   */
  private simulateChunkDistribution(
    tree: BroadcastTreeNode,
    chunks: Uint8Array[]
  ): number {
    let chunksSent = 0;

    // Simulate sending chunks to level 1 nodes
    for (const level1Node of tree.children) {
      const [start, end] = level1Node.chunkRange;
      const nodeChunks = chunks.slice(start, end + 1);

      // Simulate network conditions (90% success rate for level 1)
      const successRate = 0.9;
      const successfulChunks = Math.floor(nodeChunks.length * successRate);
      chunksSent += successfulChunks;

      // Simulate level 1 nodes forwarding to level 2
      for (const level2Node of level1Node.children) {
        const [l2Start, l2End] = level2Node.chunkRange;
        const l2NodeChunks = chunks.slice(l2Start, l2End + 1);

        // Simulate network conditions (80% success rate for level 2)
        const l2SuccessRate = 0.8;
        const l2SuccessfulChunks = Math.floor(l2NodeChunks.length * l2SuccessRate);
        chunksSent += l2SuccessfulChunks;
      }
    }

    return chunksSent;
  }

  /**
   * Record a broadcast in MonadDb for persistence
   */
  private async recordBroadcastInDb(
    result: BroadcastResult,
    encodedMessage: EncodedMessage
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const broadcastData = {
        result,
        metadata: encodedMessage.metadata,
        timestamp,
        blockchainStatus: 'pending'
      };

      // Store metadata about the broadcast with proper namespacing
      const merkleRoot = await monadDb.put(
        `raptorcast-broadcast-${result.messageId}`,
        broadcastData,
        'raptorcast'
      );

      // Also store in a time-indexed collection for historical queries
      await monadDb.put(
        `broadcast-history-${timestamp}`,
        {
          messageId: result.messageId,
          merkleRoot,
          timestamp,
          chunksGenerated: result.chunksGenerated,
          chunksSent: result.chunksSent,
          nftId: result.nftId
        },
        'broadcast-history'
      );

      console.log(`Recorded RaptorCast broadcast ${result.messageId} in MonadDb with merkle root: ${merkleRoot}`);

      // Submit the broadcast to the blockchain
      this.submitBroadcastToBlockchain(result, merkleRoot);
    } catch (error) {
      console.error('Failed to record broadcast in MonadDb:', error);
    }
  }

  /**
   * Verify delivery of a message
   */
  public async verifyMessageDelivery(
    messageId: string,
    config?: Partial<RaptorCastConfig>
  ): Promise<DeliveryVerification> {
    this.ensureInitialized();

    const mergedConfig = { ...this.defaultConfig, ...config };

    // Get the broadcast result
    const broadcast = this.activeBroadcasts.get(messageId);
    if (!broadcast) {
      return {
        messageId,
        success: false,
        confirmationRate: 0,
        timestamp: Date.now()
      };
    }

    // Get the broadcast tree
    const tree = this.broadcastTrees.get(messageId);
    if (!tree) {
      return {
        messageId,
        success: false,
        confirmationRate: 0,
        timestamp: Date.now()
      };
    }

    // Simulate confirmation process
    // In a real implementation, this would query nodes for confirmation
    const totalNodes = this.countNodesInTree(tree);
    const confirmationRate = broadcast.chunksSent / (broadcast.chunksGenerated * totalNodes);

    const success = confirmationRate >= mergedConfig.minConfirmations!;

    return {
      messageId,
      success,
      confirmationRate,
      timestamp: Date.now()
    };
  }

  /**
   * Count the total number of nodes in a broadcast tree
   */
  private countNodesInTree(node: BroadcastTreeNode): number {
    let count = 1; // Count this node

    // Recursively count children
    for (const child of node.children) {
      count += this.countNodesInTree(child);
    }

    return count;
  }

  /**
   * Get a broadcast tree for visualization or game mechanics
   */
  public getBroadcastTree(messageId: string): BroadcastTreeNode | null {
    return this.broadcastTrees.get(messageId) || null;
  }

  /**
   * Get all active broadcast trees
   */
  public getAllBroadcastTrees(): Map<string, BroadcastTreeNode> {
    return new Map(this.broadcastTrees);
  }

  /**
   * Get all game nodes
   */
  public getGameNodes(): Map<string, { weight: number, online: boolean }> {
    return new Map(this.gameNodes);
  }

  /**
   * Set a node's online status
   */
  public setNodeStatus(nodeId: string, online: boolean): boolean {
    const node = this.gameNodes.get(nodeId);
    if (!node) return false;

    node.online = online;
    this.gameNodes.set(nodeId, node);
    return true;
  }

  /**
   * Propagate an NFT through the network using RaptorCast
   * This creates a unique game mechanic where NFTs evolve as they propagate
   * @param nft The NFT to propagate
   * @param config Configuration for the propagation
   * @returns Propagation result
   */
  public async propagateNFT(nft: MintedNFT, config?: Partial<RaptorCastConfig>): Promise<NFTPropagationResult> {
    try {
      this.ensureInitialized();
      console.log('RaptorCastService.propagateNFT called for NFT:', nft.tokenId);

      // Check if this NFT has already been propagated
      const existingPropagations = Array.from(this.nftPropagations.values());
      const existingPropagation = existingPropagations.find(p => p.nft.tokenId === nft.tokenId);
      if (existingPropagation) {
        console.log(`NFT ${nft.tokenId} has already been propagated, returning existing result`);
        return existingPropagation;
      }

      console.log('No existing propagation found, creating new propagation...');

      // Serialize the NFT to a buffer for broadcasting
      const nftData = JSON.stringify(nft);
      const nftBuffer = new TextEncoder().encode(nftData);

      // Use a higher redundancy factor for NFTs to ensure they survive network issues
      const nftConfig: Partial<RaptorCastConfig> = {
        redundancyFactor: 5, // Higher redundancy for NFTs
        ...config
      };

      // Encode the NFT data with RaptorCast's erasure coding
      const encodedMessage = await this.encodeMessage(nftBuffer, nftConfig);

      // Add the NFT to the encoded message
      encodedMessage.nft = nft;
      encodedMessage.metadata = encodedMessage.metadata || {};
      encodedMessage.metadata.nftId = nft.tokenId;
      encodedMessage.metadata.isNFTPropagation = true;

      // Broadcast the encoded NFT
      const broadcastResult = await this.broadcastEncodedMessage(encodedMessage, nftConfig);

      // Calculate propagation metrics
      const propagationSpeed = Math.floor(Math.random() * 500) + 100; // 100-600ms (simulated)
      const replicationFactor = broadcastResult.chunksSent / broadcastResult.chunksGenerated;

      // Simulate evolution based on propagation success
      const evolutionFactor = replicationFactor > 0.8 ? Math.random() * 0.2 + 0.1 : 0; // 10-30% evolution if replication > 80%

      // Get the broadcast tree to determine receiving nodes
      const tree = this.getBroadcastTree(broadcastResult.messageId);
      const receivingNodes = this.getReceivingNodesFromTree(tree);

      // Create propagation path (the route the NFT took through the network)
      const propagationPath = this.simulatePropagationPath(tree);

      // Create the NFT propagation result
      const propagationResult: NFTPropagationResult = {
        ...broadcastResult,
        nft,
        propagationSpeed,
        replicationFactor,
        evolutionFactor: evolutionFactor > 0 ? evolutionFactor : undefined,
        receivingNodes,
        propagationPath
      };

      // Store the propagation result
      this.nftPropagations.set(broadcastResult.messageId, propagationResult);

      // Record in MonadDb
      try {
        await this.recordNFTPropagationInDb(propagationResult);
      } catch (dbError) {
        console.error('Error recording NFT propagation in MonadDb:', dbError);
        // Continue even if DB recording fails
      }

      return propagationResult;
    } catch (error) {
      console.error('Error in propagateNFT:', error);
      throw error;
    }
  }

  /**
   * Get receiving nodes from a broadcast tree
   */
  private getReceivingNodesFromTree(tree: BroadcastTreeNode | null): string[] {
    if (!tree) return [];

    const nodes: string[] = [];

    // Don't include the originator
    if (tree.id !== 'originator') {
      nodes.push(tree.id);
    }

    // Recursively get nodes from children
    for (const child of tree.children) {
      nodes.push(...this.getReceivingNodesFromTree(child));
    }

    return nodes;
  }

  /**
   * Simulate the path an NFT takes through the network
   */
  private simulatePropagationPath(tree: BroadcastTreeNode | null): string[] {
    if (!tree) return [];

    const path: string[] = [];

    // Start with the originator
    path.push(tree.id);

    // If there are no children, return just the originator
    if (tree.children.length === 0) return path;

    // Pick a random path through the tree
    let currentNode = tree;
    while (currentNode.children.length > 0) {
      // Pick a random child
      const randomIndex = Math.floor(Math.random() * currentNode.children.length);
      currentNode = currentNode.children[randomIndex];
      path.push(currentNode.id);
    }

    return path;
  }

  /**
   * Record an NFT propagation in MonadDb
   */
  private async recordNFTPropagationInDb(propagation: NFTPropagationResult): Promise<void> {
    try {
      console.log(`Recording NFT propagation ${propagation.messageId} in MonadDb...`);

      // Store the propagation with a unique key based on both message ID and token ID
      const key = `nft-propagation-${propagation.messageId}-${propagation.nft.tokenId}`;
      const timestamp = Date.now();

      // Store in the nft-propagations collection
      const merkleRoot = await monadDb.put(
        key,
        {
          ...propagation,
          recordedAt: timestamp,
          lastUpdated: timestamp,
          blockchainStatus: 'pending' // Will be updated when confirmed on-chain
        },
        'nft-propagations'
      );

      // Also store a reference by token ID for easier lookup
      await monadDb.put(
        `nft-by-token-${propagation.nft.tokenId}`,
        {
          messageId: propagation.messageId,
          merkleRoot,
          timestamp: timestamp,
          tokenId: propagation.nft.tokenId,
          name: propagation.nft.name,
          quality: propagation.nft.quality,
          replicationFactor: propagation.replicationFactor,
          evolutionFactor: propagation.evolutionFactor || 0
        },
        'nft-token-index'
      );

      // Store in a time-indexed collection for historical queries
      await monadDb.put(
        `propagation-history-${timestamp}-${propagation.nft.tokenId}`,
        {
          messageId: propagation.messageId,
          merkleRoot,
          timestamp,
          tokenId: propagation.nft.tokenId,
          name: propagation.nft.name,
          receivingNodes: propagation.receivingNodes.length,
          replicationFactor: propagation.replicationFactor,
          evolutionFactor: propagation.evolutionFactor || 0
        },
        'propagation-history'
      );

      console.log(`Successfully recorded NFT propagation ${propagation.messageId} in MonadDb with merkle root: ${merkleRoot}`);

      // Also store in localStorage for persistence across page refreshes
      try {
        // Get existing propagations from localStorage
        const existingPropagationsJson = localStorage.getItem('propagated-nfts') || '{}';
        const existingPropagations = JSON.parse(existingPropagationsJson);

        // Add this propagation
        existingPropagations[propagation.nft.tokenId] = propagation;

        // Save back to localStorage
        localStorage.setItem('propagated-nfts', JSON.stringify(existingPropagations));
        console.log('Updated propagated NFTs in localStorage');
      } catch (storageError) {
        console.error('Error updating propagated NFTs in localStorage:', storageError);
      }

      // Submit to blockchain (simulated)
      this.submitBroadcastToBlockchain(propagation, merkleRoot);
    } catch (error) {
      console.error('Failed to record NFT propagation in MonadDb:', error);
    }
  }

  /**
   * Get all NFT propagations
   */
  public getAllNFTPropagations(): Map<string, NFTPropagationResult> {
    return new Map(this.nftPropagations);
  }

  /**
   * Get a specific NFT propagation
   */
  public getNFTPropagation(messageId: string): NFTPropagationResult | null {
    return this.nftPropagations.get(messageId) || null;
  }

  /**
   * Get all NFT propagations
   * @returns Array of all NFT propagation results
   */
  public getAllNFTPropagations(): NFTPropagationResult[] {
    return Array.from(this.nftPropagations.values());
  }

  /**
   * Evolve an NFT based on its propagation through the network
   * This creates a unique game mechanic where NFTs gain power based on how well they propagate
   */
  public async evolveNFTFromPropagation(propagationId: string): Promise<MintedNFT | null> {
    const propagation = this.getNFTPropagation(propagationId);
    if (!propagation || !propagation.evolutionFactor) return null;

    const originalNFT = propagation.nft;

    // Find the quality attribute
    const qualityAttr = originalNFT.attributes.find(attr => attr.trait_type === 'Quality');
    if (!qualityAttr) return null;

    // Calculate new quality based on evolution factor
    const originalQuality = Number(qualityAttr.value);
    const qualityIncrease = Math.floor(originalQuality * propagation.evolutionFactor);
    const newQuality = Math.min(100, originalQuality + qualityIncrease);

    // Mint a new evolved NFT
    try {
      const evolvedNFT = await monadNFTService.mintSurpriseToken(newQuality);

      // Update the name to indicate evolution
      evolvedNFT.name = `Evolved ${originalNFT.name}`;
      evolvedNFT.description = `${originalNFT.description} Evolved through RaptorCast propagation.`;

      // Add propagation attributes
      const evolvedAttributes = [...evolvedNFT.attributes];
      evolvedAttributes.push({
        trait_type: 'Evolved From',
        value: originalNFT.tokenId
      });
      evolvedAttributes.push({
        trait_type: 'Propagation Speed',
        value: propagation.propagationSpeed
      });
      evolvedAttributes.push({
        trait_type: 'Replication Factor',
        value: propagation.replicationFactor.toFixed(2)
      });

      evolvedNFT.attributes = evolvedAttributes;

      return evolvedNFT;
    } catch (error) {
      console.error('Error evolving NFT:', error);
      return null;
    }
  }

  /**
   * Submit broadcast data to the Monad blockchain
   */
  private async submitBroadcastToBlockchain(result: BroadcastResult, merkleRoot: string): Promise<void> {
    try {
      // In a real implementation, this would submit the broadcast data to a smart contract
      // For now, we'll simulate the blockchain interaction
      console.log(`Submitting broadcast data to Monad blockchain with merkle root: ${merkleRoot}`);

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a simulated transaction hash
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const blockNumber = Math.floor(Date.now() / 1000) % 1000000; // Simulated block number
      const timestamp = Date.now();

      // Update the broadcast status in MonadDb
      await monadDb.put(
        `raptorcast-broadcast-${result.messageId}`,
        {
          result,
          blockchainStatus: 'confirmed',
          blockConfirmationTime: timestamp,
          blockNumber,
          merkleRoot,
          txHash
        },
        'raptorcast'
      );

      // Also record the transaction in the blockchain history
      await monadDb.put(
        `blockchain-tx-${txHash}`,
        {
          txHash,
          blockNumber,
          timestamp,
          messageId: result.messageId,
          merkleRoot,
          type: 'broadcast',
          nftId: result.nftId,
          status: 'confirmed'
        },
        'blockchain-history'
      );

      // Update the broadcast history entry with blockchain data
      const historyEntries = await monadDb.getAll<any>('broadcast-history');
      const historyEntry = historyEntries.find(entry => entry.messageId === result.messageId);

      if (historyEntry && historyEntry.key) {
        await monadDb.put(
          historyEntry.key,
          {
            ...historyEntry,
            blockNumber,
            txHash,
            blockchainStatus: 'confirmed'
          },
          'broadcast-history'
        );
      }

      console.log(`Broadcast confirmed on Monad blockchain for message ${result.messageId} with tx hash ${txHash}`);
    } catch (error) {
      console.error('Error submitting broadcast to blockchain:', error);
    }
  }

  /**
   * Get broadcast history from MonadDb
   */
  public async getBroadcastHistory(): Promise<any[]> {
    this.ensureInitialized();

    try {
      // Get all broadcast history entries from MonadDb
      const history = await monadDb.getAll<any>('broadcast-history');

      // Sort by timestamp (newest first)
      return history.sort((a: {timestamp: number}, b: {timestamp: number}) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting broadcast history:', error);
      return [];
    }
  }

  /**
   * Verify the integrity of a broadcast using merkle proofs
   */
  public async verifyBroadcastIntegrity(messageId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log(`Verifying broadcast integrity for message ${messageId}`);

      // First try to get from raptorcast namespace
      let broadcast = await monadDb.get<any>(`raptorcast-broadcast-${messageId}`, 'raptorcast');

      // If not found, try to find in blockchain-history
      if (!broadcast || !broadcast.merkleRoot) {
        console.log('Broadcast not found in raptorcast namespace, checking blockchain-history...');
        const blockchainHistory = await monadDb.getAll<any>('blockchain-history');
        broadcast = blockchainHistory.find(entry =>
          entry.messageId === messageId ||
          entry.messageId?.includes(messageId) ||
          (entry.type === 'broadcast')
        );
      }

      // If still not found, try broadcast-history
      if (!broadcast || !broadcast.merkleRoot) {
        console.log('Broadcast not found in blockchain-history, checking broadcast-history...');
        const broadcastHistory = await monadDb.getAll<any>('broadcast-history');
        broadcast = broadcastHistory.find(entry =>
          entry.messageId === messageId ||
          entry.messageId?.includes(messageId)
        );
      }

      // If we still can't find it, return false
      if (!broadcast || !broadcast.merkleRoot) {
        console.log(`No broadcast data found for message ${messageId}`);
        return false;
      }

      console.log(`Found broadcast data for message ${messageId} with merkle root: ${broadcast.merkleRoot}`);

      // In a real implementation, this would verify the merkle proof against the blockchain
      // For now, we'll simulate the verification
      console.log(`Verifying broadcast integrity for message ${messageId} with merkle root: ${broadcast.merkleRoot}`);

      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return success (in a real implementation, this would be based on the actual verification)
      return true;
    } catch (error) {
      console.error('Error verifying broadcast integrity:', error);
      return false;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('RaptorCastService not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
export const raptorCastService = RaptorCastService.getInstance();
