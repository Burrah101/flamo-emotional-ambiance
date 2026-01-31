/**
 * FLaMO Presence Indicator Component
 * Shows shared presence status.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModeStore } from '../state/modeStore';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  className,
  showLabel = true,
}) => {
  const currentMode = useModeStore(state => state.currentMode);
  const sharedPresence = useModeStore(state => state.sharedPresence);
  
  const glowColor = currentMode?.colorProfile.glow || 'oklch(0.60 0.10 250)';
  const textColor = currentMode?.colorProfile.text || 'oklch(0.92 0.02 250)';
  const textMuted = currentMode?.colorProfile.textMuted || 'oklch(0.65 0.04 250)';
  
  if (!sharedPresence.isSharing) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-full',
          className
        )}
        style={{
          backgroundColor: `${glowColor.replace(')', ' / 0.1)')}`,
          border: `1px solid ${glowColor.replace(')', ' / 0.2)')}`,
        }}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.4, ease: [0.37, 0, 0.63, 1] }}
      >
        {/* Connection status dots */}
        <div className="flex items-center gap-1.5">
          {/* Your presence */}
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: glowColor }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
            }}
          />
          
          {/* Connection line */}
          <motion.div
            className="w-4 h-0.5 rounded-full"
            style={{ 
              backgroundColor: sharedPresence.partnerConnected 
                ? glowColor 
                : textMuted,
              opacity: sharedPresence.partnerConnected ? 0.6 : 0.3,
            }}
            animate={sharedPresence.partnerConnected ? {
              opacity: [0.4, 0.8, 0.4],
            } : undefined}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
            }}
          />
          
          {/* Partner presence */}
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              backgroundColor: sharedPresence.partnerConnected 
                ? glowColor 
                : textMuted,
              opacity: sharedPresence.partnerConnected ? 1 : 0.4,
            }}
            animate={sharedPresence.partnerConnected ? {
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            } : undefined}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: [0.37, 0, 0.63, 1],
              delay: 0.5,
            }}
          />
        </div>
        
        {showLabel && (
          <span 
            className="text-sm font-medium"
            style={{ color: textColor }}
          >
            {sharedPresence.partnerConnected 
              ? 'Together' 
              : 'Waiting...'}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PresenceIndicator;
