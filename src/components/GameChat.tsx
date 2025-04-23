import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Info, Wifi, WifiOff } from 'lucide-react';
import WebSocketService, { WebSocketMessage, WebSocketMessageType } from '@/services/WebSocketService';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

interface GameChatProps {
  roomCode: string;
  playerName: string;
  opponentName?: string;
}

const GameChat: React.FC<GameChatProps> = ({
  roomCode,
  playerName,
  opponentName = "Opponent"
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-1',
      sender: 'System',
      content: `Welcome to game room ${roomCode}! You can chat with your opponent here.`,
      timestamp: Date.now(),
      isSystem: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const webSocketService = WebSocketService.getInstance();

  // Initialize WebSocket connection and listeners
  useEffect(() => {
    // Add connection status listener
    const connectionStatusListener = (connected: boolean) => {
      setIsConnected(connected);

      if (connected) {
        // Send chat join notification when connected
        webSocketService.sendChatJoin(playerName);

        // Add system message about connection
        const connectionMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: 'System',
          content: 'Connected to chat server',
          timestamp: Date.now(),
          isSystem: true
        };
        setMessages(prev => [...prev, connectionMessage]);
      } else {
        // Add system message about disconnection
        const disconnectionMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: 'System',
          content: 'Disconnected from chat server. Attempting to reconnect...',
          timestamp: Date.now(),
          isSystem: true
        };
        setMessages(prev => [...prev, disconnectionMessage]);
      }
    };

    // Add message listener for chat messages
    const messageListener = (message: WebSocketMessage) => {
      if (message.type === WebSocketMessageType.CHAT_MESSAGE) {
        // Only add messages from other users (our own messages are added directly)
        if (message.payload.sender !== playerName) {
          const chatMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: message.payload.sender,
            content: message.payload.content,
            timestamp: message.timestamp
          };
          setMessages(prev => [...prev, chatMessage]);
        }
      } else if (message.type === WebSocketMessageType.CHAT_JOIN) {
        // User joined notification
        if (message.payload.username !== playerName) {
          const joinMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            sender: 'System',
            content: `${message.payload.username} joined the chat`,
            timestamp: message.timestamp,
            isSystem: true
          };
          setMessages(prev => [...prev, joinMessage]);
        }
      } else if (message.type === WebSocketMessageType.CHAT_LEAVE) {
        // User left notification
        if (message.payload.username !== playerName) {
          const leaveMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            sender: 'System',
            content: `${message.payload.username} left the chat`,
            timestamp: message.timestamp,
            isSystem: true
          };
          setMessages(prev => [...prev, leaveMessage]);
        }
      }
    };

    // Register listeners
    webSocketService.addConnectionStatusListener(connectionStatusListener);
    webSocketService.addMessageListener(messageListener);

    // Set initial connection status
    setIsConnected(webSocketService.isConnected());

    // Clean up listeners on unmount
    return () => {
      webSocketService.removeConnectionStatusListener(connectionStatusListener);
      webSocketService.removeMessageListener(messageListener);

      // Send leave notification if connected
      if (webSocketService.isConnected()) {
        webSocketService.sendChatLeave(playerName);
      }
    };
  }, [roomCode, playerName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (!isConnected) {
      toast.error("Not connected to chat server", {
        description: "Your message will be sent when connection is restored"
      });
    }

    // Create the message object
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: playerName,
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    // Add to local messages immediately
    setMessages(prev => [...prev, newMessage]);

    // Send via WebSocket
    webSocketService.sendChatMessage(newMessage.content, playerName);

    // Clear input
    setInputMessage('');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full border border-gray-700 rounded-lg bg-black/20 overflow-hidden">
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Game Chat</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">Room: {roomCode}</div>
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 max-h-[300px]" ref={scrollAreaRef}>
        <div className="space-y-3">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.isSystem
                  ? 'bg-blue-900/20 border border-blue-500/30 p-2 rounded-md'
                  : message.sender === playerName
                    ? 'items-end'
                    : 'items-start'
              }`}
            >
              {message.isSystem ? (
                <div className="flex items-center text-xs text-blue-400">
                  <Info className="h-3 w-3 mr-1" />
                  <span>{message.sender}</span>
                </div>
              ) : (
                <div className="flex items-center text-xs text-gray-400 mb-1">
                  <span className={message.sender === playerName ? 'text-emerald-400' : 'text-amber-400'}>
                    {message.sender}
                  </span>
                  <span className="mx-1">•</span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              )}

              <div className={`px-3 py-2 rounded-lg max-w-[80%] ${
                message.isSystem
                  ? 'text-blue-100 text-xs'
                  : message.sender === playerName
                    ? 'bg-emerald-900/30 text-emerald-100'
                    : 'bg-gray-800 text-gray-100'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-gray-700 flex items-center space-x-2">
        <Input
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="bg-gray-800 border-gray-700"
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GameChat;
