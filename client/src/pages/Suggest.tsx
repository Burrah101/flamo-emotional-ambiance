/**
 * FLaMO Suggest Screen
 * LLM-powered mode suggestions based on context.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { MODE_DEFINITIONS, ModeDefinition } from '../core/modeDefinitions';
import { AmbientGlow } from '../components/AmbientGlow';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { ModeCard } from '../components/ModeCard';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Sparkles,
  Clock,
  History,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function Suggest() {
  const [, navigate] = useLocation();
  const [suggestion, setSuggestion] = useState<ModeDefinition | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const modeHistory = useModeStore(state => state.modeHistory);
  const enterMode = useModeStore(state => state.enterMode);
  
  const isPremium = useUserStore(state => state.isPremium);
  
  // Generate suggestion on mount
  useEffect(() => {
    generateSuggestion();
  }, []);
  
  const generateSuggestion = async () => {
    setIsLoading(true);
    
    try {
      // Get current time context
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Analyze time of day
      let timeContext = '';
      if (hour >= 5 && hour < 9) {
        timeContext = 'early morning';
      } else if (hour >= 9 && hour < 12) {
        timeContext = 'morning';
      } else if (hour >= 12 && hour < 14) {
        timeContext = 'midday';
      } else if (hour >= 14 && hour < 17) {
        timeContext = 'afternoon';
      } else if (hour >= 17 && hour < 20) {
        timeContext = 'evening';
      } else if (hour >= 20 && hour < 23) {
        timeContext = 'night';
      } else {
        timeContext = 'late night';
      }
      
      // Analyze recent mode history
      const recentModes = modeHistory.slice(-5);
      const modeFrequency: Record<string, number> = {};
      recentModes.forEach(entry => {
        modeFrequency[entry.modeId] = (modeFrequency[entry.modeId] || 0) + 1;
      });
      
      // Simple suggestion logic (in production, this would call LLM)
      let suggestedModeId: string;
      let suggestionReason: string;
      
      // Time-based suggestions
      if (hour >= 22 || hour < 5) {
        suggestedModeId = 'sleep';
        suggestionReason = `It's ${timeContext}. Sleep mode can help you wind down and prepare for rest.`;
      } else if (hour >= 9 && hour < 17 && !isWeekend) {
        suggestedModeId = 'focus';
        suggestionReason = `It's ${timeContext} on a weekday. Focus mode can help you stay productive.`;
      } else if (hour >= 17 && hour < 20) {
        suggestedModeId = 'chill';
        suggestionReason = `It's ${timeContext}. Chill mode is perfect for unwinding after the day.`;
      } else if (isWeekend && hour >= 19) {
        if (isPremium) {
          suggestedModeId = 'romance';
          suggestionReason = `It's ${isWeekend ? 'weekend' : ''} ${timeContext}. Romance mode sets the perfect atmosphere.`;
        } else {
          suggestedModeId = 'chill';
          suggestionReason = `It's ${isWeekend ? 'weekend' : ''} ${timeContext}. Time to relax and enjoy.`;
        }
      } else {
        suggestedModeId = 'chill';
        suggestionReason = `Based on the time and your history, Chill mode feels right for now.`;
      }
      
      // Check if suggested mode is accessible
      const mode = MODE_DEFINITIONS[suggestedModeId];
      if (mode.accessLevel === 'premium' && !isPremium) {
        suggestedModeId = 'chill';
        suggestionReason = 'Chill mode is a great choice for relaxation.';
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuggestion(MODE_DEFINITIONS[suggestedModeId]);
      setReason(suggestionReason);
      
    } catch (error) {
      toast.error('Failed to generate suggestion');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEnterMode = () => {
    if (suggestion) {
      enterMode(suggestion.id);
      navigate('/experience');
    }
  };
  
  // Get time of day for display
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };
  
  return (
    <div className="min-h-screen relative">
      <AmbientGlow />
      
      <div className="relative z-10 min-h-screen safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-full flamo-glass-subtle flex items-center justify-center"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 flamo-text" />
            </motion.button>
            <div>
              <h1 className="text-xl font-medium flamo-text">Suggestions</h1>
              <p className="text-sm flamo-text-muted">Personalized for you</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8">
          {/* Context cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 flamo-text-muted" />
                <span className="text-xs flamo-text-muted">Time</span>
              </div>
              <p className="text-sm flamo-text capitalize">{getTimeOfDay()}</p>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 flamo-text-muted" />
                <span className="text-xs flamo-text-muted">History</span>
              </div>
              <p className="text-sm flamo-text">{modeHistory.length} sessions</p>
            </GlassCard>
          </motion.div>
          
          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12"
              >
                <motion.div
                  className="w-16 h-16 rounded-full flamo-glass flex items-center justify-center mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-8 h-8 flamo-text" />
                </motion.div>
                <p className="flamo-text-muted">Analyzing your context...</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Suggestion */}
          <AnimatePresence>
            {!isLoading && suggestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Suggestion header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: suggestion.colorProfile.glow }} />
                    <h2 className="font-medium flamo-text">Recommended</h2>
                  </div>
                  <motion.button
                    className="p-2 rounded-full flamo-glass-subtle"
                    onClick={generateSuggestion}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="w-4 h-4 flamo-text-muted" />
                  </motion.button>
                </div>
                
                {/* Mode card */}
                <ModeCard
                  mode={suggestion}
                  onSelect={handleEnterMode}
                  size="lg"
                />
                
                {/* Reason */}
                <GlassCard className="p-4 mt-4">
                  <p className="text-sm flamo-text-muted">{reason}</p>
                </GlassCard>
                
                {/* Enter button */}
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleEnterMode}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  Enter {suggestion.name}
                </GlassButton>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Recent history */}
          {modeHistory.length > 0 && !isLoading && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h3 className="text-sm font-medium flamo-text-muted mb-3 uppercase tracking-wider">
                Recent Modes
              </h3>
              <div className="space-y-2">
                {modeHistory.slice(-3).reverse().map((entry, index) => {
                  const mode = MODE_DEFINITIONS[entry.modeId];
                  if (!mode) return null;
                  
                  const duration = Math.round(entry.duration / 60000);
                  const timeAgo = Math.round((Date.now() - entry.timestamp) / 60000);
                  
                  return (
                    <GlassCard key={`${entry.modeId}-${entry.timestamp}`} className="p-3">
                      <div className="flex items-center gap-3">
                        <span style={{ color: mode.colorProfile.glow }}>{mode.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm flamo-text">{mode.name}</p>
                          <p className="text-xs flamo-text-muted">
                            {duration > 0 ? `${duration}m` : '<1m'} · {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}
