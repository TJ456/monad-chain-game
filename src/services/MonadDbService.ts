import { GameState } from './GameSyncService';
import { GameStateCheckpoint, CheckpointType } from './GameStateManager';
import { compress, decompress } from '../utils/compression';
import { MerkleTree, createGameStateMerkleTree } from '../utils/merkleTree';

/**
 * MonadDb configuration options
 */
export interface MonadDbConfig {
  cacheSize: number;        // Size of in-memory cache in MB
  batchSize: number;        // Size of batched writes
  compressionLevel: number; // 0-9, where 9 is max compression
  persistToDisk: boolean;   // Whether to persist data to disk
  storageQuota: number;     // Max storage in MB
  enableSharding: boolean;  // Enable data sharding
  replicationFactor: number;// Number of replicas to maintain
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Storage entry in MonadDb
 */
interface MonadDbEntry<T> {
  key: string;
  value: T;
  merkleRoot: string;
  timestamp: number;
  version: number;
  compressed: boolean;
  compressedData?: string;
  metadata?: Record<string, any>;
}

/**
 * Batch update operation
 */
interface BatchOperation<T> {
  type: 'put' | 'del';
  key: string;
  value?: T;
}

/**
 * MonadDb - High-performance state backend optimized for Monad blockchain
 *
 * Features:
 * - In-memory caching with configurable size
 * - Efficient merkle trie storage
 * - Batched updates for efficient merkle root updates
 * - Compression for reduced storage requirements
 * - Asynchronous reads and writes
 */
export class MonadDbService {
  private static instance: MonadDbService;
  private cache: Map<string, MonadDbEntry<any>> = new Map();
  private pendingBatch: BatchOperation<any>[] = [];
  private merkleRoots: Map<string, string> = new Map(); // namespace -> root
  private config: MonadDbConfig;
  private storageEstimate: number = 0;
  private isInitialized: boolean = false;
  private lastFlushTime: number = 0;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_NAMESPACE = 'default';

  // Statistics
  private stats = {
    reads: 0,
    writes: 0,
    hits: 0,
    misses: 0,
    batchedWrites: 0,
    compressionRatio: 0,
    averageAccessTime: 0,
    storageUsage: 0,       // In MB
    storageQuota: 0,       // In MB
    storagePercentage: 0,  // Usage as percentage of quota
    lastSyncTime: 0,       // Timestamp of last sync
    totalEntries: 0,       // Total number of entries
    merkleRootUpdates: 0,  // Number of merkle root updates
    transactionCount: 0    // Number of transactions processed
  };

  private constructor() {
    // Default configuration
    this.config = {
      cacheSize: 1024, // 1GB
      batchSize: 100,
      compressionLevel: 6,
      persistToDisk: true,
      storageQuota: 5120, // 5GB
      enableSharding: false,
      replicationFactor: 1,
      logLevel: 'info'
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MonadDbService {
    if (!MonadDbService.instance) {
      MonadDbService.instance = new MonadDbService();
    }
    return MonadDbService.instance;
  }

  /**
   * Initialize the database with configuration
   */
  public async initialize(config?: Partial<MonadDbConfig>): Promise<void> {
    if (this.isInitialized) {
      this.log('warn', 'MonadDb already initialized');
      return;
    }

    // Apply custom configuration
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.log('info', `Initializing MonadDb with ${this.config.cacheSize}MB cache`);

    // Initialize IndexedDB
    try {
      await this.initializeDatabase();
      this.log('info', 'IndexedDB initialized successfully');
    } catch (error) {
      this.log('error', `Error initializing IndexedDB: ${error}`);
    }

    // Start periodic flush
    this.flushInterval = setInterval(() => this.flushBatch(), 5000);

    this.isInitialized = true;
    this.lastFlushTime = Date.now();
    this.stats.lastSyncTime = Date.now();

    // Initialize storage estimate
    await this.updateStorageEstimate();

    // Load existing data from IndexedDB
    await this.loadExistingData();

    this.log('info', 'MonadDb initialized successfully');
  }

  /**
   * Store a value in the database
   */
  public async put<T>(key: string, value: T, namespace: string = this.DEFAULT_NAMESPACE): Promise<string> {
    this.ensureInitialized();
    const startTime = performance.now();

    // Create merkle tree for the value if it's an object
    let merkleRoot = '';
    if (typeof value === 'object' && value !== null) {
      const serializedEntries = Object.entries(value).map(([k, v]) => JSON.stringify({ key: k, value: v }));
      const tree = new MerkleTree(serializedEntries);
      merkleRoot = tree.getRoot();
    } else {
      merkleRoot = this.hashValue(value);
    }

    // Prepare the entry
    const compressed = this.shouldCompress(value);
    let compressedData: string | undefined;

    if (compressed) {
      compressedData = compress(JSON.stringify(value));
    }

    const fullKey = `${namespace}:${key}`;
    const version = (this.cache.get(fullKey)?.version || 0) + 1;

    const entry: MonadDbEntry<T> = {
      key: fullKey,
      value: compressed ? null as any : value,
      merkleRoot,
      timestamp: Date.now(),
      version,
      compressed,
      compressedData,
      metadata: {
        namespace,
        originalKey: key
      }
    };

    // Add to cache
    this.cache.set(fullKey, entry);

    // Add to batch
    this.pendingBatch.push({
      type: 'put',
      key: fullKey,
      value: entry
    });

    // Update namespace merkle root
    this.updateNamespaceMerkleRoot(namespace);

    // Auto-flush if batch size reached
    if (this.pendingBatch.length >= this.config.batchSize) {
      await this.flushBatch();
    }

    // Update stats
    this.stats.writes++;
    this.stats.averageAccessTime =
      (this.stats.averageAccessTime * (this.stats.reads + this.stats.writes - 1) +
      (performance.now() - startTime)) / (this.stats.reads + this.stats.writes);

    return merkleRoot;
  }

  /**
   * Retrieve a value from the database
   */
  public async get<T>(key: string, namespace: string = this.DEFAULT_NAMESPACE): Promise<T | null> {
    this.ensureInitialized();
    const startTime = performance.now();

    const fullKey = `${namespace}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      // Cache miss
      this.stats.misses++;

      // Try to load from persistent storage if enabled
      if (this.config.persistToDisk) {
        try {
          const loadedEntry = await this.loadFromDisk<T>(fullKey);
          if (loadedEntry) {
            this.cache.set(fullKey, loadedEntry);

            // Update stats
            this.stats.reads++;
            this.stats.averageAccessTime =
              (this.stats.averageAccessTime * (this.stats.reads + this.stats.writes - 1) +
              (performance.now() - startTime)) / (this.stats.reads + this.stats.writes);

            return this.extractValue<T>(loadedEntry);
          }
        } catch (error) {
          this.log('error', `Error loading from disk: ${error}`);
        }
      }

      return null;
    }

    // Cache hit
    this.stats.hits++;
    this.stats.reads++;

    // Update stats
    this.stats.averageAccessTime =
      (this.stats.averageAccessTime * (this.stats.reads + this.stats.writes - 1) +
      (performance.now() - startTime)) / (this.stats.reads + this.stats.writes);

    return this.extractValue<T>(entry);
  }

  /**
   * Delete a value from the database
   */
  public async delete(key: string, namespace: string = this.DEFAULT_NAMESPACE): Promise<boolean> {
    this.ensureInitialized();

    const fullKey = `${namespace}:${key}`;
    const exists = this.cache.has(fullKey);

    // Remove from cache
    this.cache.delete(fullKey);

    // Add to batch
    this.pendingBatch.push({
      type: 'del',
      key: fullKey
    });

    // Update namespace merkle root
    this.updateNamespaceMerkleRoot(namespace);

    // Auto-flush if batch size reached
    if (this.pendingBatch.length >= this.config.batchSize) {
      await this.flushBatch();
    }

    return exists;
  }

  /**
   * Store a game state checkpoint
   */
  public async storeCheckpoint(checkpoint: GameStateCheckpoint, namespace: string = 'gamestate'): Promise<string> {
    // Create a unique key for the checkpoint
    const key = `checkpoint-${checkpoint.timestamp}-${Math.random().toString(36).substring(2, 9)}`;

    // Store the checkpoint
    return this.put(key, checkpoint, namespace);
  }

  /**
   * Retrieve a game state checkpoint by its merkle root
   */
  public async getCheckpointByMerkleRoot(merkleRoot: string, namespace: string = 'gamestate'): Promise<GameStateCheckpoint | null> {
    // Search for checkpoint with matching merkle root
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${namespace}:`) && entry.merkleRoot === merkleRoot) {
        return this.extractValue<GameStateCheckpoint>(entry);
      }
    }

    // Not found in cache, try to load from disk if enabled
    if (this.config.persistToDisk) {
      try {
        // This would require a more sophisticated index in a real implementation
        // For now, we'll return null as this is just a simulation
        return null;
      } catch (error) {
        this.log('error', `Error loading checkpoint from disk: ${error}`);
      }
    }

    return null;
  }

  /**
   * Get all checkpoints in a namespace
   */
  public async getAllCheckpoints<T>(namespace: string): Promise<T[]> {
    return this.getAllInNamespace<T>(namespace);
  }

  /**
   * Get the merkle root for a namespace
   */
  public getMerkleRoot(namespace: string = this.DEFAULT_NAMESPACE): string {
    return this.merkleRoots.get(namespace) || '';
  }

  /**
   * Flush pending batch operations to persistent storage
   */
  public async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) {
      return;
    }

    this.log('debug', `Flushing batch of ${this.pendingBatch.length} operations`);

    if (this.config.persistToDisk) {
      try {
        // Use IndexedDB for actual persistent storage
        const db = await this.openDatabase();

        // Create a transaction and process all operations
        const transaction = db.transaction('monadDb', 'readwrite');
        const store = transaction.objectStore('monadDb');

        // Process each operation in the batch
        for (const op of this.pendingBatch) {
          if (op.type === 'put' && op.value) {
            store.put(op.value);
          } else if (op.type === 'del') {
            store.delete(op.key);
          }
        }

        // Wait for the transaction to complete
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => {
            this.stats.batchedWrites += this.pendingBatch.length;
            resolve();
          };

          transaction.onerror = () => {
            reject(transaction.error);
          };
        });

        this.log('info', `Successfully persisted ${this.pendingBatch.length} operations to IndexedDB`);
      } catch (error) {
        this.log('error', `Error flushing batch to IndexedDB: ${error}`);
      }
    }

    // Clear the batch
    this.pendingBatch = [];
    this.lastFlushTime = Date.now();

    // Update storage estimate
    this.updateStorageEstimate();
  }

  /**
   * Get database statistics
   */
  public getStats(): typeof this.stats & {
    cacheSize: number,
    pendingBatchSize: number,
    merkleRoots: number,
    namespaces: string[],
    uptime: number
  } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      pendingBatchSize: this.pendingBatch.length,
      merkleRoots: this.merkleRoots.size,
      namespaces: Array.from(new Set(Array.from(this.cache.keys()).map(key => key.split(':')[0]))),
      uptime: Date.now() - this.lastFlushTime
    };
  }

  /**
   * Clean up resources
   */
  public shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush any pending operations
    this.flushBatch().catch(err => {
      this.log('error', `Error during shutdown: ${err}`);
    });

    this.log('info', 'MonadDb shut down');
  }

  /**
   * Clear all data
   */
  public async clear(): Promise<void> {
    this.cache.clear();
    this.pendingBatch = [];
    this.merkleRoots.clear();
    this.updateStorageEstimate();

    this.log('info', 'MonadDb cleared');
  }

  /**
   * Update the merkle root for a namespace
   */
  private updateNamespaceMerkleRoot(namespace: string): void {
    // Collect all entries in the namespace
    const entries: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${namespace}:`)) {
        entries.push(JSON.stringify({
          key: entry.key,
          value: entry.merkleRoot
        }));
      }
    }

    if (entries.length === 0) {
      this.merkleRoots.delete(namespace);
      return;
    }

    // Create a merkle tree from the entries
    const tree = new MerkleTree(entries);
    const root = tree.getRoot();

    // Update the namespace root
    this.merkleRoots.set(namespace, root);
  }

  /**
   * Extract the value from an entry, handling decompression if needed
   */
  private extractValue<T>(entry: MonadDbEntry<any>): T | null {
    if (!entry) return null;

    if (entry.compressed && entry.compressedData) {
      try {
        const decompressed = decompress(entry.compressedData);
        return JSON.parse(decompressed);
      } catch (error) {
        this.log('error', `Error decompressing data: ${error}`);
        return null;
      }
    }

    return entry.value as T;
  }

  /**
   * Load an entry from disk
   */
  private async loadFromDisk<T>(fullKey: string): Promise<MonadDbEntry<T> | null> {
    // Use IndexedDB for actual persistent storage
    try {
      // Open IndexedDB database
      const db = await this.openDatabase();

      // Get the entry from the store
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('monadDb', 'readonly');
        const store = transaction.objectStore('monadDb');
        const request = store.get(fullKey);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result as MonadDbEntry<T>);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      this.log('error', `Error loading from IndexedDB: ${error}`);
      return null;
    }
  }

  /**
   * Determine if a value should be compressed
   */
  private shouldCompress(value: any): boolean {
    // Compress objects and strings over a certain size
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).length > 1024; // Compress objects larger than 1KB
    }

    if (typeof value === 'string') {
      return value.length > 1024; // Compress strings larger than 1KB
    }

    return false;
  }

  /**
   * Create a hash of a primitive value
   */
  private hashValue(value: any): string {
    // In a real implementation, this would use a proper hashing function
    // For this simulation, we'll just use a simple hash
    const str = String(value);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString(16).padStart(64, '0');
  }

  /**
   * Update the storage estimate
   */
  private async updateStorageEstimate(): Promise<void> {
    // Estimate storage usage
    let estimate = 0;

    for (const entry of this.cache.values()) {
      if (entry.compressed && entry.compressedData) {
        estimate += entry.compressedData.length;
      } else if (entry.value) {
        estimate += JSON.stringify(entry.value).length;
      }
    }

    this.storageEstimate = estimate / (1024 * 1024); // Convert to MB

    // Calculate compression ratio
    let originalSize = 0;
    let compressedSize = 0;

    for (const entry of this.cache.values()) {
      if (entry.compressed && entry.compressedData) {
        compressedSize += entry.compressedData.length;
        try {
          const decompressed = decompress(entry.compressedData);
          originalSize += decompressed.length;
        } catch (error) {
          // Skip if decompression fails
        }
      }
    }

    if (compressedSize > 0 && originalSize > 0) {
      this.stats.compressionRatio = originalSize / compressedSize;
    }

    // Get actual storage usage from IndexedDB if available
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage && estimate.quota) {
          const usageInMB = estimate.usage / (1024 * 1024);
          const quotaInMB = estimate.quota / (1024 * 1024);
          this.log('debug', `Storage usage: ${usageInMB.toFixed(2)}MB / ${quotaInMB.toFixed(2)}MB`);

          // Update stats with actual storage info
          this.stats.storageUsage = usageInMB;
          this.stats.storageQuota = quotaInMB;
          this.stats.storagePercentage = (estimate.usage / estimate.quota) * 100;
        }
      } catch (error) {
        this.log('error', `Error getting storage estimate: ${error}`);
      }
    }
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MonadDb', 1);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains('monadDb')) {
          db.createObjectStore('monadDb', { keyPath: 'key' });
          this.log('info', 'Created MonadDb object store');
        }
      };

      request.onsuccess = () => {
        this.log('info', 'Successfully opened IndexedDB database');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Open the IndexedDB database
   */
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MonadDb', 1);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Load existing data from IndexedDB
   */
  private async loadExistingData(): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction('monadDb', 'readonly');
        const store = transaction.objectStore('monadDb');
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result as MonadDbEntry<any>[];

          // Add entries to cache
          for (const entry of entries) {
            this.cache.set(entry.key, entry);
          }

          this.log('info', `Loaded ${entries.length} entries from IndexedDB`);
          this.stats.totalEntries = entries.length;

          // Update merkle roots for all namespaces
          const namespaces = new Set<string>();
          for (const entry of entries) {
            const namespace = entry.key.split(':')[0];
            namespaces.add(namespace);
          }

          // Update merkle roots
          for (const namespace of namespaces) {
            this.updateNamespaceMerkleRoot(namespace);
          }

          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      this.log('error', `Error loading existing data: ${error}`);
    }
  }

  /**
   * Get all entries in a namespace
   */
  public async getAllInNamespace<T>(namespace: string): Promise<T[]> {
    this.ensureInitialized();

    const results: T[] = [];

    // Collect all entries in the namespace
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${namespace}:`)) {
        const value = this.extractValue<T>(entry);
        if (value) {
          results.push(value);
        }
      }
    }

    return results;
  }

  /**
   * Get the number of entries in the database
   */
  public getEntryCount(): number {
    return this.cache.size;
  }

  /**
   * Get the size of the database in MB
   */
  public getSize(): number {
    return this.storageEstimate;
  }

  /**
   * Verify the integrity of all data in a namespace
   */
  public async verifyNamespaceIntegrity(namespace: string): Promise<boolean> {
    const root = this.merkleRoots.get(namespace);
    if (!root) {
      return false;
    }

    // Collect all entries in the namespace
    const entries: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${namespace}:`)) {
        entries.push(JSON.stringify({
          key: entry.key,
          value: entry.merkleRoot
        }));
      }
    }

    // Create a merkle tree from the entries
    const tree = new MerkleTree(entries);
    const calculatedRoot = tree.getRoot();

    // Compare with stored root
    return calculatedRoot === root;
  }

  /**
   * Record a transaction in the database
   */
  public async recordTransaction(txHash: string, data: any): Promise<void> {
    this.ensureInitialized();

    // Store transaction data
    await this.put(txHash, {
      ...data,
      timestamp: Date.now()
    }, 'transactions');

    // Update stats
    this.stats.transactionCount++;
    this.stats.lastSyncTime = Date.now();
  }

  /**
   * Ensure the database is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('MonadDb not initialized. Call initialize() first.');
    }
  }

  /**
   * Log a message with the specified level
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    if (levels[level] >= levels[this.config.logLevel]) {
      const timestamp = new Date().toISOString();
      console[level](`[MonadDb ${timestamp}] ${message}`);
    }
  }
}

// Export singleton instance
export const monadDb = MonadDbService.getInstance();
