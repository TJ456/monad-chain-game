/**
 * Types for Byzantine Fault Tolerance (BFT) consensus
 */

/**
 * Represents a validator node in the BFT consensus
 */
export interface ValidatorNode {
  address: string;
  publicKey: string;
  stake: number;
  isActive: boolean;
  lastSeen: number;
  reputation: number;
  votingPower: number;
}

/**
 * Represents a consensus message in the BFT protocol
 */
export interface ConsensusMessage {
  type: ConsensusMessageType;
  blockNumber: number;
  blockHash: string;
  sender: string;
  signature: string;
  timestamp: number;
  viewNumber: number;
  sequenceNumber: number;
}

/**
 * Types of consensus messages in the BFT protocol
 */
export enum ConsensusMessageType {
  PRE_PREPARE = 'pre_prepare',
  PREPARE = 'prepare',
  COMMIT = 'commit',
  VIEW_CHANGE = 'view_change',
  NEW_VIEW = 'new_view'
}

/**
 * Represents the state of a node in the BFT consensus
 */
export enum ConsensusNodeState {
  IDLE = 'idle',
  PRE_PREPARED = 'pre_prepared',
  PREPARED = 'prepared',
  COMMITTED = 'committed',
  VIEW_CHANGING = 'view_changing'
}

/**
 * Represents a block in the Monad blockchain
 */
export interface ConsensusBlock {
  blockNumber: number;
  blockHash: string;
  parentHash: string;
  timestamp: number;
  transactions: string[];
  stateRoot: string;
  receiptsRoot: string;
  proposer: string;
  signature: string;
  viewNumber: number;
  validators: string[];
  signatures: Record<string, string>;
  isFinalized: boolean;
}

/**
 * Represents a view change in the BFT consensus
 */
export interface ViewChange {
  viewNumber: number;
  blockNumber: number;
  reason: ViewChangeReason;
  initiator: string;
  timestamp: number;
  signatures: Record<string, string>;
}

/**
 * Reasons for a view change in the BFT consensus
 */
export enum ViewChangeReason {
  TIMEOUT = 'timeout',
  LEADER_FAILURE = 'leader_failure',
  BYZANTINE_BEHAVIOR = 'byzantine_behavior',
  NETWORK_PARTITION = 'network_partition'
}

/**
 * Represents the consensus configuration
 */
export interface ConsensusConfig {
  blockTime: number;
  viewChangeTimeout: number;
  minValidators: number;
  maxValidators: number;
  preparationThreshold: number;
  commitThreshold: number;
  viewChangeThreshold: number;
  maxBlockTransactions: number;
  networkId: string;
  chainId: string;
}

/**
 * Represents the consensus statistics
 */
export interface ConsensusStats {
  totalBlocks: number;
  finalizedBlocks: number;
  pendingBlocks: number;
  viewChanges: number;
  averageBlockTime: number;
  currentViewNumber: number;
  activeValidators: number;
  totalValidators: number;
  lastBlockTimestamp: number;
  consensusRate: number;
}

/**
 * Represents a transaction in the consensus system
 */
export interface ConsensusTransaction {
  txHash: string;
  sender: string;
  recipient: string;
  data: string;
  signature: string;
  timestamp: number;
  gasLimit: number;
  gasPrice: number;
  nonce: number;
  status: TransactionStatus;
  blockNumber?: number;
  blockHash?: string;
}

/**
 * Status of a transaction in the consensus system
 */
export enum TransactionStatus {
  PENDING = 'pending',
  INCLUDED = 'included',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized',
  FAILED = 'failed'
}

/**
 * Represents a validator vote in the consensus
 */
export interface ValidatorVote {
  validator: string;
  blockHash: string;
  blockNumber: number;
  voteType: VoteType;
  signature: string;
  timestamp: number;
  viewNumber: number;
}

/**
 * Types of votes in the consensus
 */
export enum VoteType {
  PREPARE = 'prepare',
  COMMIT = 'commit',
  VIEW_CHANGE = 'view_change'
}

/**
 * Represents the result of a block validation
 */
export interface BlockValidationResult {
  isValid: boolean;
  blockHash: string;
  blockNumber: number;
  errors: string[];
  validatorAddress: string;
  timestamp: number;
}
