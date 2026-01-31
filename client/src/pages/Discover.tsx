/**
 * FLaMO Discovery Page
 * Find and connect with nearby users based on preferences.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import { GlassCard } from '../components/GlassCard';
import { Avatar } from '../components/Avatar';
import { GlassButton } from '../components/GlassButton';
import { toast } from 'sonner';
import { 
  MapPin, 
  Heart,
  X,
  MessageCircle,
  ChevronLeft,
  RefreshCw,
  AlertTriangle,
  Users,
  Loader2,
  Navigation,
  Shield
} from 'lucide-react';

interface DiscoverUser {
  userId: number;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  distance: number;
  meetupIntent: string;
  preferences: { modePreferences?: string[] } | null;
  isOnline: boolean;
  lastActiveAt: Date | null;
}

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open to meet', color: '#34d399' },
  maybe: { label: 'Maybe', color: '#fbbf24' },
  friends_only: { label: 'Friends only', color: '#60a5fa' },
  not_now: { label: 'Just browsing', color: '#94a3b8' },
};

function UserCard({ 
  user, 
  onLike, 
  onSkip,
  isLiking 
}: { 
  user: DiscoverUser; 
  onLike: () => void; 
  onSkip: () => void;
  isLiking: boolean;
}) {
  const intent = INTENT_LABELS[user.meetupIntent] || INTENT_LABELS.maybe;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      className="w-full"
    >
      <GlassCard className="p-6">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="xl"
            isOnline={user.isOnline}
            showOnlineIndicator
          />
        </div>

        {/* Name and status */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {user.displayName || 'Anonymous'}
          </h2>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.isOnline ? '#34d399' : '#94a3b8' }}
            />
            <span className="text-sm text-white/60">
              {user.isOnline ? 'Online now' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white/70">
            {user.distance < 1 
              ? 'Less than 1 km away' 
              : `${user.distance} km away`}
          </span>
        </div>

        {/* Intent badge */}
        <div className="flex justify-center mb-4">
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${intent.color}20`,
              color: intent.color,
            }}
          >
            {intent.label}
          </span>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-center text-white/60 text-sm mb-4 line-clamp-3">
            {user.bio}
          </p>
        )}

        {/* Mode preferences */}
        {user.preferences?.modePreferences && user.preferences.modePreferences.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {user.preferences.modePreferences.map((mode) => (
              <span 
                key={mode}
                className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white/70 capitalize"
              >
                {mode}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <GlassButton
            variant="secondary"
            onClick={onSkip}
            className="flex-1"
            icon={<X className="w-5 h-5" />}
          >
            Skip
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={onLike}
            loading={isLiking}
            className="flex-1"
            icon={<Heart className="w-5 h-5" />}
            style={{
              background: 'linear-gradient(135deg, rgba(244,114,182,0.3), rgba(167,139,250,0.3))',
              borderColor: 'rgba(244,114,182,0.5)',
            }}
          >
            Like
          </GlassButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function Discover() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { 
    latitude, 
    longitude, 
    error: locationError, 
    loading: locationLoading,
    requestLocation,
    hasLocation,
    permissionState,
  } = useGeoLocation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [skippedIds, setSkippedIds] = useState<number[]>([]);

  const { data: profile } = trpc.profile.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { 
    data: nearbyUsers, 
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = trpc.discover.nearby.useQuery(
    {
      latitude: latitude!,
      longitude: longitude!,
      maxDistanceKm: 50,
      limit: 50,
    },
    { 
      enabled: isAuthenticated && hasLocation,
      refetchOnWindowFocus: false,
    }
  );

  const likeMutation = trpc.match.like.useMutation({
    onSuccess: (result) => {
      if (result.isNewMatch) {
        toast.success("It's a match! You can now message each other.", {
          action: {
            label: 'View Matches',
            onClick: () => navigate('/matches'),
          },
        });
      } else {
        toast.success('Like sent!');
      }
      goToNext();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter out skipped users
  const filteredUsers = nearbyUsers?.filter(u => !skippedIds.includes(u.userId)) || [];
  const currentUser = filteredUsers[currentIndex];

  const goToNext = () => {
    if (currentIndex < filteredUsers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleLike = () => {
    if (currentUser) {
      likeMutation.mutate({ userId: currentUser.userId });
    }
  };

  const handleSkip = () => {
    if (currentUser) {
      setSkippedIds(prev => [...prev, currentUser.userId]);
    }
    goToNext();
  };

  const handleRefresh = () => {
    setSkippedIds([]);
    setCurrentIndex(0);
    refetchUsers();
  };

  // Request location on mount
  useEffect(() => {
    if (!hasLocation && !locationLoading && permissionState !== 'denied') {
      requestLocation();
    }
  }, [hasLocation, locationLoading, permissionState, requestLocation]);

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
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => navigate('/')}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </motion.button>
            <h1 className="text-xl font-semibold text-white">Discover</h1>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={handleRefresh}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </motion.button>
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => navigate('/matches')}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>
        </header>

        {/* Location permission needed */}
        {!hasLocation && !locationLoading && (
          <GlassCard className="p-6 text-center">
            <Navigation className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Enable Location
            </h2>
            <p className="text-white/60 text-sm mb-4">
              To discover people nearby, we need access to your location. 
              Your exact location is never shared with others.
            </p>
            {locationError && (
              <p className="text-red-400 text-sm mb-4">{locationError}</p>
            )}
            <GlassButton
              variant="primary"
              onClick={requestLocation}
              loading={locationLoading}
              icon={<MapPin className="w-5 h-5" />}
            >
              Enable Location
            </GlassButton>
          </GlassCard>
        )}

        {/* Profile not discoverable warning */}
        {hasLocation && profile && !profile.isDiscoverable && (
          <GlassCard className="p-4 mb-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-200 font-medium">You're hidden</p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Others can't find you. Enable discoverability in your profile to be seen.
                </p>
                <motion.button
                  className="text-xs text-amber-400 underline mt-2"
                  onClick={() => navigate('/profile')}
                >
                  Update Profile
                </motion.button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Loading users */}
        {hasLocation && usersLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin mb-4" />
            <p className="text-white/50">Finding people nearby...</p>
          </div>
        )}

        {/* No users found */}
        {hasLocation && !usersLoading && filteredUsers.length === 0 && (
          <GlassCard className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <h2 className="text-lg font-semibold text-white mb-2">
              No one nearby
            </h2>
            <p className="text-white/60 text-sm mb-4">
              There are no discoverable users in your area right now. 
              Try again later or expand your search distance.
            </p>
            <GlassButton
              variant="secondary"
              onClick={handleRefresh}
              icon={<RefreshCw className="w-5 h-5" />}
            >
              Refresh
            </GlassButton>
          </GlassCard>
        )}

        {/* User cards */}
        {hasLocation && !usersLoading && currentUser && (
          <AnimatePresence mode="wait">
            <UserCard
              key={currentUser.userId}
              user={currentUser}
              onLike={handleLike}
              onSkip={handleSkip}
              isLiking={likeMutation.isPending}
            />
          </AnimatePresence>
        )}

        {/* Safety reminder */}
        {hasLocation && !usersLoading && filteredUsers.length > 0 && (
          <GlassCard className="p-4 mt-4 border-white/10">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-white/50">
                <span className="text-emerald-400 font-medium">Safety first:</span>{' '}
                Always meet in public places. Never share personal details until you trust someone.
              </p>
            </div>
          </GlassCard>
        )}

        {/* Progress indicator */}
        {hasLocation && filteredUsers.length > 0 && (
          <p className="text-center text-white/40 text-sm mt-4">
            {currentIndex + 1} of {filteredUsers.length} nearby
          </p>
        )}
      </div>
    </div>
  );
}
