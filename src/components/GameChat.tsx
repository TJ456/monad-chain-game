import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Info } from 'lucide-react';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: playerName,
      content: inputMessage.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Simulate opponent response after a random delay (1-3 seconds)
    if (Math.random() > 0.7) {
      const responses = [
        "Good move!",
        "Hmm, interesting strategy...",
        "I didn't see that coming!",
        "Let me think about my next move...",
        "Nice play!",
        "This is getting intense!",
        "You're pretty good at this!"
      ];
      
      setTimeout(() => {
        const responseMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: opponentName,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full border border-gray-700 rounded-lg bg-black/20 overflow-hidden">
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Game Chat</h3>
        <div className="text-xs text-gray-400">Room: {roomCode}</div>
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
