/**
 * Types for State Sync functionality
 */

/**
 * Represents a block header from the Monad blockchain
 */
export interface BlockHeader {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
}

/**
 * Represents account data from the Monad blockchain
 */
export interface AccountData {
  address: string;
  balance: string; // String representation of BigInt
  nonce: number;
  storageRoot: string;
  codeHash: string;
  lastUpdatedBlock: number;
}

/**
 * Represents a chunk of state data
 */
export interface StateChunk {
  chunkId: string;
  chunkIndex: number;
  totalChunks: number;
  targetBlock: number;
  data: string; // Base64 encoded compressed data
  merkleProof: string[];
  chunkHash: string;
}

/**
 * Represents a state sync request
 */
export interface StateSyncRequest {
  targetBlock: number;
  fromBlock?: number;
  includeAccounts?: boolean;
  includeStorage?: boolean;
  chunkSize?: number;
  priority?: StateSyncPriority;
}

/**
 * Represents a state sync response
 */
export interface StateSyncResponse {
  success: boolean;
  targetBlock: number;
  chunks: StateChunk[];
  blockHeader?: BlockHeader;
  merkleRoot: string;
  syncId: string;
  timestamp: number;
}

/**
 * Represents the status of a state sync operation
 */
export interface StateSyncStatus {
  syncId: string;
  targetBlock: number;
  currentBlock?: number;
  progress: number; // 0-100
  chunksReceived: number;
  totalChunks: number;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

/**
 * Priority levels for state sync
 */
export enum StateSyncPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Types of state sync
 */
export enum StateSyncType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  ACCOUNTS_ONLY = 'accounts_only',
  HEADERS_ONLY = 'headers_only'
}

/**
 * Verification result for a state sync
 */
export interface StateSyncVerification {
  syncId: string;
  targetBlock: number;
  isValid: boolean;
  merkleRoot: string;
  verificationTime: number;
  errors?: string[];
}
