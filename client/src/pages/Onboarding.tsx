/**
 * FLaMO Onboarding Tutorial
 * Guided introduction for new users.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useOnboardingStore } from '../state/onboardingStore';
import { useModeStore } from '../state/modeStore';
import { MODE_DEFINITIONS } from '../core/modeDefinitions';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Heart, 
  Users, 
  Mic,
  Share2,
  Crown,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Waves,
  Cloud
} from 'lucide-react';

// Onboarding step definitions
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to FLaMO',
    subtitle: 'Share presence. Not words.',
    description: 'FLaMO helps you shift your mood and environment through immersive, mode-based experiences. Connect with yourself or share moments with someone special.',
    icon: Sparkles,
    color: '#a78bfa',
    gradient: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    id: 'modes-free',
    title: 'Free Modes',
    subtitle: 'Three modes to get you started',
    description: 'Focus for clarity and concentration. Chill for relaxation and ease. Sleep for rest and surrender. Each mode transforms your environment with unique colors, motion, and ambiance.',
    icon: Zap,
    color: '#34d399',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    modes: ['focus', 'chill', 'sleep'],
  },
  {
    id: 'modes-premium',
    title: 'Premium Modes',
    subtitle: 'Deeper emotional experiences',
    description: 'Romance for intimate moments with rose-gold warmth. Bond for connection with amber-teal stability. Afterglow for gentle lingering with orchid softness.',
    icon: Crown,
    color: '#f472b6',
    gradient: 'from-pink-500/20 to-rose-500/20',
    modes: ['romance', 'bond', 'afterglow'],
    isPremium: true,
  },
  {
    id: 'ambient',
    title: 'Ambient Sync',
    subtitle: 'Your environment, visualized',
    description: 'Enable microphone access to let FLaMO respond to sounds around you. The visuals pulse and breathe with your environment. No audio is ever recorded or stored.',
    icon: Mic,
    color: '#60a5fa',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    feature: 'ambient',
  },
  {
    id: 'presence',
    title: 'Shared Presence',
    subtitle: 'Be together, silently',
    description: 'Invite someone to join your mode. No chat, no messages—just synchronized presence. Perfect for long-distance moments or quiet togetherness.',
    icon: Share2,
    color: '#fbbf24',
    gradient: 'from-amber-500/20 to-orange-500/20',
    feature: 'presence',
  },
  {
    id: 'start',
    title: 'Ready to Begin',
    subtitle: 'Choose your first mode',
    description: 'Your journey starts now. Select a mode that matches how you feel, or let our AI suggest one based on your time and context.',
    icon: Heart,
    color: '#f87171',
    gradient: 'from-red-500/20 to-pink-500/20',
  },
];

// Mode preview card component
function ModePreviewCard({ modeId }: { modeId: string }) {
  const mode = MODE_DEFINITIONS[modeId];
  if (!mode) return null;
  
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ 
        background: `linear-gradient(135deg, ${mode.colorProfile.glow}15, ${mode.colorProfile.glow}05)`,
        border: `1px solid ${mode.colorProfile.glow}30`,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <span 
        className="text-2xl"
        style={{ filter: `drop-shadow(0 0 8px ${mode.colorProfile.glow})` }}
      >
        {mode.icon}
      </span>
      <div>
        <p className="font-medium text-white text-sm">{mode.name}</p>
        <p className="text-xs text-white/60">{mode.emotionalIntent}</p>
      </div>
    </motion.div>
  );
}

// Progress indicator component
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className="h-1.5 rounded-full"
          style={{
            width: index === current ? 24 : 8,
            background: index === current 
              ? 'rgba(255, 255, 255, 0.9)' 
              : index < current 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(255, 255, 255, 0.2)',
          }}
          animate={{
            width: index === current ? 24 : 8,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { currentStep, nextStep, prevStep, completeOnboarding, totalSteps } = useOnboardingStore();
  const enterMode = useModeStore(state => state.enterMode);
  
  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;
  
  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      completeOnboarding();
      navigate('/');
    } else {
      nextStep();
    }
  };
  
  const handleSkip = () => {
    completeOnboarding();
    navigate('/');
  };
  
  const handleSelectMode = (modeId: string) => {
    enterMode(modeId);
    completeOnboarding();
    navigate('/experience');
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12]">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-50`}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute w-64 h-64 rounded-full blur-3xl"
          style={{ background: `${step.color}20` }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%'],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `${step.color}15` }}
          animate={{
            x: ['10%', '-10%', '10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 flex items-center justify-between">
          <ProgressIndicator current={currentStep} total={totalSteps} />
          
          <motion.button
            className="text-white/50 text-sm hover:text-white/80 transition-colors"
            onClick={handleSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center"
            >
              {/* Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${step.color}30, ${step.color}10)`,
                  boxShadow: `0 0 40px ${step.color}30`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 40px ${step.color}30`,
                    `0 0 60px ${step.color}40`,
                    `0 0 40px ${step.color}30`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <StepIcon 
                  className="w-10 h-10" 
                  style={{ color: step.color }}
                />
              </motion.div>
              
              {/* Title */}
              <h1 className="text-2xl font-semibold text-white mb-2">
                {step.title}
              </h1>
              <p 
                className="text-lg mb-4"
                style={{ color: step.color }}
              >
                {step.subtitle}
              </p>
              
              {/* Description */}
              <p className="text-white/70 leading-relaxed mb-8">
                {step.description}
              </p>
              
              {/* Mode previews for mode steps */}
              {step.modes && (
                <div className="space-y-3 mb-8">
                  {step.modes.map((modeId) => (
                    <ModePreviewCard key={modeId} modeId={modeId} />
                  ))}
                  {step.isPremium && (
                    <p className="text-xs text-white/40 mt-2">
                      Premium modes require subscription
                    </p>
                  )}
                </div>
              )}
              
              {/* Feature highlights */}
              {step.feature === 'ambient' && (
                <GlassCard className="p-4 mb-8 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Waves className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Privacy First</p>
                      <p className="text-xs text-white/60 mt-1">
                        Audio is processed locally in real-time. Nothing is recorded, stored, or transmitted.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {step.feature === 'presence' && (
                <GlassCard className="p-4 mb-8 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Silent Connection</p>
                      <p className="text-xs text-white/60 mt-1">
                        Share a link, enter the same mode together. No chat needed—just presence.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {/* Final step - mode selection */}
              {step.id === 'start' && (
                <div className="space-y-3 mb-8">
                  <p className="text-sm text-white/50 mb-4">Quick start with a free mode:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['focus', 'chill', 'sleep'].map((modeId) => {
                      const mode = MODE_DEFINITIONS[modeId];
                      return (
                        <motion.button
                          key={modeId}
                          className="p-4 rounded-xl text-center"
                          style={{ 
                            background: `linear-gradient(135deg, ${mode.colorProfile.glow}20, ${mode.colorProfile.glow}05)`,
                            border: `1px solid ${mode.colorProfile.glow}30`,
                          }}
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: `0 0 20px ${mode.colorProfile.glow}30`,
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectMode(modeId)}
                        >
                          <span className="text-2xl block mb-1">{mode.icon}</span>
                          <span className="text-xs text-white/80">{mode.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Navigation */}
        <footer className="px-6 pb-8">
          <div className="flex items-center justify-between gap-4">
            {currentStep > 0 ? (
              <GlassButton
                variant="secondary"
                onClick={prevStep}
                icon={<ChevronLeft className="w-5 h-5" />}
              >
                Back
              </GlassButton>
            ) : (
              <div />
            )}
            
            <GlassButton
              variant="primary"
              onClick={handleNext}
              icon={<ChevronRight className="w-5 h-5" />}
              iconPosition="right"
              style={{
                background: `linear-gradient(135deg, ${step.color}40, ${step.color}20)`,
                borderColor: `${step.color}50`,
              }}
            >
              {currentStep === totalSteps - 1 ? 'Get Started' : 'Continue'}
            </GlassButton>
          </div>
        </footer>
      </div>
    </div>
  );
}
