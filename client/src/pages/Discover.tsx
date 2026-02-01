/**
 * FLaMO Discover Page - Nightlife Dating
 * Swipe through profiles, browse for FREE, pay to connect
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import { toast } from 'sonner';
import { 
  MapPin, 
  Heart,
  X,
  MessageCircle,
  ChevronLeft,
  RefreshCw,
  Navigation,
  Flame,
  Star,
  Lock,
  Zap,
  Crown,
  Loader2,
  Sparkles
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

// Floating embers background
function FloatingEmbers() {
  const [embers, setEmbers] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  
  useEffect(() => {
    const newEmbers = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    }));
    setEmbers(newEmbers);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="absolute rounded-full"
          style={{
            left: `${ember.x}%`,
            top: `${ember.y}%`,
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, rgba(255,106,0,0.6) 0%, transparent 100%)`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Profile swipe card
function ProfileCard({ 
  user, 
  onLike, 
  onSkip,
  onUnlockChat,
  isLiking,
  isTop
}: { 
  user: DiscoverUser; 
  onLike: () => void; 
  onSkip: () => void;
  onUnlockChat: () => void;
  isLiking: boolean;
  isTop: boolean;
}) {
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x > 100) {
      setExitX(300);
      onLike();
    } else if (info.offset.x < -100) {
      setExitX(-300);
      onSkip();
    }
  };
  
  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        opacity: isTop ? 1 : 0.5,
        x: exitX,
      }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.3 } }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ cursor: isTop ? 'grab' : 'default' }}
    >
      <div className="h-full rounded-3xl overflow-hidden relative bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10">
        {/* Profile image placeholder with gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: user.avatarUrl 
              ? `url(${user.avatarUrl}) center/cover`
              : 'linear-gradient(180deg, rgba(255,106,0,0.2) 0%, rgba(255,43,43,0.3) 50%, rgba(0,0,0,0.8) 100%)',
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        
        {/* Swipe indicators */}
        {isDragging && (
          <>
            <motion.div
              className="absolute top-1/2 left-4 -translate-y-1/2 px-6 py-3 rounded-xl bg-red-500/80 border-2 border-red-400 rotate-[-15deg]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <X className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute top-1/2 right-4 -translate-y-1/2 px-6 py-3 rounded-xl bg-green-500/80 border-2 border-green-400 rotate-[15deg]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
          </>
        )}
        
        {/* Hot badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-sm font-bold text-white flex items-center gap-1.5 shadow-lg">
          <Flame className="w-4 h-4" />
          HOT
        </div>
        
        {/* Online indicator */}
        {user.isOnline && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50 text-sm text-green-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Online
          </div>
        )}
        
        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-white mb-1">
              {user.displayName || 'Mystery Flame'}, <span className="text-white/70">25</span>
            </h2>
            
            <div className="flex items-center gap-3 text-white/70">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-orange-400" />
                {user.distance < 1 ? 'Very close' : `${user.distance} km`}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                Verified
              </span>
            </div>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {user.bio}
            </p>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              className="flex-1 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold flex items-center justify-center gap-2"
              onClick={onSkip}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Pass
            </motion.button>
            
            <motion.button
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
              onClick={onLike}
              disabled={isLiking}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLiking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  Like
                </>
              )}
            </motion.button>
            
            <motion.button
              className="py-4 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
              onClick={onUnlockChat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle className="w-5 h-5" />
              <Lock className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Unlock chat modal
function UnlockChatModal({ 
  user, 
  onClose, 
  onUnlock 
}: { 
  user: DiscoverUser; 
  onClose: () => void; 
  onUnlock: (type: string) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-t-3xl p-6 border-t border-white/10"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Unlock Chat with {user.displayName || 'this flame'}
          </h3>
          <p className="text-white/60">
            Start a conversation and see where it leads
          </p>
        </div>
        
        {/* Options */}
        <div className="space-y-3 mb-6">
          <motion.button
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 flex items-center justify-between"
            onClick={() => onUnlock('single')}
            whileHover={{ scale: 1.01, borderColor: 'rgba(249,115,22,0.5)' }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-orange-400" />
              <div className="text-left">
                <p className="text-white font-semibold">Unlock This Chat</p>
                <p className="text-white/50 text-sm">Message this person</p>
              </div>
            </div>
            <span className="text-orange-400 font-bold">$1.99</span>
          </motion.button>
          
          <motion.button
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 flex items-center justify-between"
            onClick={() => onUnlock('tonight')}
            whileHover={{ scale: 1.01, borderColor: 'rgba(168,85,247,0.5)' }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <p className="text-white font-semibold">Unlimited Tonight</p>
                <p className="text-white/50 text-sm">Message anyone until sunrise</p>
              </div>
            </div>
            <span className="text-purple-400 font-bold">$4.99</span>
          </motion.button>
          
          <motion.button
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 flex items-center justify-between relative overflow-hidden"
            onClick={() => onUnlock('vip')}
            whileHover={{ scale: 1.01, borderColor: 'rgba(234,179,8,0.5)' }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Best value badge */}
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-bl-lg">
              BEST VALUE
            </div>
            
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              <div className="text-left">
                <p className="text-white font-semibold">VIP Access</p>
                <p className="text-white/50 text-sm">Unlimited messaging forever</p>
              </div>
            </div>
            <span className="text-yellow-400 font-bold">$9.99/mo</span>
          </motion.button>
        </div>
        
        {/* Close button */}
        <button
          className="w-full py-3 text-white/50 text-sm"
          onClick={onClose}
        >
          Maybe later
        </button>
      </motion.div>
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
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DiscoverUser | null>(null);

  // Mock data for demo
  const mockUsers: DiscoverUser[] = [
    { userId: 1, displayName: 'Alex', bio: 'Living for the night 🌙 Love music, dancing, and good vibes', avatarUrl: null, distance: 2.5, meetupIntent: 'open', preferences: null, isOnline: true, lastActiveAt: new Date() },
    { userId: 2, displayName: 'Jordan', bio: 'Here for a good time, not a long time ✨', avatarUrl: null, distance: 1.2, meetupIntent: 'open', preferences: null, isOnline: true, lastActiveAt: new Date() },
    { userId: 3, displayName: 'Sam', bio: 'Spontaneous adventures only 🔥', avatarUrl: null, distance: 3.8, meetupIntent: 'maybe', preferences: null, isOnline: false, lastActiveAt: new Date() },
  ];

  const { 
    data: nearbyUsers, 
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = trpc.discover.nearby.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
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
        toast.success("🔥 It's a match! Unlock chat to connect.", {
          action: {
            label: 'Unlock',
            onClick: () => setShowUnlockModal(true),
          },
        });
      } else {
        toast.success('💕 Like sent!');
      }
      goToNext();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Use real data or mock data
  const users = nearbyUsers?.length ? nearbyUsers : mockUsers;
  const filteredUsers = users.filter(u => !skippedIds.includes(u.userId));
  const currentUser = filteredUsers[currentIndex];
  const nextUser = filteredUsers[currentIndex + 1];

  const goToNext = () => {
    if (currentIndex < filteredUsers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
      setSkippedIds([]);
    }
  };

  const handleLike = () => {
    if (currentUser && isAuthenticated) {
      likeMutation.mutate({ userId: currentUser.userId });
    } else {
      toast.success('💕 Like sent!');
      goToNext();
    }
  };

  const handleSkip = () => {
    if (currentUser) {
      setSkippedIds(prev => [...prev, currentUser.userId]);
    }
    goToNext();
  };

  const handleUnlockChat = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setShowUnlockModal(true);
    }
  };

  const handleUnlock = (type: string) => {
    toast.success(`Redirecting to payment for ${type}...`);
    setShowUnlockModal(false);
    navigate('/premium');
  };

  // Request location on mount
  useEffect(() => {
    if (!hasLocation && !locationLoading && permissionState !== 'denied') {
      requestLocation();
    }
  }, [hasLocation, locationLoading, permissionState, requestLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <FloatingEmbers />
      
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 safe-top safe-bottom h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => navigate('/')}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Discover
              </h1>
              <p className="text-white/50 text-xs">
                {filteredUsers.length} flames nearby
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => {
                setSkippedIds([]);
                setCurrentIndex(0);
                refetchUsers();
              }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </motion.button>
            <motion.button
              className="p-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
              onClick={() => navigate('/matches')}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5 text-orange-400" />
            </motion.button>
          </div>
        </header>

        {/* Location permission needed */}
        {!hasLocation && !locationLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 rounded-3xl bg-white/5 border border-white/10 max-w-sm">
              <Navigation className="w-16 h-16 mx-auto mb-4 text-orange-400" />
              <h2 className="text-xl font-bold text-white mb-2">
                Find Flames Nearby
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Enable location to discover people around you. Your exact location stays private.
              </p>
              {locationError && (
                <p className="text-red-400 text-sm mb-4">{locationError}</p>
              )}
              <motion.button
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold flex items-center justify-center gap-2"
                onClick={requestLocation}
                disabled={locationLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {locationLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Enable Location
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* Card stack */}
        {(hasLocation || mockUsers.length > 0) && (
          <div className="flex-1 relative">
            <AnimatePresence>
              {nextUser && (
                <ProfileCard
                  key={nextUser.userId}
                  user={nextUser}
                  onLike={() => {}}
                  onSkip={() => {}}
                  onUnlockChat={() => {}}
                  isLiking={false}
                  isTop={false}
                />
              )}
              {currentUser && (
                <ProfileCard
                  key={currentUser.userId}
                  user={currentUser}
                  onLike={handleLike}
                  onSkip={handleSkip}
                  onUnlockChat={handleUnlockChat}
                  isLiking={likeMutation.isPending}
                  isTop={true}
                />
              )}
            </AnimatePresence>
            
            {/* No more users */}
            {!currentUser && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-orange-400/50" />
                  <h3 className="text-xl font-bold text-white mb-2">No more flames</h3>
                  <p className="text-white/50 mb-4">Check back later for new matches</p>
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
                    onClick={() => {
                      setSkippedIds([]);
                      setCurrentIndex(0);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Over
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlock chat modal */}
      <AnimatePresence>
        {showUnlockModal && selectedUser && (
          <UnlockChatModal
            user={selectedUser}
            onClose={() => setShowUnlockModal(false)}
            onUnlock={handleUnlock}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
