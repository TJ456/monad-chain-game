import { toast } from 'sonner';
import { GameRoom, GameMode, Card as GameCardType } from '@/types/game';

// Define the types of messages that can be sent/received
export enum WebSocketMessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  GAME_STATE_UPDATE = 'game_state_update',
  PLAYER_MOVE = 'player_move',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  TRANSACTION_UPDATE = 'transaction_update',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  // Chat message types
  CHAT_MESSAGE = 'chat_message',
  CHAT_JOIN = 'chat_join',
  CHAT_LEAVE = 'chat_leave'
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
  sender?: string;
  roomCode?: string;
}

export interface GameStateUpdate {
  roomCode: string;
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  playerDeck: GameCardType[];
  opponentDeckSize: number;
  currentTurn: 'player' | 'opponent';
  lastMove?: {
    player: 'player' | 'opponent';
    cardId: string;
    effect: string;
  };
  transactionHash?: string;
  transactionStatus?: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: number;
  version: number; // For conflict resolution
}

export interface TransactionUpdate {
  roomCode: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: number;
}

/**
 * Enhanced WebSocketService with:
 * - Improved reconnection logic with exponential backoff
 * - Connection quality monitoring
 * - Session resumption
 * - State recovery mechanism
 * - Better error handling
 */
class WebSocketService {
  private static instance: WebSocketService;

  // Connection state
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20; // Increased for better persistence
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private pingIntervalTime = 10000; // 10 seconds
  private pingTimeoutTime = 5000; // 5 seconds

  // Session data
  private sessionId: string | null = null;
  private roomCode: string | null = null;
  private userId: string | null = null;
  private lastReceivedStateVersion = 0;
  private isSyncing = false;
  private connectionStartTime = 0;
  private disconnectionTime = 0;

  // Connection quality metrics
  private latencyHistory: number[] = [];
  private maxLatencyHistoryLength = 10;
  private packetLossCount = 0;
  private totalPackets = 0;
  private connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'bad' = 'good';

  // Message queue for offline mode
  private messageQueue: WebSocketMessage[] = [];
  private maxQueueSize = 50;

  // Listeners
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private connectionStatusListeners: ((connected: boolean) => void)[] = [];
  private syncStatusListeners: ((syncing: boolean) => void)[] = [];
  private connectionQualityListeners: ((quality: {
    quality: string,
    latency: number,
    packetLoss: number
  }) => void)[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to the WebSocket server with improved connection handling and session resumption
   * @param userId The user ID to connect with
   */
  public connect(userId: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.connectionStartTime = Date.now();

    // Build the WebSocket URL with session resumption if available
    let wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8081';

    // Convert http/https URLs to ws/wss
    if (wsUrl.startsWith('http://')) {
      wsUrl = wsUrl.replace('http://', 'ws://');
    } else if (wsUrl.startsWith('https://')) {
      wsUrl = wsUrl.replace('https://', 'wss://');
    }

    // Ensure path ends with /ws
    if (!wsUrl.endsWith('/ws')) {
      wsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws` : `${wsUrl}/ws`;
    }

    console.log(`Using WebSocket URL: ${wsUrl}`);

    // Add session ID for resumption if we have one
    if (this.sessionId) {
      wsUrl += `?sessionId=${this.sessionId}`;
    }

    try {
      console.log(`Connecting to WebSocket server: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          this.socket.close();
          this.attemptReconnect();
        }
      }, 10000); // 10 second connection timeout

      this.socket.onopen = () => {
        // Clear connection timeout
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.connectionStartTime = Date.now();
        this.notifyConnectionStatusListeners(true);

        // Send connect message with user ID and session info
        this.sendMessage({
          type: WebSocketMessageType.CONNECT,
          payload: {
            userId,
            sessionId: this.sessionId,
            lastStateVersion: this.lastReceivedStateVersion,
            roomCode: this.roomCode,
            reconnecting: this.disconnectionTime > 0,
            disconnectedAt: this.disconnectionTime
          },
          timestamp: Date.now()
        });

        // Reset disconnection time
        this.disconnectionTime = 0;

        // Start ping interval to keep connection alive and monitor latency
        this.startPingInterval();

        // If we have queued messages, try to send them now
        this.processMessageQueue();

        // If we were in a room, automatically rejoin
        if (this.roomCode) {
          console.log(`Automatically rejoining room: ${this.roomCode}`);
          this.joinRoom(this.roomCode);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Reset ping timeout if we got any message
          this.resetPingTimeout();

          // Calculate latency if this is a pong response
          if (message.type === WebSocketMessageType.PONG && this.lastPingTime > 0) {
            const latency = Date.now() - this.lastPingTime;
            this.updateLatency(latency);
          }

          // Handle the message
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.packetLossCount++;
        }
      };

      this.socket.onclose = (event) => {
        // Record disconnection time for session resumption
        this.disconnectionTime = Date.now();

        // Calculate connection duration
        const connectionDuration = this.disconnectionTime - this.connectionStartTime;
        console.log(`WebSocket connection closed after ${connectionDuration}ms:`,
                    `Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);

        // Clean up ping interval and timeout
        this.cleanupPingTimers();

        // Notify listeners
        this.notifyConnectionStatusListeners(false);

        // Attempt to reconnect with exponential backoff
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Update connection quality
        this.updateConnectionQuality('poor');
        // The onclose handler will be called after this
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.disconnectionTime = Date.now();
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server and clean up resources
   */
  public disconnect(): void {
    if (this.socket) {
      // Send disconnect message
      this.sendMessage({
        type: WebSocketMessageType.DISCONNECT,
        payload: {
          userId: this.userId,
          sessionId: this.sessionId
        },
        timestamp: Date.now()
      });

      // Close the socket
      this.socket.close();
      this.socket = null;

      // Notify listeners
      this.notifyConnectionStatusListeners(false);

      // Clean up timers
      this.cleanupPingTimers();

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Record disconnection time
      this.disconnectionTime = Date.now();

      console.log('WebSocket disconnected');
    }
  }

  /**
   * Clean up all resources
   */
  public cleanup(): void {
    // Disconnect the socket
    this.disconnect();

    // Clear all listeners
    this.messageListeners = [];
    this.connectionStatusListeners = [];
    this.syncStatusListeners = [];
    this.connectionQualityListeners = [];

    // Clear message queue
    this.messageQueue = [];

    // Reset metrics
    this.latencyHistory = [];
    this.packetLossCount = 0;
    this.totalPackets = 0;

    console.log('WebSocketService cleaned up');
  }

  public joinRoom(roomCode: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      toast.error('Not connected to server', {
        description: 'Attempting to reconnect...'
      });
      this.connect(this.userId || 'anonymous');
      return;
    }

    this.roomCode = roomCode;

    this.sendMessage({
      type: WebSocketMessageType.JOIN_ROOM,
      payload: { roomCode },
      timestamp: Date.now(),
      roomCode
    });

    // Request initial sync
    this.requestSync();
  }

  public leaveRoom(): void {
    if (this.roomCode && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: WebSocketMessageType.LEAVE_ROOM,
        payload: { roomCode: this.roomCode },
        timestamp: Date.now(),
        roomCode: this.roomCode
      });
    }

    this.roomCode = null;
  }

  public sendGameStateUpdate(update: GameStateUpdate): void {
    if (!this.roomCode) {
      console.error('Cannot send game state update: not in a room');
      return;
    }

    // Increment the version number for conflict resolution
    update.version = this.lastReceivedStateVersion + 1;

    this.sendMessage({
      type: WebSocketMessageType.GAME_STATE_UPDATE,
      payload: update,
      timestamp: Date.now(),
      roomCode: this.roomCode
    });
  }

  public sendPlayerMove(cardId: string, moveType: 'attack' | 'defense' | 'special'): void {
    if (!this.roomCode) {
      console.error('Cannot send player move: not in a room');
      return;
    }

    this.sendMessage({
      type: WebSocketMessageType.PLAYER_MOVE,
      payload: {
        cardId,
        moveType,
        roomCode: this.roomCode
      },
      timestamp: Date.now(),
      roomCode: this.roomCode
    });
  }

  /**
   * Send a chat message to the current room
   * @param content The message content
   * @param sender The sender's username
   */
  public sendChatMessage(content: string, sender: string): void {
    if (!this.roomCode) {
      console.error('Cannot send chat message: not in a room');
      return;
    }

    this.sendMessage({
      type: WebSocketMessageType.CHAT_MESSAGE,
      payload: {
        content,
        sender,
        roomCode: this.roomCode
      },
      timestamp: Date.now(),
      roomCode: this.roomCode
    });
  }

  /**
   * Notify that a user has joined the chat
   * @param username The username of the user who joined
   */
  public sendChatJoin(username: string): void {
    if (!this.roomCode) {
      console.error('Cannot send chat join notification: not in a room');
      return;
    }

    this.sendMessage({
      type: WebSocketMessageType.CHAT_JOIN,
      payload: {
        username,
        roomCode: this.roomCode
      },
      timestamp: Date.now(),
      roomCode: this.roomCode
    });
  }

  /**
   * Notify that a user has left the chat
   * @param username The username of the user who left
   */
  public sendChatLeave(username: string): void {
    if (!this.roomCode) {
      console.error('Cannot send chat leave notification: not in a room');
      return;
    }

    this.sendMessage({
      type: WebSocketMessageType.CHAT_LEAVE,
      payload: {
        username,
        roomCode: this.roomCode
      },
      timestamp: Date.now(),
      roomCode: this.roomCode
    });
  }

  public requestSync(): void {
    if (!this.roomCode) {
      console.error('Cannot request sync: not in a room');
      return;
    }

    this.setSyncStatus(true);

    this.sendMessage({
      type: WebSocketMessageType.SYNC_REQUEST,
      payload: {
        roomCode: this.roomCode,
        lastVersion: this.lastReceivedStateVersion
      },
      timestamp: Date.now(),
      roomCode: this.roomCode
    });

    // Set a timeout to clear syncing status if no response
    setTimeout(() => {
      if (this.isSyncing) {
        this.setSyncStatus(false);
        toast.error('Sync timed out', {
          description: 'Could not synchronize game state'
        });
      }
    }, 5000);
  }

  public addMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners.push(listener);
  }

  /**
   * Check if the WebSocket is currently connected
   * @returns true if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  public addConnectionStatusListener(listener: (connected: boolean) => void): void {
    this.connectionStatusListeners.push(listener);
    // Immediately notify with current status
    if (this.socket) {
      listener(this.socket.readyState === WebSocket.OPEN);
    } else {
      listener(false);
    }
  }

  public removeConnectionStatusListener(listener: (connected: boolean) => void): void {
    this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
  }

  public addSyncStatusListener(listener: (syncing: boolean) => void): void {
    this.syncStatusListeners.push(listener);
    // Immediately notify with current status
    listener(this.isSyncing);
  }

  public removeSyncStatusListener(listener: (syncing: boolean) => void): void {
    this.syncStatusListeners = this.syncStatusListeners.filter(l => l !== listener);
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the server, with offline queueing support
   */
  private sendMessage(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');

      // Queue important messages for later sending
      this.queueMessage(message);

      // Try to reconnect if not already attempting
      if (!this.reconnectTimeout) {
        this.attemptReconnect();
      }

      return;
    }

    try {
      // Add session ID if available
      if (this.sessionId && !message.payload.sessionId) {
        message.payload.sessionId = this.sessionId;
      }

      // Send the message
      this.socket.send(JSON.stringify(message));

      // For non-ping messages, increment total packets for packet loss calculation
      if (message.type !== WebSocketMessageType.PING &&
          message.type !== WebSocketMessageType.PONG) {
        this.totalPackets++;
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);

      // Queue the message for later retry
      this.queueMessage(message);

      // Update connection quality
      this.updateConnectionQuality('poor');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    // Process message based on type
    switch (message.type) {
      case WebSocketMessageType.CONNECT:
        // Handle connection response with session ID
        if (message.payload.sessionId) {
          this.sessionId = message.payload.sessionId;
          console.log(`Received session ID: ${this.sessionId}`);

          // If this was a reconnection and we have a room code, rejoin the room
          if (message.payload.reconnected && this.roomCode) {
            console.log(`Server acknowledged reconnection, rejoining room ${this.roomCode}`);
            this.joinRoom(this.roomCode);
          }
        }
        break;

      case WebSocketMessageType.GAME_STATE_UPDATE:
        this.handleGameStateUpdate(message.payload);
        break;

      case WebSocketMessageType.SYNC_RESPONSE:
        this.handleSyncResponse(message.payload);
        break;

      case WebSocketMessageType.TRANSACTION_UPDATE:
        this.handleTransactionUpdate(message.payload);
        break;

      case WebSocketMessageType.ERROR:
        console.error('WebSocket error message:', message.payload);
        toast.error('Game server error', {
          description: message.payload.message || 'Unknown error'
        });
        break;

      case WebSocketMessageType.PING:
        // Respond with pong
        this.sendMessage({
          type: WebSocketMessageType.PONG,
          payload: { timestamp: message.payload.timestamp },
          timestamp: Date.now()
        });
        break;

      case WebSocketMessageType.PONG:
        // Handle pong (latency calculation is done in onmessage)
        break;

      case WebSocketMessageType.CHAT_MESSAGE:
        // Chat messages are handled by the listeners
        console.log(`Received chat message from ${message.payload.sender}: ${message.payload.content}`);
        break;

      case WebSocketMessageType.CHAT_JOIN:
        // User joined chat notification
        console.log(`User joined chat: ${message.payload.username}`);
        break;

      case WebSocketMessageType.CHAT_LEAVE:
        // User left chat notification
        console.log(`User left chat: ${message.payload.username}`);
        break;
    }

    // Notify all listeners
    this.notifyMessageListeners(message);
  }

  private handleGameStateUpdate(update: GameStateUpdate): void {
    // Handle version conflicts
    if (update.version <= this.lastReceivedStateVersion) {
      console.warn('Received outdated game state update, ignoring');
      return;
    }

    // Update the last received version
    this.lastReceivedStateVersion = update.version;

    // Clear syncing status if this was a sync response
    if (this.isSyncing) {
      this.setSyncStatus(false);
    }
  }

  private handleSyncResponse(response: { gameState: GameStateUpdate }): void {
    // Update game state from sync response
    this.handleGameStateUpdate(response.gameState);

    // Clear syncing status
    this.setSyncStatus(false);
  }

  private handleTransactionUpdate(update: TransactionUpdate): void {
    // Just pass to listeners, they will handle UI updates
    // No special handling needed here
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Check if we've reached the maximum number of attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');

      // Notify the user
      toast.error('Connection lost', {
        description: 'Could not reconnect to game server. Please refresh the page.'
      });

      // Reset reconnect attempts after a long delay to allow future reconnection
      setTimeout(() => {
        this.reconnectAttempts = 0;
        console.log('Reconnect attempts reset, will try again if needed');
      }, 60000); // 1 minute

      return;
    }

    // Calculate delay with exponential backoff and jitter
    const baseDelay = 1000 * Math.pow(1.3, this.reconnectAttempts);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = Math.min(baseDelay + jitter, 15000); // Cap at 15 seconds - reduced for faster reconnection

    console.log(`Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    // Show toast for reconnect attempts
    if (this.reconnectAttempts === 0) {
      toast.warning('Connection lost', {
        description: `Attempting to reconnect...`
      });
    } else if (this.reconnectAttempts % 5 === 0) { // Show every 5 attempts
      toast.warning('Still trying to reconnect', {
        description: `Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}. Please check your connection.`
      });
    }

    // Set timeout for reconnection
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;

      // Try to connect
      this.connect(this.userId || 'anonymous');

      // Clear the timeout reference
      this.reconnectTimeout = null;
    }, delay);
  }

  /**
   * Start the ping interval for connection monitoring
   * This sends regular pings to measure latency and detect disconnections
   */
  private startPingInterval(): void {
    // Clean up any existing ping interval
    this.cleanupPingTimers();

    // Send ping regularly to keep connection alive and measure latency
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Record the time we sent the ping
        this.lastPingTime = Date.now();

        // Send the ping message
        this.sendMessage({
          type: WebSocketMessageType.PING,
          payload: { timestamp: this.lastPingTime },
          timestamp: this.lastPingTime
        });

        // Increment total packets for packet loss calculation
        this.totalPackets++;

        // Set a timeout to detect missed pongs
        this.pingTimeout = setTimeout(() => {
          // If this timeout fires, we didn't get a pong back
          this.packetLossCount++;
          console.warn('Ping timeout - no pong received');

          // Update connection quality
          this.updateConnectionQuality('poor');

          // If we've missed too many pings, consider the connection dead
          if (this.packetLossCount > 3) {
            console.error('Too many missed pings, connection may be dead');

            // Force close and reconnect if socket is still open
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              this.socket.close();
              this.attemptReconnect();
            }
          }
        }, this.pingTimeoutTime);
      }
    }, this.pingIntervalTime);
  }

  /**
   * Reset the ping timeout when any message is received
   */
  private resetPingTimeout(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Clean up ping interval and timeout
   */
  private cleanupPingTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Update latency history and recalculate connection quality
   */
  private updateLatency(latency: number): void {
    // Add to latency history
    this.latencyHistory.push(latency);

    // Keep history at max length
    if (this.latencyHistory.length > this.maxLatencyHistoryLength) {
      this.latencyHistory.shift();
    }

    // Calculate average latency
    const avgLatency = this.latencyHistory.reduce((sum, val) => sum + val, 0) / this.latencyHistory.length;

    // Calculate packet loss percentage
    const packetLossPercentage = this.totalPackets > 0 ?
      (this.packetLossCount / this.totalPackets) * 100 : 0;

    // Determine connection quality based on latency and packet loss
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';

    if (avgLatency < 50 && packetLossPercentage < 1) {
      quality = 'excellent';
    } else if (avgLatency < 100 && packetLossPercentage < 2) {
      quality = 'good';
    } else if (avgLatency < 200 && packetLossPercentage < 5) {
      quality = 'fair';
    } else if (avgLatency < 500 && packetLossPercentage < 10) {
      quality = 'poor';
    } else {
      quality = 'bad';
    }

    // Update connection quality if changed
    if (quality !== this.connectionQuality) {
      this.updateConnectionQuality(quality);
    }

    // Log connection quality metrics periodically
    if (this.latencyHistory.length === this.maxLatencyHistoryLength) {
      console.log(`Connection quality: ${quality}, Avg latency: ${avgLatency.toFixed(0)}ms, Packet loss: ${packetLossPercentage.toFixed(1)}%`);
    }
  }

  /**
   * Update connection quality and notify listeners
   */
  private updateConnectionQuality(quality: 'excellent' | 'good' | 'fair' | 'poor' | 'bad'): void {
    // Only update if quality changed to avoid excessive notifications
    const previousQuality = this.connectionQuality;
    this.connectionQuality = quality;

    // Calculate average latency
    const avgLatency = this.latencyHistory.length > 0 ?
      this.latencyHistory.reduce((sum, val) => sum + val, 0) / this.latencyHistory.length : 0;

    // Calculate packet loss percentage
    const packetLossPercentage = this.totalPackets > 0 ?
      (this.packetLossCount / this.totalPackets) * 100 : 0;

    // Notify listeners
    this.notifyConnectionQualityListeners({
      quality,
      latency: avgLatency,
      packetLoss: packetLossPercentage
    });

    // Only show toast if quality changed significantly
    if (quality !== previousQuality) {
      if (quality === 'poor' || quality === 'bad') {
        toast.warning('Connection quality degraded', {
          description: `Network latency: ${avgLatency.toFixed(0)}ms, Packet loss: ${packetLossPercentage.toFixed(1)}%`
        });
      } else if ((previousQuality === 'poor' || previousQuality === 'bad') &&
                (quality === 'good' || quality === 'excellent')) {
        toast.success('Connection quality improved', {
          description: `Network latency: ${avgLatency.toFixed(0)}ms`
        });
      }
    }
  }

  /**
   * Process the message queue when connection is restored
   */
  private processMessageQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.messageQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.messageQueue.length} queued messages`);

    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          // Update timestamp before sending
          message.timestamp = Date.now();
          this.sendMessage(message);
        } catch (error) {
          console.error('Error sending queued message:', error);
        }
      }
    }
  }

  /**
   * Queue a message for sending when connection is restored
   */
  private queueMessage(message: WebSocketMessage): void {
    // Only queue important messages
    const importantTypes = [
      WebSocketMessageType.GAME_STATE_UPDATE,
      WebSocketMessageType.PLAYER_MOVE,
      WebSocketMessageType.JOIN_ROOM,
      WebSocketMessageType.LEAVE_ROOM
    ];

    if (importantTypes.includes(message.type)) {
      // Add to queue, respecting max size
      if (this.messageQueue.length >= this.maxQueueSize) {
        // Remove oldest message
        this.messageQueue.shift();
      }

      this.messageQueue.push(message);
      console.log(`Queued message of type ${message.type} for later sending`);
    }
  }

  /**
   * Add a connection quality listener
   */
  public addConnectionQualityListener(listener: (quality: {
    quality: string,
    latency: number,
    packetLoss: number
  }) => void): void {
    this.connectionQualityListeners.push(listener);

    // Immediately notify with current quality
    const avgLatency = this.latencyHistory.length > 0 ?
      this.latencyHistory.reduce((sum, val) => sum + val, 0) / this.latencyHistory.length : 0;

    const packetLossPercentage = this.totalPackets > 0 ?
      (this.packetLossCount / this.totalPackets) * 100 : 0;

    listener({
      quality: this.connectionQuality,
      latency: avgLatency,
      packetLoss: packetLossPercentage
    });
  }

  /**
   * Remove a connection quality listener
   */
  public removeConnectionQualityListener(listener: (quality: {
    quality: string,
    latency: number,
    packetLoss: number
  }) => void): void {
    this.connectionQualityListeners = this.connectionQualityListeners.filter(l => l !== listener);
  }

  /**
   * Notify connection quality listeners
   */
  private notifyConnectionQualityListeners(quality: {
    quality: string,
    latency: number,
    packetLoss: number
  }): void {
    this.connectionQualityListeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        console.error('Error in connection quality listener:', error);
      }
    });
  }

  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  private notifyConnectionStatusListeners(connected: boolean): void {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  private setSyncStatus(syncing: boolean): void {
    if (this.isSyncing !== syncing) {
      this.isSyncing = syncing;
      this.notifySyncStatusListeners(syncing);
    }
  }

  private notifySyncStatusListeners(syncing: boolean): void {
    this.syncStatusListeners.forEach(listener => {
      try {
        listener(syncing);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }
}

export default WebSocketService;
