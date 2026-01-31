/**
 * FLaMO Home Screen
 * Mode selection and entry point.
 * 
 * "We don't need to talk. Just join my mode."
 * 
 * Design: Elegant simplicity. Modes are the focus.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { MODE_DEFINITIONS, getFreeModes, getPremiumModes } from '../core/modeDefinitions';
import { AmbientGlow } from '../components/AmbientGlow';
import { ModeCard } from '../components/ModeCard';
import { GlassButton } from '../components/GlassButton';
import { PresenceIndicator } from '../components/PresenceIndicator';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Crown, Mic, Sparkles, Users, Heart, Settings } from 'lucide-react';

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const currentModeId = useModeStore(state => state.currentModeId);
  const enterMode = useModeStore(state => state.enterMode);
  const sharedPresence = useModeStore(state => state.sharedPresence);
  
  const isPremium = useUserStore(state => state.isPremium);
  const features = useUserStore(state => state.features);
  
  const freeModes = getFreeModes();
  const premiumModes = getPremiumModes();
  
  // If user is in a mode, redirect to experience
  useEffect(() => {
    if (currentModeId) {
      navigate('/experience');
    }
  }, [currentModeId, navigate]);
  
  const handleModeSelect = (mode: typeof MODE_DEFINITIONS[keyof typeof MODE_DEFINITIONS]) => {
    enterMode(mode.id);
    navigate('/experience');
  };
  
  return (
    <div className="min-h-screen relative">
      {/* Ambient background */}
      <AmbientGlow />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
        {/* Minimal header */}
        <header className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-xl font-light tracking-widest flamo-text uppercase">
                FLaMO
              </h1>
            </motion.div>
            
            <div className="flex items-center gap-2">
              {/* Presence indicator */}
              {sharedPresence.isSharing && (
                <PresenceIndicator showLabel={false} />
              )}
              
              {/* Premium badge - subtle */}
              {isPremium && (
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.75 0.12 45 / 0.15), oklch(0.65 0.15 25 / 0.15))',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Crown className="w-4 h-4" style={{ color: 'oklch(0.80 0.15 45)' }} />
                </motion.div>
              )}
              
              {/* Settings/Profile */}
              {!authLoading && isAuthenticated && (
                <motion.button
                  className="w-8 h-8 rounded-full flamo-glass-subtle flex items-center justify-center"
                  onClick={() => navigate('/settings')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4 flamo-text-muted" />
                </motion.button>
              )}
              
              {!authLoading && !isAuthenticated && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Sign in
                </GlassButton>
              )}
            </div>
          </div>
        </header>
        
        {/* Hero - simple, evocative */}
        <motion.section
          className="px-6 py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-2xl font-light leading-relaxed flamo-text">
            Share presence.
            <span className="flamo-text-muted"> Not words.</span>
          </h2>
        </motion.section>
        
        {/* Quick actions - minimal row */}
        <motion.section
          className="px-6 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {features.voiceActivation && (
              <GlassButton
                variant="ghost"
                size="sm"
                icon={<Mic className="w-4 h-4" />}
                onClick={() => navigate('/voice')}
              >
                Voice
              </GlassButton>
            )}
            
            {features.llmSuggestions && (
              <GlassButton
                variant="ghost"
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => navigate('/suggest')}
              >
                Suggest
              </GlassButton>
            )}
            
            {features.sharedPresence && (
              <GlassButton
                variant="ghost"
                size="sm"
                icon={<Users className="w-4 h-4" />}
                onClick={() => navigate('/invite')}
              >
                Invite
              </GlassButton>
            )}
            
            <GlassButton
              variant="ghost"
              size="sm"
              icon={<Heart className="w-4 h-4" />}
              onClick={() => navigate('/discover')}
            >
              Connect
            </GlassButton>
          </div>
        </motion.section>
        
        {/* Mode selection - the focus */}
        <main className="flex-1 px-6 pb-8 overflow-y-auto hide-scrollbar">
          {/* Free modes */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-xs font-medium flamo-text-muted mb-3 uppercase tracking-widest">
              Enter a state
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {freeModes.map((mode, index) => (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.35 + index * 0.08,
                  }}
                >
                  <ModeCard
                    mode={mode}
                    onSelect={handleModeSelect}
                    size="md"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
          
          {/* Premium modes */}
          <motion.section
            className="mt-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium flamo-text-muted uppercase tracking-widest">
                Premium states
              </h3>
              {!isPremium && (
                <button
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.75 0.12 45 / 0.1), oklch(0.65 0.15 25 / 0.1))',
                    color: 'oklch(0.80 0.10 45)',
                  }}
                  onClick={() => navigate('/premium')}
                >
                  Unlock
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {premiumModes.map((mode, index) => (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.55 + index * 0.08,
                  }}
                >
                  <ModeCard
                    mode={mode}
                    onSelect={handleModeSelect}
                    onPremiumClick={() => navigate('/premium')}
                    size="md"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
          
          {/* Tagline - the soul of the app */}
          <motion.p
            className="text-center text-sm flamo-text-muted mt-10 mb-4 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            We don't need to talk.
            <br />
            Just join my mode.
          </motion.p>
        </main>
      </div>
    </div>
  );
}
