export enum CardRarity {
  COMMON = "common",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary"
}

export enum CardType {
  ATTACK = "attack",
  DEFENSE = "defense",
  UTILITY = "utility"
}

// Enhanced Card interface with more Monad-specific properties
export interface Card {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: CardRarity;
  type: CardType;
  attack?: number;
  defense?: number;
  mana: number;
  monadId: string; // For Monad blockchain integration
  onChainMetadata?: {
    creator: string;
    creationBlock: number;
    evolutionStage: number;
    battleHistory: number[];
    lastModifiedBlock?: number;
    composableWith?: string[]; // Card IDs that can be combined with this card
    stateHash?: string; // Cryptographic hash of card's current state
    shardingRegion?: number; // For Monad's sharding capabilities
  };
  // New state channel support for instant off-chain moves with on-chain settlement
  stateChannels?: {
    channelId: string;
    lastStateHash: string;
    pendingMoves: number;
    participantAddresses: string[];
  };
  // Special effect for card gameplay
  specialEffect?: {
    description: string;
    effectType: 'BUFF' | 'DEBUFF' | 'SHIELD' | 'DRAIN';
  };
}

export interface Player {
  id: string;
  username: string;
  monadAddress: string; // Monad wallet address
  avatar: string;
  level: number;
  experience: number;
  wins: number;
  losses: number;
  cards: Card[];
  monad: number; // MONAD tokens balance
  // Add shard tracking to player
  shards: number;
  lastTrialTime?: number;
  dailyTrialsRemaining: number;
  transactionHistory?: {
    txHash: string;
    type: 'BATTLE' | 'TRADE' | 'MINT' | 'EVOLVE' | 'COMPOSE';
    timestamp: number;
    details: string;
  }[];
  // Layer 2 data for fast transactions
  l2State?: {
    pendingRewards: number;
    activeChallenges: string[];
    lastStateRoot: string;
    verifiedUntilBlock: number;
  };
  // Governance participation
  governance?: {
    votingPower: number;
    proposalsCreated: number;
    lastVoteBlock: number;
    delegatedTo?: string;
  };
}

export interface MarketListing {
  id: string;
  card: Card;
  price: number;
  seller: string;
  timestamp: number;
  monadContract: string; // Monad smart contract address
  monadTxHash?: string; // Transaction hash on Monad blockchain
  // Atomic swap capabilities
  atomicSwapDetails?: {
    desiredCards?: string[];
    partialFulfillment: boolean;
    expiryBlock: number;
    royaltyReceiver: string;
    royaltyPercentage: number;
  };
}

export interface GameState {
  isOnChain: boolean;
  currentBlockHeight?: number;
  lastSyncedBlock?: number;
  pendingTransactions: number;
  networkStatus: 'connected' | 'syncing' | 'disconnected';
  // New Monad-specific state tracking
  shardInfo?: {
    currentShard: number;
    totalShards: number;
    crossShardPending: number;
  };
  // ZK-proof verification status for game integrity
  zkVerification?: {
    lastProofHash: string;
    verifiedUntilMove: number;
    proofGenerationTime: number;
  };
  // Consensus metrics
  consensus?: {
    currentValidators: number;
    finalizationRate: number;
    averageBlockTime: number;
  };
}

// Enhanced Monad-specific interfaces
export interface MonadTransaction {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  blockHeight: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'mint' | 'battle' | 'trade' | 'evolve' | 'compose' | 'governance';
  // Gas optimization data
  executionMetrics?: {
    gasUsed: number;
    gasPrice: number;
    executionTime: number;
    priority: number;
  };
  // Cross-chain interoperability
  bridgeData?: {
    sourceChain?: string;
    destinationChain?: string;
    bridgeContract?: string;
    relayerFee?: number;
  };
}

export interface MonadGameMove {
  moveId: string;
  playerAddress: string;
  cardId: string;
  moveType: 'attack' | 'defend' | 'special' | 'compose' | 'evolve';
  timestamp: number;
  onChainSignature?: string;
  verified: boolean;
  // ZK-proof for move validity
  zkProof?: {
    proof: string;
    publicInputs: string[];
    verificationKey: string;
  };
  // State channel data
  stateChannel?: {
    channelId: string;
    sequenceNumber: number;
    counterpartySignature?: string;
  };
}

// ZK-rollup batch for efficient move processing
export interface MovesBatch {
  batchId: string;
  moves: MonadGameMove[];
  stateRoot: string;
  zkProof: string;
  verificationTime: number;
  submittedInBlock: number;
}

// Cross-shard game communication
export interface ShardCommunication {
  sourceShard: number;
  targetShard: number;
  messageType: 'STATE_UPDATE' | 'ASSET_TRANSFER' | 'BATTLE_RESULT';
  payload: string;
  gasPayment: number;
  status: 'pending' | 'delivered' | 'failed';
}

// Composable cards system
export interface CardComposition {
  resultCardId: string;
  inputCardIds: string[];
  compositionBlock: number;
  compositionType: 'FUSION' | 'EVOLUTION' | 'ENCHANTMENT';
  permanentEffect: boolean;
}

// On-chain governance proposal
export interface GovernanceProposal {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  startBlock: number;
  endBlock: number;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  affectedGameMechanics: string[];
}

// Add new interfaces for the Shard system
export interface ShardTransaction {
  id: string;
  playerAddress: string;
  amount: number;
  reason: 'BATTLE_WIN' | 'NFT_REDEMPTION' | 'DAILY_REWARD';
  timestamp: number;
  expiryTimestamp: number;
  tier: AIDifficultyTier;
  verified: boolean;
  onChainTxHash?: string;
}

export enum AIDifficultyTier {
  NOVICE = 'novice',
  VETERAN = 'veteran',
  LEGEND = 'legend'
}

export interface TierRequirement {
  tier: AIDifficultyTier;
  requiredWinRate: number;
  shardReward: number;
  nftRarity: CardRarity;
}

export interface NFTRedemptionRule {
  shardsRequired: number;
  cooldownPeriod: number; // in milliseconds
  maxDailyTrials: number;
  gasCost: number;
}
