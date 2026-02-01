/**
 * FLaMO Home Screen - Nightlife Dating App
 * "Light Up Your Vibe"
 * 
 * Fiery, exciting energy. Find your flame tonight.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Flame, Heart, Sparkles, MapPin, Crown, MessageCircle, Users, Zap, Star } from 'lucide-react';

// Floating ember particle component
function FloatingEmbers() {
  const [embers, setEmbers] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  
  useEffect(() => {
    const newEmbers = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
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
            background: `radial-gradient(circle, rgba(255,106,0,0.8) 0%, rgba(255,43,43,0.4) 50%, transparent 100%)`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Fire glow background
function FireGlow() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Main fire glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,106,0,0.3) 0%, rgba(255,43,43,0.15) 30%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Secondary glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,184,0,0.2) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Hot profile preview card
function HotProfileCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="relative w-32 h-44 rounded-2xl overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      {/* Placeholder gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,106,0,0.3) 0%, rgba(255,43,43,0.5) 100%)',
        }}
      />
      
      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-orange-500/50 transition-colors" />
      
      {/* Hot badge */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[10px] font-bold text-white flex items-center gap-1">
        <Flame className="w-3 h-3" />
        HOT
      </div>
      
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white font-semibold text-sm">Nearby</p>
        <p className="text-white/60 text-xs flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          2.5 km
        </p>
      </div>
      
      {/* Lock overlay for contact */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 mx-auto mb-1" />
          <p className="text-white text-xs font-medium">Unlock Chat</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading, isOAuthConfigured, getLoginUrl } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
  // Auto-hide splash after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);
  
  // Splash screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <FloatingEmbers />
        <FireGlow />
        
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -5, 5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Flame className="w-12 h-12 text-orange-500" />
            </motion.div>
            <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-2 -right-2" />
          </motion.div>
          
          <motion.h1
            className="text-5xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="text-orange-500">FL</span>
            <span className="text-yellow-500">a</span>
            <span className="text-orange-400">MO</span>
          </motion.h1>
          
          <motion.p
            className="mt-4 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <span className="text-white/80">Light Up</span>
            {' '}
            <span className="text-orange-400">Your Vibe</span>
          </motion.p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <FloatingEmbers />
      <FireGlow />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">
                <span className="text-orange-500">FL</span>
                <span className="text-yellow-500">a</span>
                <span className="text-orange-400">MO</span>
              </span>
            </motion.div>
            
            <div className="flex items-center gap-3">
              {!authLoading && isAuthenticated && (
                <>
                  <motion.button
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors relative"
                    onClick={() => navigate('/messages')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle className="w-5 h-5 text-white/70" />
                    {/* Notification dot */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  </motion.button>
                  
                  <motion.button
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center"
                    onClick={() => navigate('/profile')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">🔥</span>
                  </motion.button>
                </>
              )}
              
              {!authLoading && !isAuthenticated && isOAuthConfigured && (
                <motion.button
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                  onClick={() => {
                    const url = getLoginUrl();
                    if (url) window.location.href = url;
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </header>
        
        {/* Hero Section */}
        <motion.section
          className="px-6 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold leading-tight mb-3">
            <span className="text-white">Find Your</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Flame Tonight
            </span>
          </h2>
          <p className="text-white/60 text-lg">
            Real people. Real vibes. Real connections.
          </p>
        </motion.section>
        
        {/* Hot Profiles Preview */}
        <motion.section
          className="px-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Hot Near You
            </h3>
            <button 
              className="text-orange-400 text-sm font-medium"
              onClick={() => navigate('/discover')}
            >
              See All →
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <HotProfileCard delay={0.5} />
            <HotProfileCard delay={0.6} />
            <HotProfileCard delay={0.7} />
            <HotProfileCard delay={0.8} />
          </div>
        </motion.section>
        
        {/* Main CTA */}
        <motion.section
          className="px-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden"
            onClick={() => navigate('/discover')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <Heart className="w-6 h-6" />
            Start Matching
            <Zap className="w-5 h-5" />
          </motion.button>
        </motion.section>
        
        {/* Quick Actions */}
        <motion.section
          className="px-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* VIP Access */}
            <motion.button
              className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-left"
              onClick={() => navigate('/premium')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(234,179,8,0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Crown className="w-8 h-8 text-yellow-500 mb-2" />
              <h4 className="text-white font-semibold">VIP Access</h4>
              <p className="text-white/50 text-xs mt-1">Unlimited messaging</p>
            </motion.button>
            
            {/* Events */}
            <motion.button
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-left"
              onClick={() => navigate('/events')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(168,85,247,0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
              <h4 className="text-white font-semibold">Tonight's Events</h4>
              <p className="text-white/50 text-xs mt-1">Find the vibe</p>
            </motion.button>
            
            {/* Nearby */}
            <motion.button
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-left"
              onClick={() => navigate('/nearby')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(6,182,212,0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin className="w-8 h-8 text-cyan-500 mb-2" />
              <h4 className="text-white font-semibold">Who's Nearby</h4>
              <p className="text-white/50 text-xs mt-1">Real-time radar</p>
            </motion.button>
            
            {/* VibeLock */}
            <motion.button
              className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-left"
              onClick={() => navigate('/vibelock')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(239,68,68,0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-8 h-8 text-red-500 mb-2" />
              <h4 className="text-white font-semibold">VibeLock</h4>
              <p className="text-white/50 text-xs mt-1">Sync your energy</p>
            </motion.button>
          </div>
        </motion.section>
        
        {/* Bottom tagline */}
        <motion.div
          className="mt-auto px-6 pb-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <p className="text-white/40 text-sm">
            🔥 Where sparks become flames
          </p>
        </motion.div>
      </div>
    </div>
  );
}
