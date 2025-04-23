import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

// Define message types to match the client
enum WebSocketMessageType {
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

interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
  sender?: string;
  roomCode?: string;
}

interface Client {
  id: string;
  userId: string;
  sessionId: string;
  socket: WebSocket;
  roomCode: string | null;
  lastActivity: number;
}

interface Room {
  roomCode: string;
  clients: Set<string>; // Client IDs
  gameState: any;
  createdAt: number;
}

class GameWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private rooms: Map<string, Room> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor(port: number) {
    // Create WebSocket server with path /ws
    this.wss = new WebSocketServer({
      port,
      path: '/ws'
    });
    console.log(`WebSocket server started on port ${port} with path /ws`);

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Set up ping interval to keep connections alive
    this.pingInterval = setInterval(this.pingClients.bind(this), 10000); // Reduced to 10 seconds
  }

  private handleConnection(socket: WebSocket): void {
    const clientId = randomUUID();

    // Initialize client with default values
    this.clients.set(clientId, {
      id: clientId,
      userId: 'anonymous',
      sessionId: randomUUID(),
      socket,
      roomCode: null,
      lastActivity: Date.now()
    });

    console.log(`Client connected: ${clientId}`);

    socket.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        this.sendErrorMessage(clientId, 'Invalid message format');
      }
    });

    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });

    socket.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
      this.handleDisconnect(clientId);
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`Message from unknown client: ${clientId}`);
      return;
    }

    // Update last activity time
    client.lastActivity = Date.now();

    console.log(`Received message from ${clientId}:`, message.type);

    switch (message.type) {
      case WebSocketMessageType.CONNECT:
        this.handleConnectMessage(clientId, message);
        break;

      case WebSocketMessageType.DISCONNECT:
        this.handleDisconnectMessage(clientId, message);
        break;

      case WebSocketMessageType.JOIN_ROOM:
        this.handleJoinRoomMessage(clientId, message);
        break;

      case WebSocketMessageType.LEAVE_ROOM:
        this.handleLeaveRoomMessage(clientId, message);
        break;

      case WebSocketMessageType.GAME_STATE_UPDATE:
        this.handleGameStateUpdateMessage(clientId, message);
        break;

      case WebSocketMessageType.PLAYER_MOVE:
        this.handlePlayerMoveMessage(clientId, message);
        break;

      case WebSocketMessageType.SYNC_REQUEST:
        this.handleSyncRequestMessage(clientId, message);
        break;

      case WebSocketMessageType.PING:
        this.handlePingMessage(clientId, message);
        break;

      case WebSocketMessageType.CHAT_MESSAGE:
        this.handleChatMessage(clientId, message);
        break;

      case WebSocketMessageType.CHAT_JOIN:
        this.handleChatJoin(clientId, message);
        break;

      case WebSocketMessageType.CHAT_LEAVE:
        this.handleChatLeave(clientId, message);
        break;

      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  }

  private handleConnectMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update client info
    client.userId = message.payload.userId || 'anonymous';

    // If client is reconnecting with a session ID, try to restore session
    if (message.payload.sessionId) {
      // In a real implementation, we would validate the session ID
      // For now, just acknowledge it
      client.sessionId = message.payload.sessionId;
      console.log(`Client ${clientId} reconnected with session ${client.sessionId}`);
    }

    // Send connect acknowledgment with session ID
    this.sendMessage(clientId, {
      type: WebSocketMessageType.CONNECT,
      payload: {
        sessionId: client.sessionId,
        reconnected: !!message.payload.reconnecting
      },
      timestamp: Date.now()
    });

    console.log(`Client ${clientId} registered as user ${client.userId}`);
  }

  private handleDisconnectMessage(clientId: string, message: WebSocketMessage): void {
    // Client is gracefully disconnecting
    this.handleDisconnect(clientId);
  }

  private handleJoinRoomMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const roomCode = message.payload.roomCode;
    if (!roomCode) {
      this.sendErrorMessage(clientId, 'Room code is required');
      return;
    }

    // Leave current room if in one
    if (client.roomCode) {
      this.leaveRoom(clientId, client.roomCode);
    }

    // Join or create room
    let room = this.rooms.get(roomCode);
    if (!room) {
      // Create new room
      room = {
        roomCode,
        clients: new Set<string>(),
        gameState: {
          roomCode,
          playerHealth: 20,
          opponentHealth: 20,
          playerMana: 1,
          opponentMana: 1,
          playerDeck: [],
          opponentDeckSize: 0,
          currentTurn: 'player',
          timestamp: Date.now(),
          version: 0
        },
        createdAt: Date.now()
      };
      this.rooms.set(roomCode, room);
      console.log(`Created new room: ${roomCode}`);
    }

    // Add client to room
    room.clients.add(clientId);
    client.roomCode = roomCode;

    console.log(`Client ${clientId} joined room ${roomCode}`);

    // Notify client of successful join
    this.sendMessage(clientId, {
      type: WebSocketMessageType.JOIN_ROOM,
      payload: { roomCode, success: true },
      timestamp: Date.now(),
      roomCode
    });
  }

  private handleLeaveRoomMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) return;

    this.leaveRoom(clientId, client.roomCode);
  }

  private handleGameStateUpdateMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      this.sendErrorMessage(clientId, 'Not in a room');
      return;
    }

    const room = this.rooms.get(client.roomCode);
    if (!room) {
      this.sendErrorMessage(clientId, 'Room not found');
      return;
    }

    // Update game state
    room.gameState = {
      ...room.gameState,
      ...message.payload,
      timestamp: Date.now(),
      version: (room.gameState.version || 0) + 1
    };

    console.log(`Updated game state in room ${client.roomCode} to version ${room.gameState.version}`);

    // Broadcast to all clients in the room
    this.broadcastToRoom(client.roomCode, {
      type: WebSocketMessageType.GAME_STATE_UPDATE,
      payload: room.gameState,
      timestamp: Date.now(),
      sender: client.userId,
      roomCode: client.roomCode
    }, clientId); // Exclude sender
  }

  private handlePlayerMoveMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      this.sendErrorMessage(clientId, 'Not in a room');
      return;
    }

    // Broadcast move to all clients in the room
    this.broadcastToRoom(client.roomCode, {
      type: WebSocketMessageType.PLAYER_MOVE,
      payload: message.payload,
      timestamp: Date.now(),
      sender: client.userId,
      roomCode: client.roomCode
    });

    console.log(`Player move in room ${client.roomCode}: ${message.payload.cardId} (${message.payload.moveType})`);
  }

  private handleSyncRequestMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      this.sendErrorMessage(clientId, 'Not in a room');
      return;
    }

    const room = this.rooms.get(client.roomCode);
    if (!room) {
      this.sendErrorMessage(clientId, 'Room not found');
      return;
    }

    // Send sync response with current game state
    this.sendMessage(clientId, {
      type: WebSocketMessageType.SYNC_RESPONSE,
      payload: {
        gameState: room.gameState
      },
      timestamp: Date.now(),
      roomCode: client.roomCode
    });

    console.log(`Sync response sent to client ${clientId} for room ${client.roomCode}`);
  }

  private handlePingMessage(clientId: string, message: WebSocketMessage): void {
    // Respond with pong
    this.sendMessage(clientId, {
      type: WebSocketMessageType.PONG,
      payload: { timestamp: message.payload.timestamp },
      timestamp: Date.now()
    });
  }

  private handleChatMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      this.sendErrorMessage(clientId, 'Not in a room');
      return;
    }

    const { content, sender } = message.payload;
    if (!content || !sender) {
      this.sendErrorMessage(clientId, 'Invalid chat message format');
      return;
    }

    console.log(`Chat message in room ${client.roomCode} from ${sender}: ${content}`);

    // Broadcast the chat message to all clients in the room
    this.broadcastToRoom(client.roomCode, {
      type: WebSocketMessageType.CHAT_MESSAGE,
      payload: {
        content,
        sender,
        roomCode: client.roomCode
      },
      timestamp: Date.now(),
      sender,
      roomCode: client.roomCode
    });
  }

  private handleChatJoin(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      this.sendErrorMessage(clientId, 'Not in a room');
      return;
    }

    const { username } = message.payload;
    if (!username) {
      this.sendErrorMessage(clientId, 'Username is required');
      return;
    }

    console.log(`User ${username} joined chat in room ${client.roomCode}`);

    // Broadcast the join notification to all clients in the room
    this.broadcastToRoom(client.roomCode, {
      type: WebSocketMessageType.CHAT_JOIN,
      payload: {
        username,
        roomCode: client.roomCode
      },
      timestamp: Date.now(),
      roomCode: client.roomCode
    });
  }

  private handleChatLeave(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomCode) {
      // Client might already be disconnected, so no need for error
      return;
    }

    const { username } = message.payload;
    if (!username) {
      this.sendErrorMessage(clientId, 'Username is required');
      return;
    }

    console.log(`User ${username} left chat in room ${client.roomCode}`);

    // Broadcast the leave notification to all clients in the room
    this.broadcastToRoom(client.roomCode, {
      type: WebSocketMessageType.CHAT_LEAVE,
      payload: {
        username,
        roomCode: client.roomCode
      },
      timestamp: Date.now(),
      roomCode: client.roomCode
    });
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client disconnected: ${clientId}`);

    // Leave room if in one
    if (client.roomCode) {
      this.leaveRoom(clientId, client.roomCode);
    }

    // Remove client
    this.clients.delete(clientId);
  }

  private leaveRoom(clientId: string, roomCode: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const room = this.rooms.get(roomCode);
    if (room) {
      // Send chat leave notification if we have a userId
      if (client.userId && client.userId !== 'anonymous') {
        // Broadcast chat leave notification
        this.broadcastToRoom(roomCode, {
          type: WebSocketMessageType.CHAT_LEAVE,
          payload: {
            username: client.userId,
            roomCode
          },
          timestamp: Date.now(),
          roomCode
        });
      }

      // Remove client from room
      room.clients.delete(clientId);
      console.log(`Client ${clientId} left room ${roomCode}`);

      // If room is empty, remove it
      if (room.clients.size === 0) {
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} removed (empty)`);
      } else {
        // Notify other clients
        this.broadcastToRoom(roomCode, {
          type: WebSocketMessageType.LEAVE_ROOM,
          payload: { userId: client.userId },
          timestamp: Date.now(),
          sender: client.userId,
          roomCode
        });
      }
    }

    // Update client
    client.roomCode = null;
  }

  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  private sendErrorMessage(clientId: string, errorMessage: string): void {
    this.sendMessage(clientId, {
      type: WebSocketMessageType.ERROR,
      payload: { message: errorMessage },
      timestamp: Date.now()
    });
  }

  private broadcastToRoom(roomCode: string, message: WebSocketMessage, excludeClientId?: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    for (const clientId of room.clients) {
      if (excludeClientId && clientId === excludeClientId) continue;
      this.sendMessage(clientId, message);
    }
  }

  private pingClients(): void {
    const now = Date.now();

    // Send ping to all clients
    for (const [clientId, client] of this.clients.entries()) {
      // Check if client has been inactive for too long (60 seconds)
      if (now - client.lastActivity > 60000) {
        console.log(`Client ${clientId} timed out (inactive for ${(now - client.lastActivity) / 1000}s)`);
        this.handleDisconnect(clientId);
        continue;
      }

      // Send ping
      this.sendMessage(clientId, {
        type: WebSocketMessageType.PING,
        payload: { timestamp: now },
        timestamp: now
      });
    }
  }

  private handleServerError(error: Error): void {
    console.error('WebSocket server error:', error);
  }

  public shutdown(): void {
    // Clear ping interval
    clearInterval(this.pingInterval);

    // Close all connections
    for (const client of this.clients.values()) {
      try {
        client.socket.close();
      } catch (error) {
        console.error(`Error closing connection for client ${client.id}:`, error);
      }
    }

    // Close server
    this.wss.close((err) => {
      if (err) {
        console.error('Error closing WebSocket server:', err);
      } else {
        console.log('WebSocket server closed');
      }
    });
  }
}

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8082; // Changed from 8081 to 8082
const server = new GameWebSocketServer(PORT);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.shutdown();
  process.exit(0);
});

console.log(`WebSocket server running on port ${PORT} with path /ws`);
