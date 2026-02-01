/**
 * FLaMO Map Chat Component
 * Real-time chat drawer for connecting with nearby users on the map.
 * Features paid contact access integration.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import { useSocket, useTypingIndicator } from '../hooks/useSocket';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  X,
  Send,
  Flame,
  Lock,
  Sparkles,
  MessageCircle,
  Loader2,
  Crown,
  Zap
} from 'lucide-react';

interface NearbyUser {
  id: number;
  username: string;
  photoUrl: string | null;
  currentMood: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: number;
  timestamp: Date;
  isMe: boolean;
}

interface MapChatProps {
  user: NearbyUser;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

export function MapChat({ user, isOpen, onClose, isUnlocked = false, onUnlockRequest }: MapChatProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time socket connection
  const { isConnected, startTyping, stopTyping, sendMessage: socketSendMessage } = useSocket({
    onNewMessage: (msg) => {
      if (msg.senderId === user.id || (currentUser && msg.senderId === currentUser.id)) {
        const newMessage: Message = {
          id: `msg-${Date.now()}-${Math.random()}`,
          content: msg.content,
          senderId: msg.senderId,
          timestamp: new Date(msg.createdAt),
          isMe: currentUser ? msg.senderId === currentUser.id : false,
        };
        setMessages(prev => [...prev, newMessage]);
      }
    },
  });

  // Simulated typing indicator (would use real matchId in production)
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && isUnlocked) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isUnlocked]);

  // Handle typing indicator
  const handleTyping = () => {
    // In production, would use real matchId
    // startTyping(matchId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // stopTyping(matchId);
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() || !isUnlocked || isSending) return;
    
    setIsSending(true);
    
    // Create optimistic message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: message.trim(),
      senderId: currentUser?.id || 0,
      timestamp: new Date(),
      isMe: true,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate sending (in production, would use tRPC mutation)
    setTimeout(() => {
      setIsSending(false);
      
      // Simulate response after a delay
      setTimeout(() => {
        const responses = [
          "Hey! Nice to meet you 🔥",
          "What's your vibe tonight?",
          "Love the energy here!",
          "Are you at the club too?",
          "Let's meet up! 💫"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-response`,
          content: randomResponse,
          senderId: user.id,
          timestamp: new Date(),
          isMe: false,
        }]);
      }, 1500 + Math.random() * 2000);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Chat Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-[#0a0a0f] rounded-t-3xl border-t border-[#FF4500]/30 shadow-2xl shadow-[#FF4500]/20"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a0f] rounded-t-3xl border-b border-gray-800 p-4">
              {/* Drag handle */}
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D000FF] to-[#FF4500] flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{user.username}</h3>
                    <div className="flex items-center gap-2">
                      {otherUserTyping ? (
                        <span className="text-[#FF4500] text-xs animate-pulse">typing...</span>
                      ) : (
                        <>
                          <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <span className="text-gray-400 text-xs">
                            {user.isOnline ? 'Online' : 'Offline'} • {user.distance} mi away
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {user.currentMood && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-gray-400 text-xs">Current vibe:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/30">
                    {user.currentMood}
                  </span>
                </div>
              )}
            </div>
            
            {/* Chat Content */}
            {isUnlocked ? (
              <>
                {/* Messages */}
                <div className="h-[45vh] overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4500]/20 to-[#D000FF]/20 flex items-center justify-center mb-4">
                        <Flame className="w-8 h-8 text-[#FF4500]" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">Start the conversation!</h4>
                      <p className="text-gray-400 text-sm max-w-xs">
                        Say hi to {user.username} and see if the vibe is right 🔥
                      </p>
                      
                      {/* Quick starters */}
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {['Hey! 👋', 'Love your vibe ✨', 'What brings you here? 🔥'].map((starter) => (
                          <button
                            key={starter}
                            onClick={() => setMessage(starter)}
                            className="px-3 py-1.5 rounded-full bg-[#1a1a2e] text-gray-300 text-sm hover:bg-[#2a2a4a] transition-colors border border-gray-700"
                          >
                            {starter}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                            msg.isMe
                              ? 'bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white rounded-br-md'
                              : 'bg-[#1a1a2e] text-white border border-gray-800 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.isMe ? 'text-white/60' : 'text-gray-500'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <div className="sticky bottom-0 bg-[#0a0a0f] border-t border-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-[#1a1a2e] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF4500] focus:ring-[#FF4500]/20"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || isSending}
                      className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] hover:from-[#FF5500] hover:to-[#FF7B45] text-white px-4"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Locked State - Requires Payment */
              <div className="h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF4500]/20 to-[#D000FF]/20 flex items-center justify-center mb-4 border border-[#FF4500]/30"
                >
                  <Lock className="w-10 h-10 text-[#FF4500]" />
                </motion.div>
                
                <h3 className="text-white font-bold text-xl mb-2">Unlock Chat Access</h3>
                <p className="text-gray-400 text-sm max-w-xs mb-6">
                  Connect with {user.username} and start a conversation. Your spark could light up the night! 🔥
                </p>
                
                {/* Pricing Options */}
                <div className="w-full max-w-sm space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUnlockRequest}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white font-semibold flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5" />
                      <span>Unlock This Chat</span>
                    </div>
                    <span className="text-white/90">$1.99</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUnlockRequest}
                    className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#D000FF]/30 text-white font-semibold flex items-center justify-between hover:border-[#D000FF]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-[#D000FF]" />
                      <span>Unlimited Tonight</span>
                    </div>
                    <span className="text-[#D000FF]">$4.99</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUnlockRequest}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-white font-semibold flex items-center justify-between hover:border-yellow-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span>VIP Access</span>
                    </div>
                    <div className="text-right">
                      <span className="text-yellow-500">$9.99</span>
                      <span className="text-gray-500 text-xs block">/month</span>
                    </div>
                  </motion.button>
                </div>
                
                <p className="text-gray-500 text-xs mt-4">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Secure payment • Instant access
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MapChat;
