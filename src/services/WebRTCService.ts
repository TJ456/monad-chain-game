import { toast } from 'sonner';
import { GameState } from './GameSyncService';
import { compress, decompress } from '../utils/compression';

/**
 * Types of WebRTC messages
 */
export enum WebRTCMessageType {
  GAME_STATE = 'game_state',
  MOVE = 'move',
  PING = 'ping',
  PONG = 'pong',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  CONNECTION_QUALITY = 'connection_quality'
}

/**
 * Interface for WebRTC messages
 */
export interface WebRTCMessage {
  type: WebRTCMessageType;
  payload: any;
  timestamp: number;
  sender: string;
  compressed?: boolean;
}

/**
 * Connection quality levels
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  BAD = 'bad'
}

/**
 * Connection quality metrics
 */
export interface ConnectionQualityMetrics {
  quality: ConnectionQuality;
  latency: number; // in ms
  packetLoss: number; // percentage
  jitter: number; // in ms
  timestamp: number;
}

/**
 * Service for WebRTC P2P connections
 */
export class WebRTCService {
  private static instance: WebRTCService;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localId: string = '';
  private remoteId: string = '';
  private isInitiator: boolean = false;
  private messageListeners: ((message: WebRTCMessage) => void)[] = [];
  private connectionStateListeners: ((connected: boolean) => void)[] = [];
  private qualityMetricsListeners: ((metrics: ConnectionQualityMetrics) => void)[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimes: Map<number, number> = new Map();
  private latencyHistory: number[] = [];
  private packetLossCount = 0;
  private totalPackets = 0;
  private connectionQuality: ConnectionQuality = ConnectionQuality.GOOD;
  private compressionEnabled = true;
  private signalServer: string = import.meta.env.VITE_SIGNAL_SERVER || 'wss://signal.monad-game.example.com';
  private signalConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  /**
   * Initialize the WebRTC service
   * @param localId Local peer ID
   */
  public initialize(localId: string): void {
    this.localId = localId;
    this.connectToSignalServer();
  }

  /**
   * Connect to the signaling server
   */
  private connectToSignalServer(): void {
    try {
      this.signalConnection = new WebSocket(this.signalServer);
      
      this.signalConnection.onopen = () => {
        console.log('Connected to signaling server');
        this.reconnectAttempts = 0;
        
        // Register with the signaling server
        if (this.signalConnection) {
          this.signalConnection.send(JSON.stringify({
            type: 'register',
            peerId: this.localId
          }));
        }
      };
      
      this.signalConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleSignalingMessage(message);
        } catch (error) {
          console.error('Error parsing signaling message:', error);
        }
      };
      
      this.signalConnection.onclose = () => {
        console.log('Disconnected from signaling server');
        this.attemptReconnect();
      };
      
      this.signalConnection.onerror = (error) => {
        console.error('Signaling server error:', error);
        // The onclose handler will be called after this
      };
    } catch (error) {
      console.error('Error connecting to signaling server:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to the signaling server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectToSignalServer();
    }, delay);
  }

  /**
   * Handle messages from the signaling server
   */
  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'offer':
        this.handleOffer(message);
        break;
        
      case 'answer':
        this.handleAnswer(message);
        break;
        
      case 'candidate':
        this.handleCandidate(message);
        break;
        
      case 'peer_connected':
        console.log(`Peer ${message.peerId} connected to signaling server`);
        break;
        
      case 'peer_disconnected':
        console.log(`Peer ${message.peerId} disconnected from signaling server`);
        if (message.peerId === this.remoteId) {
          this.cleanupPeerConnection();
          this.notifyConnectionStateListeners(false);
        }
        break;
    }
  }

  /**
   * Create an offer to connect to a remote peer
   * @param remoteId Remote peer ID
   */
  public createOffer(remoteId: string): void {
    this.remoteId = remoteId;
    this.isInitiator = true;
    
    this.createPeerConnection();
    
    // Create a data channel
    this.dataChannel = this.peerConnection!.createDataChannel('gameData', {
      ordered: true
    });
    
    this.setupDataChannel();
    
    // Create and send an offer
    this.peerConnection!.createOffer()
      .then(offer => this.peerConnection!.setLocalDescription(offer))
      .then(() => {
        // Send the offer to the remote peer via the signaling server
        if (this.signalConnection && this.peerConnection?.localDescription) {
          this.signalConnection.send(JSON.stringify({
            type: 'offer',
            offer: this.peerConnection.localDescription,
            source: this.localId,
            destination: this.remoteId
          }));
        }
      })
      .catch(error => {
        console.error('Error creating offer:', error);
        toast.error('Failed to create connection offer');
      });
  }

  /**
   * Handle an offer from a remote peer
   */
  private handleOffer(message: any): void {
    if (message.destination !== this.localId) return;
    
    this.remoteId = message.source;
    this.isInitiator = false;
    
    this.createPeerConnection();
    
    // Set up data channel event handler (the remote peer will create the channel)
    this.peerConnection!.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
    
    // Set the remote description (the offer)
    this.peerConnection!.setRemoteDescription(new RTCSessionDescription(message.offer))
      .then(() => this.peerConnection!.createAnswer())
      .then(answer => this.peerConnection!.setLocalDescription(answer))
      .then(() => {
        // Send the answer to the remote peer via the signaling server
        if (this.signalConnection && this.peerConnection?.localDescription) {
          this.signalConnection.send(JSON.stringify({
            type: 'answer',
            answer: this.peerConnection.localDescription,
            source: this.localId,
            destination: this.remoteId
          }));
        }
      })
      .catch(error => {
        console.error('Error handling offer:', error);
        toast.error('Failed to handle connection offer');
      });
  }

  /**
   * Handle an answer from a remote peer
   */
  private handleAnswer(message: any): void {
    if (message.destination !== this.localId) return;
    
    // Set the remote description (the answer)
    this.peerConnection!.setRemoteDescription(new RTCSessionDescription(message.answer))
      .catch(error => {
        console.error('Error handling answer:', error);
        toast.error('Failed to establish connection');
      });
  }

  /**
   * Handle an ICE candidate from a remote peer
   */
  private handleCandidate(message: any): void {
    if (message.destination !== this.localId) return;
    
    const candidate = new RTCIceCandidate(message.candidate);
    
    this.peerConnection!.addIceCandidate(candidate)
      .catch(error => {
        console.error('Error adding ICE candidate:', error);
      });
  }

  /**
   * Create a new peer connection
   */
  private createPeerConnection(): void {
    // Clean up any existing connection
    this.cleanupPeerConnection();
    
    // Create a new connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    
    // Set up ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the candidate to the remote peer via the signaling server
        if (this.signalConnection) {
          this.signalConnection.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            source: this.localId,
            destination: this.remoteId
          }));
        }
      }
    };
    
    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      switch (this.peerConnection?.connectionState) {
        case 'connected':
          this.notifyConnectionStateListeners(true);
          this.startPingInterval();
          toast.success('P2P connection established', {
            description: 'Using direct connection for faster gameplay'
          });
          break;
          
        case 'disconnected':
        case 'failed':
        case 'closed':
          this.notifyConnectionStateListeners(false);
          this.stopPingInterval();
          toast.error('P2P connection lost', {
            description: 'Falling back to server connection'
          });
          break;
      }
    };
    
    // Monitor ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
    };
  }

  /**
   * Set up the data channel event handlers
   */
  private setupDataChannel(): void {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
    
    this.dataChannel.onmessage = (event) => {
      try {
        const message: WebRTCMessage = JSON.parse(event.data);
        this.handleDataChannelMessage(message);
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };
  }

  /**
   * Handle messages received through the data channel
   */
  private handleDataChannelMessage(message: WebRTCMessage): void {
    // Handle special message types
    switch (message.type) {
      case WebRTCMessageType.PING:
        // Respond with a pong
        this.sendMessage({
          type: WebRTCMessageType.PONG,
          payload: message.payload, // Echo the timestamp
          timestamp: Date.now(),
          sender: this.localId
        });
        break;
        
      case WebRTCMessageType.PONG:
        // Calculate latency
        const pingTime = message.payload;
        const latency = Date.now() - pingTime;
        this.pingTimes.delete(pingTime);
        
        // Update latency history
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > 10) {
          this.latencyHistory.shift();
        }
        
        // Update connection quality
        this.updateConnectionQuality();
        break;
        
      case WebRTCMessageType.CONNECTION_QUALITY:
        // Remote peer is reporting their connection quality
        console.log('Remote connection quality:', message.payload);
        break;
    }
    
    // Decompress payload if needed
    if (message.compressed && typeof message.payload === 'string') {
      try {
        message.payload = JSON.parse(decompress(message.payload));
        message.compressed = false;
      } catch (error) {
        console.error('Error decompressing message payload:', error);
      }
    }
    
    // Notify all listeners
    this.notifyMessageListeners(message);
  }

  /**
   * Send a message to the remote peer
   */
  public sendMessage(message: WebRTCMessage): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Cannot send message: data channel not open');
      return false;
    }
    
    try {
      // Compress payload if it's large and compression is enabled
      if (this.compressionEnabled && 
          message.type !== WebRTCMessageType.PING && 
          message.type !== WebRTCMessageType.PONG) {
        const payload = JSON.stringify(message.payload);
        if (payload.length > 1000) { // Only compress payloads larger than 1KB
          message.payload = compress(payload);
          message.compressed = true;
        }
      }
      
      this.dataChannel.send(JSON.stringify(message));
      this.totalPackets++;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.packetLossCount++;
      this.totalPackets++;
      return false;
    }
  }

  /**
   * Send a game state update to the remote peer
   */
  public sendGameState(state: GameState): boolean {
    return this.sendMessage({
      type: WebRTCMessageType.GAME_STATE,
      payload: state,
      timestamp: Date.now(),
      sender: this.localId
    });
  }

  /**
   * Send a move to the remote peer
   */
  public sendMove(moveData: any): boolean {
    return this.sendMessage({
      type: WebRTCMessageType.MOVE,
      payload: moveData,
      timestamp: Date.now(),
      sender: this.localId
    });
  }

  /**
   * Request a state sync from the remote peer
   */
  public requestSync(): boolean {
    return this.sendMessage({
      type: WebRTCMessageType.SYNC_REQUEST,
      payload: {
        lastStateVersion: 0 // The remote peer will fill this in
      },
      timestamp: Date.now(),
      sender: this.localId
    });
  }

  /**
   * Start sending periodic pings to measure latency
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    // Send a ping every 2 seconds
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        const timestamp = Date.now();
        this.pingTimes.set(timestamp, timestamp);
        
        this.sendMessage({
          type: WebRTCMessageType.PING,
          payload: timestamp,
          timestamp,
          sender: this.localId
        });
        
        // Check for lost pings (no response within 5 seconds)
        for (const [time, _] of this.pingTimes) {
          if (timestamp - time > 5000) {
            this.pingTimes.delete(time);
            this.packetLossCount++;
            this.totalPackets++;
          }
        }
        
        // Update connection quality
        this.updateConnectionQuality();
      }
    }, 2000);
  }

  /**
   * Stop sending pings
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Update the connection quality metrics
   */
  private updateConnectionQuality(): void {
    // Calculate average latency
    const avgLatency = this.latencyHistory.length > 0
      ? this.latencyHistory.reduce((sum, val) => sum + val, 0) / this.latencyHistory.length
      : 0;
    
    // Calculate packet loss percentage
    const packetLossPercentage = this.totalPackets > 0
      ? (this.packetLossCount / this.totalPackets) * 100
      : 0;
    
    // Calculate jitter (variation in latency)
    let jitter = 0;
    if (this.latencyHistory.length > 1) {
      let sum = 0;
      for (let i = 1; i < this.latencyHistory.length; i++) {
        sum += Math.abs(this.latencyHistory[i] - this.latencyHistory[i - 1]);
      }
      jitter = sum / (this.latencyHistory.length - 1);
    }
    
    // Determine connection quality
    let quality: ConnectionQuality;
    if (avgLatency < 50 && packetLossPercentage < 1 && jitter < 10) {
      quality = ConnectionQuality.EXCELLENT;
    } else if (avgLatency < 100 && packetLossPercentage < 2 && jitter < 20) {
      quality = ConnectionQuality.GOOD;
    } else if (avgLatency < 200 && packetLossPercentage < 5 && jitter < 50) {
      quality = ConnectionQuality.FAIR;
    } else if (avgLatency < 300 && packetLossPercentage < 10 && jitter < 100) {
      quality = ConnectionQuality.POOR;
    } else {
      quality = ConnectionQuality.BAD;
    }
    
    this.connectionQuality = quality;
    
    // Create metrics object
    const metrics: ConnectionQualityMetrics = {
      quality,
      latency: avgLatency,
      packetLoss: packetLossPercentage,
      jitter,
      timestamp: Date.now()
    };
    
    // Notify listeners
    this.notifyQualityMetricsListeners(metrics);
    
    // Send quality metrics to remote peer
    this.sendMessage({
      type: WebRTCMessageType.CONNECTION_QUALITY,
      payload: metrics,
      timestamp: Date.now(),
      sender: this.localId
    });
  }

  /**
   * Check if connected to a remote peer
   */
  public isConnected(): boolean {
    return (
      this.peerConnection !== null &&
      this.peerConnection.connectionState === 'connected' &&
      this.dataChannel !== null &&
      this.dataChannel.readyState === 'open'
    );
  }

  /**
   * Get the current connection quality
   */
  public getConnectionQuality(): ConnectionQuality {
    return this.connectionQuality;
  }

  /**
   * Add a message listener
   */
  public addMessageListener(listener: (message: WebRTCMessage) => void): void {
    this.messageListeners.push(listener);
  }

  /**
   * Remove a message listener
   */
  public removeMessageListener(listener: (message: WebRTCMessage) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  /**
   * Add a connection state listener
   */
  public addConnectionStateListener(listener: (connected: boolean) => void): void {
    this.connectionStateListeners.push(listener);
    // Immediately notify with current state
    listener(this.isConnected());
  }

  /**
   * Remove a connection state listener
   */
  public removeConnectionStateListener(listener: (connected: boolean) => void): void {
    this.connectionStateListeners = this.connectionStateListeners.filter(l => l !== listener);
  }

  /**
   * Add a quality metrics listener
   */
  public addQualityMetricsListener(listener: (metrics: ConnectionQualityMetrics) => void): void {
    this.qualityMetricsListeners.push(listener);
  }

  /**
   * Remove a quality metrics listener
   */
  public removeQualityMetricsListener(listener: (metrics: ConnectionQualityMetrics) => void): void {
    this.qualityMetricsListeners = this.qualityMetricsListeners.filter(l => l !== listener);
  }

  /**
   * Notify all message listeners
   */
  private notifyMessageListeners(message: WebRTCMessage): void {
    for (const listener of this.messageListeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    }
  }

  /**
   * Notify all connection state listeners
   */
  private notifyConnectionStateListeners(connected: boolean): void {
    for (const listener of this.connectionStateListeners) {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    }
  }

  /**
   * Notify all quality metrics listeners
   */
  private notifyQualityMetricsListeners(metrics: ConnectionQualityMetrics): void {
    for (const listener of this.qualityMetricsListeners) {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in quality metrics listener:', error);
      }
    }
  }

  /**
   * Clean up the peer connection
   */
  private cleanupPeerConnection(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Clean up all resources
   */
  public cleanup(): void {
    this.stopPingInterval();
    this.cleanupPeerConnection();
    
    if (this.signalConnection) {
      this.signalConnection.close();
      this.signalConnection = null;
    }
    
    this.messageListeners = [];
    this.connectionStateListeners = [];
    this.qualityMetricsListeners = [];
  }
}
