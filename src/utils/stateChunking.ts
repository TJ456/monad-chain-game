import { StateChunk } from '@/types/sync';
import { compress, decompress } from './compression';
import { MerkleTree } from './merkleTree';
import { keccak256 } from 'js-sha3';

/**
 * Default chunk size in bytes
 */
const DEFAULT_CHUNK_SIZE = 1024 * 50; // 50KB

/**
 * Divides a state object into chunks for efficient transmission
 * 
 * @param state The state object to divide
 * @param targetBlock The target block number
 * @param chunkSize The maximum size of each chunk in bytes
 * @returns Array of state chunks
 */
export function divideStateIntoChunks(
  state: any,
  targetBlock: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): StateChunk[] {
  // Convert state to string
  const stateString = JSON.stringify(state);
  
  // Compress the state
  const compressedState = compress(stateString);
  
  // Calculate total chunks needed
  const totalChunks = Math.ceil(compressedState.length / chunkSize);
  
  // Create a merkle tree for verification
  const chunks: string[] = [];
  
  // Divide the compressed state into chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, compressedState.length);
    chunks.push(compressedState.substring(start, end));
  }
  
  // Create a merkle tree from the chunks
  const merkleTree = new MerkleTree(chunks);
  const merkleRoot = merkleTree.getRoot();
  
  // Create the state chunks with merkle proofs
  return chunks.map((chunkData, index) => {
    const chunkId = `${targetBlock}-${index}`;
    const chunkHash = keccak256(chunkData);
    
    return {
      chunkId,
      chunkIndex: index,
      totalChunks,
      targetBlock,
      data: chunkData,
      merkleProof: merkleTree.getProof(index),
      chunkHash
    };
  });
}

/**
 * Reassembles chunks into the original state
 * 
 * @param chunks The chunks to reassemble
 * @param expectedMerkleRoot The expected merkle root for verification
 * @returns The reassembled state object or null if verification fails
 */
export function reassembleChunks(
  chunks: StateChunk[],
  expectedMerkleRoot?: string
): any | null {
  // Sort chunks by index
  chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
  
  // Verify we have all chunks
  const totalChunks = chunks[0]?.totalChunks || 0;
  if (chunks.length !== totalChunks) {
    console.error(`Missing chunks: ${chunks.length}/${totalChunks}`);
    return null;
  }
  
  // Extract chunk data
  const chunkData = chunks.map(chunk => chunk.data);
  
  // Verify merkle root if provided
  if (expectedMerkleRoot) {
    const merkleTree = new MerkleTree(chunkData);
    const actualRoot = merkleTree.getRoot();
    
    if (actualRoot !== expectedMerkleRoot) {
      console.error('Merkle root verification failed');
      return null;
    }
  }
  
  // Combine chunks
  const compressedState = chunkData.join('');
  
  // Decompress
  const stateString = decompress(compressedState);
  
  // Parse and return
  try {
    return JSON.parse(stateString);
  } catch (error) {
    console.error('Error parsing reassembled state:', error);
    return null;
  }
}

/**
 * Verifies a single chunk against its merkle proof
 * 
 * @param chunk The chunk to verify
 * @param merkleRoot The merkle root to verify against
 * @returns Whether the chunk is valid
 */
export function verifyChunk(chunk: StateChunk, merkleRoot: string): boolean {
  try {
    // Verify the chunk hash
    const calculatedHash = keccak256(chunk.data);
    if (calculatedHash !== chunk.chunkHash) {
      return false;
    }
    
    // Verify the merkle proof
    let currentHash = chunk.chunkHash;
    
    for (let i = 0; i < chunk.merkleProof.length; i++) {
      const proofElement = chunk.merkleProof[i];
      
      // Determine the order of concatenation
      if (i % 2 === 0) {
        currentHash = keccak256(currentHash + proofElement);
      } else {
        currentHash = keccak256(proofElement + currentHash);
      }
    }
    
    return currentHash === merkleRoot;
  } catch (error) {
    console.error('Error verifying chunk:', error);
    return false;
  }
}

/**
 * Calculates the optimal chunk size based on state size and network conditions
 * 
 * @param stateSize The size of the state in bytes
 * @param networkBandwidth The estimated network bandwidth in bytes per second
 * @returns The optimal chunk size in bytes
 */
export function calculateOptimalChunkSize(
  stateSize: number,
  networkBandwidth: number
): number {
  // Base chunk size on network conditions
  // For slow connections, use smaller chunks
  if (networkBandwidth < 50000) { // Less than 50KB/s
    return 1024 * 10; // 10KB
  }
  
  // For medium connections
  if (networkBandwidth < 500000) { // Less than 500KB/s
    return 1024 * 50; // 50KB
  }
  
  // For fast connections
  if (networkBandwidth < 2000000) { // Less than 2MB/s
    return 1024 * 200; // 200KB
  }
  
  // For very fast connections
  return 1024 * 500; // 500KB
}
