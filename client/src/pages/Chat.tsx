/**
 * FLaMO Chat Page
 * Messaging between matched users with safety warnings.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { GlassCard } from '../components/GlassCard';
import { Avatar } from '../components/Avatar';
import { useSocket, useTypingIndicator } from '../hooks/useSocket';
import { GlassButton } from '../components/GlassButton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ChevronLeft,
  Send,
  AlertTriangle,
  Shield,
  MoreVertical,
  Flag,
  UserX,
  Loader2,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Message {
  id: number;
  content: string;
  senderId: number;
  isMe: boolean;
  createdAt: Date;
  isRead: boolean;
}

export default function Chat() {
  const [, navigate] = useLocation();
  const params = useParams<{ matchId: string }>();
  const matchId = parseInt(params.matchId || '0');
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real-time features
  const { isConnected, startTyping, stopTyping } = useSocket({
    onNewMessage: (msg) => {
      if (msg.matchId === matchId) {
        refetchMessages();
      }
    },
  });
  const { isTyping: otherUserTyping } = useTypingIndicator(matchId);

  const { data: matches } = trpc.match.list.useQuery(undefined, { enabled: isAuthenticated });
  const currentMatch = matches?.find(m => m.matchId === matchId);

  const { 
    data: messages, 
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = trpc.messages.list.useQuery(
    { matchId, limit: 100 },
    { 
      enabled: isAuthenticated && matchId > 0,
      refetchInterval: 3000, // Poll every 3 seconds for new messages
    }
  );

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
    onError: (error) => {
      toast.error('Failed to send: ' + error.message);
    },
  });

  const blockMutation = trpc.safety.block.useMutation({
    onSuccess: () => {
      toast.success('User blocked');
      navigate('/matches');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reportMutation = trpc.safety.report.useMutation({
    onSuccess: () => {
      toast.success('Report submitted. Thank you for helping keep FLaMO safe.');
      setShowReportDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unmatchMutation = trpc.match.unmatch.useMutation({
    onSuccess: () => {
      toast.success('Unmatched');
      navigate('/matches');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if first message - show safety warning
  useEffect(() => {
    const dismissed = localStorage.getItem('flamo_chat_safety_dismissed');
    if (dismissed) {
      setShowSafetyWarning(false);
    }
  }, []);

  const dismissSafetyWarning = () => {
    localStorage.setItem('flamo_chat_safety_dismissed', 'true');
    setShowSafetyWarning(false);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({ matchId, content: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    startTyping(matchId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(matchId);
    }, 2000);
  };

  const handleBlock = () => {
    if (currentMatch?.otherUser.id) {
      blockMutation.mutate({ 
        userId: currentMatch.otherUser.id,
        reason: 'Blocked from chat',
      });
    }
  };

  const handleReport = () => {
    if (currentMatch?.otherUser.id && reportReason) {
      reportMutation.mutate({
        userId: currentMatch.otherUser.id,
        reason: reportReason as any,
        description: `Reported from chat conversation`,
      });
    }
  };

  if (authLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex items-center justify-center">
        <GlassCard className="p-6 text-center max-w-sm mx-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white mb-2">Match not found</h2>
          <p className="text-white/60 text-sm mb-4">
            This conversation may have been removed or the match no longer exists.
          </p>
          <GlassButton variant="primary" onClick={() => navigate('/matches')}>
            Back to Matches
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const otherUser = currentMatch.otherUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => navigate('/matches')}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </motion.button>

            <div className="flex items-center gap-3">
              <Avatar
                src={otherUser.avatarUrl}
                name={otherUser.displayName || otherUser.name}
                size="md"
                isOnline={otherUser.isOnline}
                showOnlineIndicator
              />
              <div>
                <h1 className="font-medium text-white">
                  {otherUser.displayName || otherUser.name || 'Anonymous'}
                </h1>
                <div className="flex items-center gap-1">
                  {otherUserTyping ? (
                    <span className="text-xs text-pink-400 animate-pulse">typing...</span>
                  ) : (
                    <>
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: otherUser.isOnline ? '#34d399' : '#94a3b8' }}
                      />
                      <span className="text-xs text-white/50">
                        {otherUser.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <MoreVertical className="w-5 h-5 text-white/70" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
              <DropdownMenuItem 
                className="text-white/70 hover:text-white focus:text-white"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 focus:text-red-300"
                onClick={() => setShowBlockDialog(true)}
              >
                <UserX className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Safety Warning */}
      <AnimatePresence>
        {showSafetyWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-lg mx-auto w-full px-4 pt-4"
          >
            <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-200 font-medium">Safety Reminder</p>
                  <p className="text-xs text-amber-200/70 mt-1">
                    Be cautious when sharing personal information. Never share your address, 
                    financial details, or other sensitive info. If meeting in person, always 
                    choose a public place and tell someone where you're going.
                  </p>
                  <motion.button
                    className="text-xs text-amber-400 underline mt-2"
                    onClick={dismissSafetyWarning}
                  >
                    I understand, don't show again
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-3">
          {/* First message info */}
          {(!messages || messages.length === 0) && (
            <div className="text-center py-8">
              <Info className="w-8 h-8 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">
                This is the beginning of your conversation.
              </p>
              <p className="text-white/30 text-xs mt-1">
                Be respectful and have fun!
              </p>
            </div>
          )}

          {messages?.slice().reverse().map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  msg.isMe
                    ? 'bg-gradient-to-r from-pink-500/30 to-violet-500/30 rounded-br-md'
                    : 'bg-white/10 rounded-bl-md'
                }`}
              >
                <p className="text-white text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-[#0a0a12]/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              maxLength={2000}
            />
            <GlassButton
              variant="primary"
              onClick={handleSend}
              loading={sendMutation.isPending}
              disabled={!message.trim()}
              icon={<Send className="w-5 h-5" />}
              style={{
                background: 'linear-gradient(135deg, rgba(244,114,182,0.3), rgba(167,139,250,0.3))',
              }}
            >
              Send
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Block this user?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              They won't be able to find you or message you. This will also unmatch you.
              You can unblock them later from settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
              onClick={handleBlock}
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Report this user</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Help us keep FLaMO safe. Select a reason for your report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            {[
              { value: 'inappropriate', label: 'Inappropriate content' },
              { value: 'harassment', label: 'Harassment or bullying' },
              { value: 'spam', label: 'Spam or scam' },
              { value: 'fake_profile', label: 'Fake profile' },
              { value: 'safety_concern', label: 'Safety concern' },
              { value: 'other', label: 'Other' },
            ].map((reason) => (
              <motion.button
                key={reason.value}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  reportReason === reason.value
                    ? 'bg-red-500/20 ring-1 ring-red-500/50 text-red-400'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
                onClick={() => setReportReason(reason.value)}
                whileTap={{ scale: 0.98 }}
              >
                {reason.label}
              </motion.button>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
              onClick={handleReport}
              disabled={!reportReason}
            >
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
