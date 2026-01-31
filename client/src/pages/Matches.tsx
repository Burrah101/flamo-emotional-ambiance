/**
 * FLaMO Matches Page
 * View matches and pending likes.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { GlassCard } from '../components/GlassCard';
import { Avatar } from '../components/Avatar';
import { GlassButton } from '../components/GlassButton';
import { toast } from 'sonner';
import { 
  Heart,
  MessageCircle,
  ChevronLeft,
  Check,
  X,
  Loader2,
  Users,
  Sparkles
} from 'lucide-react';

type TabType = 'matches' | 'pending';

export default function Matches() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('matches');

  const { 
    data: matches, 
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = trpc.match.list.useQuery(undefined, { enabled: isAuthenticated });

  const { 
    data: pending, 
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = trpc.match.pending.useQuery(undefined, { enabled: isAuthenticated });

  const respondMutation = trpc.match.respond.useMutation({
    onSuccess: (result) => {
      if (result.isMatch) {
        toast.success("It's a match! You can now message each other.");
      }
      refetchMatches();
      refetchPending();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unmatchMutation = trpc.match.unmatch.useMutation({
    onSuccess: () => {
      toast.success('Unmatched successfully');
      refetchMatches();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12]">
      <div className="max-w-lg mx-auto px-4 py-6 safe-top safe-bottom">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <motion.button
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </motion.button>
          <h1 className="text-xl font-semibold text-white">Connections</h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <motion.button
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'matches'
                ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('matches')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Matches</span>
              {matches && matches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/30 text-xs">
                  {matches.length}
                </span>
              )}
            </div>
          </motion.button>

          <motion.button
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('pending')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Likes</span>
              {pending && pending.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-xs">
                  {pending.length}
                </span>
              )}
            </div>
          </motion.button>
        </div>

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matchesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              </div>
            ) : matches && matches.length > 0 ? (
              matches.map((match) => (
                <GlassCard key={match.matchId} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar
                      src={match.otherUser.avatarUrl}
                      name={match.otherUser.displayName || match.otherUser.name}
                      size="lg"
                      isOnline={match.otherUser.isOnline}
                      showOnlineIndicator
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                          {match.otherUser.displayName || match.otherUser.name || 'Anonymous'}
                        </h3>
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: match.otherUser.isOnline ? '#34d399' : '#94a3b8' }}
                        />
                      </div>
                      <p className="text-xs text-white/50">
                        Matched {match.matchedAt ? new Date(match.matchedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </div>

                    {/* Actions */}
                    <motion.button
                      className="p-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 transition-colors"
                      onClick={() => navigate(`/chat/${match.matchId}`)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-5 h-5 text-pink-400" />
                    </motion.button>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium text-white mb-2">No matches yet</h3>
                <p className="text-white/50 text-sm mb-4">
                  Start discovering people nearby to find your first match!
                </p>
                <GlassButton
                  variant="primary"
                  onClick={() => navigate('/discover')}
                  icon={<Heart className="w-5 h-5" />}
                >
                  Discover People
                </GlassButton>
              </GlassCard>
            )}
          </div>
        )}

        {/* Pending Likes Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              </div>
            ) : pending && pending.length > 0 ? (
              pending.map((like) => (
                <GlassCard key={like.matchId} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar
                      src={like.fromUser.avatarUrl}
                      name={like.fromUser.displayName || like.fromUser.name}
                      size="lg"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {like.fromUser.displayName || like.fromUser.name || 'Anonymous'}
                      </h3>
                      {like.fromUser.bio && (
                        <p className="text-xs text-white/50 truncate">
                          {like.fromUser.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        onClick={() => respondMutation.mutate({ matchId: like.matchId, accept: false })}
                        whileTap={{ scale: 0.95 }}
                        disabled={respondMutation.isPending}
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </motion.button>
                      <motion.button
                        className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                        onClick={() => respondMutation.mutate({ matchId: like.matchId, accept: true })}
                        whileTap={{ scale: 0.95 }}
                        disabled={respondMutation.isPending}
                      >
                        <Check className="w-5 h-5 text-emerald-400" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium text-white mb-2">No pending likes</h3>
                <p className="text-white/50 text-sm">
                  When someone likes you, they'll appear here.
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
