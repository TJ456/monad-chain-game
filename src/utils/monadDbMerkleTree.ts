import { MerkleTree } from './merkleTree';

/**
 * Creates a specialized Merkle tree optimized for MonadDb operations
 * 
 * This implementation is designed to work efficiently with the batched
 * operations in MonadDb and provides optimized verification for state data.
 */
export class MonadDbMerkleTree extends MerkleTree {
  private batchSize: number;
  private shardCount: number;
  private readonly MAX_BATCH_SIZE = 1000;

  /**
   * Create a new MonadDb Merkle Tree
   * @param data The data to include in the tree
   * @param batchSize The size of batches for efficient processing
   * @param shardCount Number of shards to use (for parallel processing)
   */
  constructor(data: any[], batchSize: number = 100, shardCount: number = 1) {
    super(data);
    this.batchSize = Math.min(batchSize, this.MAX_BATCH_SIZE);
    this.shardCount = Math.max(1, shardCount);
  }

  /**
   * Create a Merkle proof for a specific item in the tree
   * @param index The index of the item
   * @returns The Merkle proof
   */
  public createProof(index: number): string[] {
    const proof: string[] = [];
    let currentIndex = index;
    
    for (let i = 0; i < this.depth; i++) {
      const isRightNode = currentIndex % 2 === 0;
      const siblingIndex = isRightNode ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < this.layers[i].length) {
        proof.push(this.layers[i][siblingIndex]);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }

  /**
   * Verify a Merkle proof for a specific item
   * @param item The item to verify
   * @param proof The Merkle proof
   * @param root The expected Merkle root
   * @returns Whether the proof is valid
   */
  public static verifyProof(item: any, proof: string[], root: string): boolean {
    let hash = MerkleTree.hashItem(item);
    
    for (const proofElement of proof) {
      if (hash < proofElement) {
        hash = MerkleTree.hashPair(hash, proofElement);
      } else {
        hash = MerkleTree.hashPair(proofElement, hash);
      }
    }
    
    return hash === root;
  }

  /**
   * Update the tree with a batch of changes
   * @param changes Array of changes to apply
   * @returns The new Merkle root
   */
  public updateWithBatch(changes: { index: number, newValue: any }[]): string {
    // Process in batches for efficiency
    for (let i = 0; i < changes.length; i += this.batchSize) {
      const batch = changes.slice(i, i + this.batchSize);
      this.processBatch(batch);
    }
    
    // Recalculate the tree
    this.buildTree();
    
    return this.getRoot();
  }

  /**
   * Process a batch of changes
   * @param batch The batch of changes to process
   */
  private processBatch(batch: { index: number, newValue: any }[]): void {
    // Sort by index for more efficient processing
    batch.sort((a, b) => a.index - b.index);
    
    // Apply changes
    for (const change of batch) {
      if (change.index < this.data.length) {
        this.data[change.index] = change.newValue;
      }
    }
  }

  /**
   * Create a sharded Merkle tree for parallel processing
   * @returns Array of Merkle roots for each shard
   */
  public createShards(): string[] {
    const shardRoots: string[] = [];
    const itemsPerShard = Math.ceil(this.data.length / this.shardCount);
    
    for (let i = 0; i < this.shardCount; i++) {
      const start = i * itemsPerShard;
      const end = Math.min(start + itemsPerShard, this.data.length);
      const shardData = this.data.slice(start, end);
      
      if (shardData.length > 0) {
        const shardTree = new MerkleTree(shardData);
        shardRoots.push(shardTree.getRoot());
      }
    }
    
    return shardRoots;
  }

  /**
   * Create a Merkle tree from shard roots
   * @param shardRoots Array of Merkle roots for each shard
   * @returns The Merkle root of the combined tree
   */
  public static combineShards(shardRoots: string[]): string {
    if (shardRoots.length === 0) {
      return '';
    }
    
    if (shardRoots.length === 1) {
      return shardRoots[0];
    }
    
    const tree = new MerkleTree(shardRoots.map(root => ({ value: root })));
    return tree.getRoot();
  }
}

/**
 * Create a MonadDb Merkle tree from game state
 * @param state The game state
 * @param batchSize The batch size for efficient processing
 * @returns The MonadDb Merkle tree
 */
export function createMonadDbMerkleTree(state: any, batchSize: number = 100): MonadDbMerkleTree {
  const data = Object.entries(state).map(([key, value]) => ({ key, value }));
  return new MonadDbMerkleTree(data, batchSize);
}

/**
 * Verify game state against a Merkle root using MonadDb optimized verification
 * @param state The game state to verify
 * @param expectedRoot The expected Merkle root
 * @returns Whether the state is valid
 */
export function verifyMonadDbGameState(state: any, expectedRoot: string): boolean {
  const tree = createMonadDbMerkleTree(state);
  return tree.getRoot() === expectedRoot;
}
