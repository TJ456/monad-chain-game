import { MerkleTree } from '@/utils/merkleTree';
import { StateSyncPriority } from '@/types/sync';
import { toast } from 'sonner';

// Consensus node states
export enum ConsensusNodeState {
  NORMAL = 'normal',
  VIEW_CHANGE = 'view_change',
  RECOVERING = 'recovering'
}

// Message types for PBFT consensus
export enum ConsensusMessageType {
  PRE_PREPARE = 'pre_prepare',
  PREPARE = 'prepare',
  COMMIT = 'commit',
  VIEW_CHANGE = 'view_change',
  NEW_VIEW = 'new_view'
}

// Block data structure
export interface ConsensusBlock {
  number: number;
  timestamp: number;
  transactions: string[];
  stateRoot: string;
  parentHash: string;
  merkleRoot: string;
}

// Consensus message structure
export interface ConsensusMessage {
  type: ConsensusMessageType;
  viewNumber: number;
  sequenceNumber: number;
  blockHash?: string;
  block?: ConsensusBlock;
  signature?: string;
  senderId: string;
}

// PBFT consensus core implementation
export class PBFTConsensus {
  private static instance: PBFTConsensus;
  private currentView: number = 0;
  private currentSequence: number = 0;
  private nodeState: ConsensusNodeState = ConsensusNodeState.NORMAL;
  private isPrimary: boolean = false;
  private validators: Set<string> = new Set();
  private messages: Map<string, ConsensusMessage[]> = new Map();
  private preparedBlocks: Map<number, ConsensusBlock> = new Map();
  private committedBlocks: Map<number, ConsensusBlock> = new Map();

  private constructor() {}

  public static getInstance(): PBFTConsensus {
    if (!PBFTConsensus.instance) {
      PBFTConsensus.instance = new PBFTConsensus();
    }
    return PBFTConsensus.instance;
  }

  // Initialize the consensus system
  public async initialize(validators: string[], nodeId: string): Promise<void> {
    this.validators = new Set(validators);
    this.isPrimary = nodeId === validators[0]; // Simple primary selection based on index
    this.currentView = 0;
    this.currentSequence = 0;
    
    console.log(`Initialized PBFT consensus. Primary: ${this.isPrimary}`);
  }

  // Create a new block proposal
  public async proposeBlock(transactions: string[]): Promise<ConsensusBlock | null> {
    if (!this.isPrimary) {
      console.warn('Only primary node can propose blocks');
      return null;
    }

    const block: ConsensusBlock = {
      number: this.currentSequence + 1,
      timestamp: Date.now(),
      transactions,
      stateRoot: '', // Will be calculated
      parentHash: this.getLatestBlockHash(),
      merkleRoot: this.calculateMerkleRoot(transactions)
    };

    // Broadcast pre-prepare message
    const message: ConsensusMessage = {
      type: ConsensusMessageType.PRE_PREPARE,
      viewNumber: this.currentView,
      sequenceNumber: this.currentSequence + 1,
      block,
      blockHash: this.calculateBlockHash(block),
      senderId: Array.from(this.validators)[0]
    };

    await this.broadcastMessage(message);
    return block;
  }

  // Handle receiving a consensus message
  public async handleMessage(message: ConsensusMessage): Promise<void> {
    if (!this.validators.has(message.senderId)) {
      console.warn('Message from unknown validator');
      return;
    }

    // Store message
    const key = `${message.viewNumber}-${message.sequenceNumber}`;
    if (!this.messages.has(key)) {
      this.messages.set(key, []);
    }
    this.messages.get(key)!.push(message);

    switch (message.type) {
      case ConsensusMessageType.PRE_PREPARE:
        await this.handlePrePrepare(message);
        break;
      case ConsensusMessageType.PREPARE:
        await this.handlePrepare(message);
        break;
      case ConsensusMessageType.COMMIT:
        await this.handleCommit(message);
        break;
      case ConsensusMessageType.VIEW_CHANGE:
        await this.handleViewChange(message);
        break;
    }
  }

  // Handle pre-prepare phase
  private async handlePrePrepare(message: ConsensusMessage): Promise<void> {
    if (!message.block || !message.blockHash) return;

    // Verify block
    if (!this.verifyBlock(message.block)) {
      console.warn('Invalid block in pre-prepare');
      return;
    }

    // Send prepare message
    const prepareMsg: ConsensusMessage = {
      type: ConsensusMessageType.PREPARE,
      viewNumber: this.currentView,
      sequenceNumber: message.sequenceNumber,
      blockHash: message.blockHash,
      senderId: Array.from(this.validators)[0]
    };

    await this.broadcastMessage(prepareMsg);
  }

  // Handle prepare phase
  private async handlePrepare(message: ConsensusMessage): Promise<void> {
    const key = `${message.viewNumber}-${message.sequenceNumber}`;
    const prepareMessages = this.messages.get(key)?.filter(m => 
      m.type === ConsensusMessageType.PREPARE && m.blockHash === message.blockHash
    );

    // Check if we have enough prepare messages (2f + 1)
    if (prepareMessages && prepareMessages.length >= this.getRequiredPrepares()) {
      // Send commit message
      const commitMsg: ConsensusMessage = {
        type: ConsensusMessageType.COMMIT,
        viewNumber: this.currentView,
        sequenceNumber: message.sequenceNumber,
        blockHash: message.blockHash,
        senderId: Array.from(this.validators)[0]
      };

      await this.broadcastMessage(commitMsg);
    }
  }

  // Handle commit phase
  private async handleCommit(message: ConsensusMessage): Promise<void> {
    const key = `${message.viewNumber}-${message.sequenceNumber}`;
    const commitMessages = this.messages.get(key)?.filter(m => 
      m.type === ConsensusMessageType.COMMIT && m.blockHash === message.blockHash
    );

    // Check if we have enough commit messages (2f + 1)
    if (commitMessages && commitMessages.length >= this.getRequiredCommits()) {
      const block = this.preparedBlocks.get(message.sequenceNumber);
      if (block) {
        await this.finalizeBlock(block);
        this.currentSequence = message.sequenceNumber;
      }
    }
  }

  // Utility methods
  private getRequiredPrepares(): number {
    return Math.floor((2 * this.validators.size) / 3) + 1;
  }

  private getRequiredCommits(): number {
    return Math.floor((2 * this.validators.size) / 3) + 1;
  }

  private calculateMerkleRoot(transactions: string[]): string {
    const tree = new MerkleTree(transactions);
    return tree.getRoot();
  }

  private getLatestBlockHash(): string {
    const latestBlock = Array.from(this.committedBlocks.values()).pop();
    return latestBlock ? this.calculateBlockHash(latestBlock) : '0'.repeat(64);
  }

  private calculateBlockHash(block: ConsensusBlock): string {
    const blockData = JSON.stringify(block);
    return new MerkleTree([blockData]).getRoot();
  }

  private verifyBlock(block: ConsensusBlock): boolean {
    return block.parentHash === this.getLatestBlockHash() &&
           block.number === this.currentSequence + 1;
  }

  private async broadcastMessage(message: ConsensusMessage): Promise<void> {
    // In a real implementation, this would broadcast to other nodes
    // For now, we'll just process it locally
    await this.handleMessage(message);
  }

  private async finalizeBlock(block: ConsensusBlock): Promise<void> {
    this.committedBlocks.set(block.number, block);
    toast.success('Block committed', {
      description: `Block ${block.number} has been committed to the chain`
    });
  }

  // View change handling
  private async handleViewChange(message: ConsensusMessage): Promise<void> {
    this.nodeState = ConsensusNodeState.VIEW_CHANGE;
    // View change implementation would go here
    // This would include collecting view change messages and transitioning to a new view
  }
}