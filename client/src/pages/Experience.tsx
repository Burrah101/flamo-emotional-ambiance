/**
 * FLaMO Experience Screen
 * The immersive mode experience.
 * 
 * "People don't talk at each other.
 *  They enter the same state."
 * 
 * This is where users simply exist.
 * Minimal UI. Maximum presence.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { useAmbientSync } from '../hooks/useAmbientSync';
import { AmbientGlow } from '../components/AmbientGlow';
import { PresenceIndicator } from '../components/PresenceIndicator';
import { X, Volume2, VolumeX, Share2 } from 'lucide-react';

export default function Experience() {
  const [, navigate] = useLocation();
  const [showControls, setShowControls] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  
  const currentMode = useModeStore(state => state.currentMode);
  const currentModeId = useModeStore(state => state.currentModeId);
  const exitMode = useModeStore(state => state.exitMode);
  const sharedPresence = useModeStore(state => state.sharedPresence);
  
  const features = useUserStore(state => state.features);
  
  const { isListening, amplitude, modulation, toggle: toggleAmbient } = useAmbientSync();
  
  // Redirect if no mode selected
  useEffect(() => {
    if (!currentModeId) {
      navigate('/');
    }
  }, [currentModeId, navigate]);
  
  // Auto-hide controls after inactivity (8 seconds for immersion)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastInteraction > 8000) {
        setShowControls(false);
      }
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [lastInteraction, showControls]);
  
  const handleInteraction = () => {
    setLastInteraction(Date.now());
    setShowControls(true);
  };
  
  const handleExit = () => {
    exitMode();
    navigate('/');
  };
  
  const handleShare = () => {
    if (features.sharedPresence) {
      navigate('/invite');
    }
  };
  
  if (!currentMode) {
    return null;
  }
  
  const { colorProfile, motionProfile, stateVector } = currentMode;
  
  // Calculate breathing duration based on tempo and ambient modulation
  const breathingDuration = (motionProfile.breathingDuration / 1000) / modulation.breathingRate;
  
  // Glow intensity based on ambient sync
  const dynamicGlowIntensity = isListening ? modulation.glowIntensity : 0.5;
  
  return (
    <div 
      className="min-h-screen relative overflow-hidden cursor-none"
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Ambient background with mode colors */}
      <AmbientGlow />
      
      {/* Ambient-responsive background pulse */}
      {isListening && modulation.backgroundPulse > 0.1 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${colorProfile.glow.replace(')', ` / ${modulation.backgroundPulse * 0.15})`)}, transparent 60%)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      )}
      
      {/* Central breathing orb - the heart of the experience */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.03 + (amplitude * 0.05), 1],
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: [0.37, 0, 0.63, 1], // Sinusoidal
          }}
        >
          {/* Outer glow ring - responds to ambient */}
          <motion.div
            className="absolute -inset-24 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colorProfile.glow.replace(')', ` / ${0.15 + dynamicGlowIntensity * 0.2})`)}, transparent 70%)`,
              filter: 'blur(50px)',
            }}
            animate={{
              scale: [1, 1.08 + (amplitude * 0.15), 1],
              opacity: [0.4, 0.7 + (amplitude * 0.3), 0.4],
            }}
            transition={{
              duration: breathingDuration,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
            }}
          />
          
          {/* Middle glow layer */}
          <motion.div
            className="absolute -inset-12 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colorProfile.glow.replace(')', ' / 0.25)')}, transparent 70%)`,
              filter: 'blur(30px)',
            }}
            animate={{
              scale: [1, 1.05 + (amplitude * 0.1), 1],
            }}
            transition={{
              duration: breathingDuration * 0.9,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
            }}
          />
          
          {/* Inner glow core - the presence */}
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colorProfile.glow.replace(')', ' / 0.7)')}, ${colorProfile.base.replace(')', ' / 0.4)')} 70%)`,
              boxShadow: `
                0 0 ${40 + dynamicGlowIntensity * 40}px ${colorProfile.glow.replace(')', ` / ${0.3 + dynamicGlowIntensity * 0.3})`)},
                inset 0 0 30px ${colorProfile.glow.replace(')', ' / 0.25)')}
              `,
            }}
            animate={{
              boxShadow: [
                `0 0 ${40 + dynamicGlowIntensity * 40}px ${colorProfile.glow.replace(')', ` / ${0.3 + dynamicGlowIntensity * 0.3})`)}, inset 0 0 30px ${colorProfile.glow.replace(')', ' / 0.25)')}`,
                `0 0 ${60 + dynamicGlowIntensity * 50 + amplitude * 20}px ${colorProfile.glow.replace(')', ` / ${0.5 + dynamicGlowIntensity * 0.3})`)}, inset 0 0 40px ${colorProfile.glow.replace(')', ' / 0.35)')}`,
                `0 0 ${40 + dynamicGlowIntensity * 40}px ${colorProfile.glow.replace(')', ` / ${0.3 + dynamicGlowIntensity * 0.3})`)}, inset 0 0 30px ${colorProfile.glow.replace(')', ' / 0.25)')}`,
              ],
            }}
            transition={{
              duration: breathingDuration,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
            }}
          />
        </motion.div>
      </div>
      
      {/* Mode name - very subtle, only on hover */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-1/3 inset-x-0 flex flex-col items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.37, 0, 0.63, 1] }}
          >
            <span 
              className="text-4xl mb-3 opacity-60"
              style={{ color: colorProfile.glow }}
            >
              {currentMode.icon}
            </span>
            <h1 
              className="text-lg font-light tracking-widest uppercase opacity-50"
              style={{ color: colorProfile.text }}
            >
              {currentMode.name}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Presence indicator (if sharing) - subtle top indicator */}
      {sharedPresence.isSharing && (
        <motion.div 
          className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PresenceIndicator />
        </motion.div>
      )}
      
      {/* Minimal controls - depth via shadow, no borders */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-8 inset-x-0 z-20 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.37, 0, 0.63, 1] }}
          >
            <div 
              className="flex items-center gap-4 px-6 py-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${colorProfile.gradient[0].replace(')', ' / 0.6)')}, ${colorProfile.gradient[1].replace(')', ' / 0.4)')})`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px ${colorProfile.base.replace(')', ' / 0.3)')}, inset 0 1px 0 ${colorProfile.glow.replace(')', ' / 0.1)')}`,
              }}
            >
              {/* Ambient sync toggle */}
              {features.ambientSync && (
                <motion.button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: isListening 
                      ? colorProfile.glow.replace(')', ' / 0.25)')
                      : 'transparent',
                    boxShadow: isListening 
                      ? `0 0 20px ${colorProfile.glow.replace(')', ' / 0.3)')}`
                      : 'none',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAmbient();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? (
                    <Volume2 className="w-5 h-5" style={{ color: colorProfile.glow }} />
                  ) : (
                    <VolumeX className="w-5 h-5" style={{ color: colorProfile.textMuted }} />
                  )}
                </motion.button>
              )}
              
              {/* Share presence */}
              {features.sharedPresence && (
                <motion.button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: sharedPresence.isSharing 
                      ? colorProfile.glow.replace(')', ' / 0.25)')
                      : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 
                    className="w-5 h-5" 
                    style={{ 
                      color: sharedPresence.isSharing ? colorProfile.glow : colorProfile.textMuted 
                    }} 
                  />
                </motion.button>
              )}
              
              {/* Exit - always available */}
              <motion.button
                className="w-10 h-10 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExit();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" style={{ color: colorProfile.textMuted }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ambient sync indicator - subtle pulse when listening */}
      {isListening && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 + amplitude * 0.6 }}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ 
              background: colorProfile.glow,
              boxShadow: `0 0 ${8 + amplitude * 12}px ${colorProfile.glow}`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
