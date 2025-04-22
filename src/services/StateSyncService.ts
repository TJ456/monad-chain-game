import { 
  StateSyncRequest, 
  StateSyncResponse, 
  StateSyncStatus, 
  StateSyncType,
  StateSyncPriority,
  BlockHeader,
  AccountData,
  StateChunk,
  StateSyncVerification
} from '@/types/sync';
import { divideStateIntoChunks, reassembleChunks, verifyChunk, calculateOptimalChunkSize } from '@/utils/stateChunking';
import { MerkleTree } from '@/utils/merkleTree';
import { compress, decompress } from '@/utils/compression';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

/**
 * StateSyncService - Core implementation for synchronizing state with Monad blockchain
 * 
 * Features:
 * - Synchronize state to a target block
 * - Chunk-based state division for efficient transmission
 * - Merkle tree verification for data integrity
 * - Support for account data and block headers
 * - Client-server model for distributed load
 */
export class StateSyncService {
  private static instance: StateSyncService;
  private isInitialized: boolean = false;
  private syncStatuses: Map<string, StateSyncStatus> = new Map();
  private blockHeaders: Map<number, BlockHeader> = new Map();
  private accountData: Map<string, AccountData> = new Map();
  private pendingChunks: Map<string, StateChunk[]> = new Map();
  private syncListeners: ((status: StateSyncStatus) => void)[] = [];
  private networkBandwidth: number = 1000000; // Default to 1MB/s
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StateSyncService {
    if (!StateSyncService.instance) {
      StateSyncService.instance = new StateSyncService();
    }
    return StateSyncService.instance;
  }
  
  /**
   * Initialize the service
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('StateSyncService already initialized');
      return;
    }
    
    // Start periodic sync
    this.syncInterval = setInterval(() => this.performPeriodicSync(), this.SYNC_INTERVAL_MS);
    
    this.isInitialized = true;
    console.log('StateSyncService initialized');
  }
  
  /**
   * Shutdown the service
   */
  public shutdown(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isInitialized = false;
    console.log('StateSyncService shut down');
  }
  
  /**
   * Request state sync to a target block
   * 
   * @param request The sync request parameters
   * @returns The sync ID for tracking
   */
  public async requestSync(request: StateSyncRequest): Promise<string> {
    this.ensureInitialized();
    
    const syncId = uuidv4();
    const startTime = Date.now();
    
    // Create initial status
    const status: StateSyncStatus = {
      syncId,
      targetBlock: request.targetBlock,
      currentBlock: request.fromBlock,
      progress: 0,
      chunksReceived: 0,
      totalChunks: 0,
      startTime,
      status: 'pending'
    };
    
    this.syncStatuses.set(syncId, status);
    this.notifySyncListeners(status);
    
    // Start the sync process
    this.performSync(syncId, request).catch(error => {
      console.error('Error during sync:', error);
      
      // Update status to failed
      const failedStatus = {
        ...this.syncStatuses.get(syncId)!,
        status: 'failed' as const,
        error: error.message,
        endTime: Date.now()
      };
      
      this.syncStatuses.set(syncId, failedStatus);
      this.notifySyncListeners(failedStatus);
      
      toast.error('State sync failed', {
        description: `Failed to sync to block ${request.targetBlock}: ${error.message}`
      });
    });
    
    return syncId;
  }
  
  /**
   * Get the status of a sync operation
   * 
   * @param syncId The sync ID
   * @returns The sync status or null if not found
   */
  public getSyncStatus(syncId: string): StateSyncStatus | null {
    return this.syncStatuses.get(syncId) || null;
  }
  
  /**
   * Get all sync statuses
   * 
   * @returns Array of all sync statuses
   */
  public getAllSyncStatuses(): StateSyncStatus[] {
    return Array.from(this.syncStatuses.values());
  }
  
  /**
   * Add a listener for sync status updates
   * 
   * @param listener The listener function
   */
  public addSyncListener(listener: (status: StateSyncStatus) => void): void {
    this.syncListeners.push(listener);
  }
  
  /**
   * Remove a sync listener
   * 
   * @param listener The listener to remove
   */
  public removeSyncListener(listener: (status: StateSyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index !== -1) {
      this.syncListeners.splice(index, 1);
    }
  }
  
  /**
   * Get a block header
   * 
   * @param blockNumber The block number
   * @returns The block header or null if not found
   */
  public getBlockHeader(blockNumber: number): BlockHeader | null {
    return this.blockHeaders.get(blockNumber) || null;
  }
  
  /**
   * Get account data
   * 
   * @param address The account address
   * @returns The account data or null if not found
   */
  public getAccountData(address: string): AccountData | null {
    return this.accountData.get(address) || null;
  }
  
  /**
   * Verify a completed sync
   * 
   * @param syncId The sync ID to verify
   * @returns The verification result
   */
  public async verifySync(syncId: string): Promise<StateSyncVerification> {
    this.ensureInitialized();
    
    const status = this.syncStatuses.get(syncId);
    if (!status) {
      throw new Error(`Sync ID ${syncId} not found`);
    }
    
    if (status.status !== 'completed') {
      throw new Error(`Sync ${syncId} is not completed (status: ${status.status})`);
    }
    
    const startTime = performance.now();
    
    try {
      // Get the chunks for this sync
      const chunks = this.pendingChunks.get(syncId) || [];
      
      // Verify each chunk
      const merkleRoot = chunks[0]?.merkleProof[chunks[0].merkleProof.length - 1] || '';
      const isValid = chunks.every(chunk => verifyChunk(chunk, merkleRoot));
      
      const endTime = performance.now();
      const verificationTime = endTime - startTime;
      
      const result: StateSyncVerification = {
        syncId,
        targetBlock: status.targetBlock,
        isValid,
        merkleRoot,
        verificationTime
      };
      
      if (!isValid) {
        result.errors = ['Merkle verification failed for one or more chunks'];
      }
      
      return result;
    } catch (error: any) {
      const endTime = performance.now();
      const verificationTime = endTime - startTime;
      
      return {
        syncId,
        targetBlock: status.targetBlock,
        isValid: false,
        merkleRoot: '',
        verificationTime,
        errors: [error.message]
      };
    }
  }
  
  /**
   * Process a state chunk received from the network
   * 
   * @param chunk The state chunk
   * @param syncId The sync ID
   * @returns Whether the chunk was processed successfully
   */
  public processStateChunk(chunk: StateChunk, syncId: string): boolean {
    this.ensureInitialized();
    
    const status = this.syncStatuses.get(syncId);
    if (!status) {
      console.error(`Received chunk for unknown sync ID: ${syncId}`);
      return false;
    }
    
    // Add the chunk to pending chunks
    let chunks = this.pendingChunks.get(syncId) || [];
    
    // Check if we already have this chunk
    const existingChunkIndex = chunks.findIndex(c => c.chunkIndex === chunk.chunkIndex);
    if (existingChunkIndex !== -1) {
      // Replace the existing chunk
      chunks[existingChunkIndex] = chunk;
    } else {
      // Add the new chunk
      chunks.push(chunk);
    }
    
    this.pendingChunks.set(syncId, chunks);
    
    // Update status
    const updatedStatus: StateSyncStatus = {
      ...status,
      chunksReceived: chunks.length,
      totalChunks: chunk.totalChunks,
      progress: Math.floor((chunks.length / chunk.totalChunks) * 100),
      status: 'in_progress'
    };
    
    this.syncStatuses.set(syncId, updatedStatus);
    this.notifySyncListeners(updatedStatus);
    
    // Check if we have all chunks
    if (chunks.length === chunk.totalChunks) {
      this.finalizeSync(syncId);
    }
    
    return true;
  }
  
  /**
   * Get the latest synced block number
   * 
   * @returns The latest block number or 0 if none
   */
  public getLatestSyncedBlock(): number {
    const blockNumbers = Array.from(this.blockHeaders.keys());
    return blockNumbers.length > 0 ? Math.max(...blockNumbers) : 0;
  }
  
  /**
   * Estimate the network bandwidth based on recent syncs
   * 
   * @returns The estimated bandwidth in bytes per second
   */
  public getEstimatedBandwidth(): number {
    return this.networkBandwidth;
  }
  
  /**
   * Get statistics about the sync service
   * 
   * @returns Statistics object
   */
  public getStats(): any {
    const completedSyncs = Array.from(this.syncStatuses.values())
      .filter(status => status.status === 'completed');
    
    const failedSyncs = Array.from(this.syncStatuses.values())
      .filter(status => status.status === 'failed');
    
    const inProgressSyncs = Array.from(this.syncStatuses.values())
      .filter(status => status.status === 'in_progress' || status.status === 'pending');
    
    return {
      totalSyncs: this.syncStatuses.size,
      completedSyncs: completedSyncs.length,
      failedSyncs: failedSyncs.length,
      inProgressSyncs: inProgressSyncs.length,
      accountsTracked: this.accountData.size,
      blockHeadersStored: this.blockHeaders.size,
      latestSyncedBlock: this.getLatestSyncedBlock(),
      estimatedBandwidth: this.networkBandwidth,
      lastSyncTime: this.lastSyncTime
    };
  }
  
  /**
   * Perform the actual sync operation
   * 
   * @param syncId The sync ID
   * @param request The sync request
   */
  private async performSync(syncId: string, request: StateSyncRequest): Promise<void> {
    // In a real implementation, this would communicate with a Monad node
    // For now, we'll simulate the sync process
    
    // Update status to in progress
    const status = this.syncStatuses.get(syncId)!;
    const updatedStatus: StateSyncStatus = {
      ...status,
      status: 'in_progress'
    };
    
    this.syncStatuses.set(syncId, updatedStatus);
    this.notifySyncListeners(updatedStatus);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate receiving block header
    const blockHeader: BlockHeader = this.simulateBlockHeader(request.targetBlock);
    this.blockHeaders.set(request.targetBlock, blockHeader);
    
    // Simulate state data
    const stateData = this.simulateStateData(request);
    
    // Calculate optimal chunk size
    const stateSize = JSON.stringify(stateData).length;
    const chunkSize = request.chunkSize || 
      calculateOptimalChunkSize(stateSize, this.networkBandwidth);
    
    // Divide into chunks
    const chunks = divideStateIntoChunks(stateData, request.targetBlock, chunkSize);
    
    // Process each chunk with a delay to simulate network transmission
    for (let i = 0; i < chunks.length; i++) {
      // Simulate network delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Process the chunk
      this.processStateChunk(chunks[i], syncId);
    }
  }
  
  /**
   * Finalize a sync operation
   * 
   * @param syncId The sync ID
   */
  private finalizeSync(syncId: string): void {
    const status = this.syncStatuses.get(syncId);
    if (!status) {
      return;
    }
    
    const chunks = this.pendingChunks.get(syncId) || [];
    
    try {
      // Reassemble the state
      const state = reassembleChunks(chunks);
      
      if (!state) {
        throw new Error('Failed to reassemble state chunks');
      }
      
      // Process account data if present
      if (state.accounts) {
        for (const [address, data] of Object.entries<any>(state.accounts)) {
          this.accountData.set(address, {
            address,
            ...data,
            lastUpdatedBlock: status.targetBlock
          });
        }
      }
      
      // Update status to completed
      const completedStatus: StateSyncStatus = {
        ...status,
        status: 'completed',
        progress: 100,
        endTime: Date.now()
      };
      
      this.syncStatuses.set(syncId, completedStatus);
      this.notifySyncListeners(completedStatus);
      
      this.lastSyncTime = Date.now();
      
      // Show success toast
      toast.success('State sync completed', {
        description: `Successfully synced to block ${status.targetBlock}`
      });
    } catch (error: any) {
      // Update status to failed
      const failedStatus: StateSyncStatus = {
        ...status,
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      };
      
      this.syncStatuses.set(syncId, failedStatus);
      this.notifySyncListeners(failedStatus);
      
      toast.error('State sync failed', {
        description: `Failed to finalize sync: ${error.message}`
      });
    }
  }
  
  /**
   * Perform periodic sync
   */
  private async performPeriodicSync(): Promise<void> {
    try {
      // Get the latest block number (in a real implementation, this would come from a Monad node)
      const latestBlock = this.simulateLatestBlockNumber();
      
      // Get our latest synced block
      const latestSyncedBlock = this.getLatestSyncedBlock();
      
      // If we're behind, sync to the latest block
      if (latestBlock > latestSyncedBlock) {
        console.log(`Performing periodic sync to block ${latestBlock} (currently at ${latestSyncedBlock})`);
        
        await this.requestSync({
          targetBlock: latestBlock,
          fromBlock: latestSyncedBlock,
          priority: StateSyncPriority.LOW
        });
      }
    } catch (error) {
      console.error('Error during periodic sync:', error);
    }
  }
  
  /**
   * Notify all sync listeners
   * 
   * @param status The sync status
   */
  private notifySyncListeners(status: StateSyncStatus): void {
    for (const listener of this.syncListeners) {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    }
  }
  
  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('StateSyncService not initialized. Call initialize() first.');
    }
  }
  
  /**
   * Simulate a block header (for development/testing)
   * 
   * @param blockNumber The block number
   * @returns A simulated block header
   */
  private simulateBlockHeader(blockNumber: number): BlockHeader {
    return {
      blockNumber,
      blockHash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
      timestamp: Math.floor(Date.now() / 1000),
      parentHash: `0x${(blockNumber - 1).toString(16).padStart(64, '0')}`,
      stateRoot: `0x${(blockNumber * 2).toString(16).padStart(64, '0')}`,
      transactionsRoot: `0x${(blockNumber * 3).toString(16).padStart(64, '0')}`,
      receiptsRoot: `0x${(blockNumber * 4).toString(16).padStart(64, '0')}`
    };
  }
  
  /**
   * Simulate state data (for development/testing)
   * 
   * @param request The sync request
   * @returns Simulated state data
   */
  private simulateStateData(request: StateSyncRequest): any {
    // Create simulated accounts
    const accounts: Record<string, AccountData> = {};
    
    for (let i = 0; i < 10; i++) {
      const address = `0x${i.toString(16).padStart(40, '0')}`;
      accounts[address] = {
        address,
        balance: (1000000 * (i + 1)).toString(),
        nonce: i,
        storageRoot: `0x${(i * 1000).toString(16).padStart(64, '0')}`,
        codeHash: `0x${(i * 2000).toString(16).padStart(64, '0')}`,
        lastUpdatedBlock: request.targetBlock
      };
    }
    
    // Create simulated block data
    return {
      blockNumber: request.targetBlock,
      timestamp: Math.floor(Date.now() / 1000),
      accounts,
      gameState: {
        version: request.targetBlock,
        players: [
          { id: 1, address: '0x1', score: 100 * request.targetBlock },
          { id: 2, address: '0x2', score: 200 * request.targetBlock }
        ],
        lastUpdateTime: Date.now()
      }
    };
  }
  
  /**
   * Simulate the latest block number (for development/testing)
   * 
   * @returns A simulated latest block number
   */
  private simulateLatestBlockNumber(): number {
    // In a real implementation, this would query a Monad node
    return Math.floor(Date.now() / 10000); // Simulated block number based on time
  }
}

// Export singleton instance
export const stateSyncService = StateSyncService.getInstance();
