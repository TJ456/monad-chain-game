import { keccak256 } from 'js-sha3';

/**
 * A class for creating and verifying Merkle trees
 * Used for efficient verification of game state integrity
 */
export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  /**
   * Create a new Merkle tree from a list of leaf values
   * @param values The values to include in the tree
   * @param hashFn Optional custom hash function (defaults to keccak256)
   */
  constructor(values: string[], private hashFn: (data: string) => string = keccak256) {
    // Hash the leaf values
    this.leaves = values.map(v => this.hashFn(v));
    this.layers = [this.leaves];

    // Build the tree
    this.buildTree();
  }

  /**
   * Build the Merkle tree from the leaf nodes
   */
  private buildTree(): void {
    let currentLayer = this.leaves;

    // Continue until we reach the root (a single node)
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      // Process pairs of nodes
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          // Hash the pair of nodes
          const combined = currentLayer[i] + currentLayer[i + 1];
          nextLayer.push(this.hashFn(combined));
        } else {
          // Odd number of nodes, promote the last one
          nextLayer.push(currentLayer[i]);
        }
      }

      // Add the new layer to our tree
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  /**
   * Get the root hash of the Merkle tree
   * @returns The root hash
   */
  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Generate a Merkle proof for a leaf value
   * @param index The index of the leaf in the original array
   * @returns An array of hashes that make up the proof
   */
  getProof(index: number): string[] {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Index out of range');
    }

    const proof: string[] = [];
    let currentIndex = index;

    // Traverse up the tree, collecting sibling nodes
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 0;
      const siblingIndex = isRightNode ? currentIndex + 1 : currentIndex - 1;

      // If there's a sibling (might not be for odd-length layers)
      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      // Move to the parent index in the next layer
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Verify a Merkle proof for a given value
   * @param value The original value (will be hashed)
   * @param proof The Merkle proof
   * @param root The expected root hash
   * @returns True if the proof is valid
   */
  static verify(
    value: string,
    proof: string[],
    root: string,
    hashFn: (data: string) => string = keccak256
  ): boolean {
    // Start with the leaf hash
    let hash = hashFn(value);

    // Apply each proof element
    for (const proofElement of proof) {
      // Sort the hashes to ensure consistent ordering
      const pair = [hash, proofElement].sort();
      hash = hashFn(pair[0] + pair[1]);
    }

    // Check if we've arrived at the expected root
    return hash === root;
  }

  /**
   * Get all leaves in the tree
   * @returns Array of leaf hashes
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Get the index of a value in the tree
   * @param value The value to find
   * @returns The index of the value, or -1 if not found
   */
  getLeafIndex(value: string): number {
    const hash = this.hashFn(value);
    return this.leaves.findIndex(leaf => leaf === hash);
  }

  /**
   * Create a compact representation of the tree for serialization
   * @returns Object with root, leaves and total node count
   */
  serialize(): { root: string; leaves: string[]; nodeCount: number } {
    return {
      root: this.getRoot(),
      leaves: this.leaves,
      nodeCount: this.layers.reduce((sum, layer) => sum + layer.length, 0)
    };
  }

  /**
   * Create a Merkle tree from serialized data
   * @param data The serialized tree data
   * @returns A new MerkleTree instance
   */
  static deserialize(
    data: { root: string; leaves: string[] },
    hashFn: (data: string) => string = keccak256
  ): MerkleTree {
    // Create a dummy tree with the same leaves
    const tree = new MerkleTree([], hashFn);
    tree.leaves = data.leaves;
    tree.layers = [tree.leaves];
    tree.buildTree();

    // Verify the root matches
    if (tree.getRoot() !== data.root) {
      throw new Error('Invalid Merkle tree data: root hash mismatch');
    }

    return tree;
  }
}

/**
 * Create a Merkle tree from game state data
 * @param gameState The game state object
 * @returns A MerkleTree instance
 */
export function createGameStateMerkleTree(gameState: any): MerkleTree {
  // Convert game state properties to strings for hashing
  const stateEntries = Object.entries(gameState)
    .filter(([key]) => !key.startsWith('_') && key !== 'merkleRoot' && key !== 'merkleProof')
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`);

  return new MerkleTree(stateEntries);
}

/**
 * Verify the integrity of a game state using its Merkle root
 * @param gameState The game state to verify
 * @param expectedRoot The expected Merkle root
 * @returns True if the state is valid
 */
export function verifyGameState(gameState: any, expectedRoot: string): boolean {
  const tree = createGameStateMerkleTree(gameState);
  return tree.getRoot() === expectedRoot;
}

/**
 * Create a Merkle proof for a specific property in the game state
 * @param gameState The game state
 * @param property The property to create a proof for
 * @returns The Merkle proof or null if property doesn't exist
 */
export function createPropertyProof(gameState: any, property: string): string[] | null {
  if (!(property in gameState)) {
    return null;
  }

  const tree = createGameStateMerkleTree(gameState);
  const propertyString = `${property}:${JSON.stringify(gameState[property])}`;
  const index = tree.getLeafIndex(propertyString);

  if (index === -1) {
    return null;
  }

  return tree.getProof(index);
}

/**
 * Verify a property value using a Merkle proof
 * @param property The property name
 * @param value The property value
 * @param proof The Merkle proof
 * @param root The Merkle root
 * @returns True if the property value is valid
 */
export function verifyPropertyWithProof(
  property: string,
  value: any,
  proof: string[],
  root: string
): boolean {
  const propertyString = `${property}:${JSON.stringify(value)}`;
  return MerkleTree.verify(propertyString, proof, root);
}
