/**
 * FLaMO Mode Card Component
 * Card for displaying and selecting a mode.
 * 
 * "Each mode is a state vector, not a theme."
 * 
 * Visual Rules:
 * - No borders - depth via shadow + glow only
 * - Idle: slow breathing pulse
 * - Hover: parallax depth + subtle gradient shift
 * - Never flashy, never sharp
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ModeDefinition } from '../core/modeDefinitions';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeCardProps {
  mode: ModeDefinition;
  onSelect?: (mode: ModeDefinition) => void;
  onPremiumClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  onSelect,
  onPremiumClick,
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const currentModeId = useModeStore(state => state.currentModeId);
  const isPremium = useUserStore(state => state.isPremium);
  
  const isActive = currentModeId === mode.id;
  const isLocked = mode.accessLevel === 'premium' && !isPremium;
  
  const sizeClasses = {
    sm: 'p-3 min-h-[90px]',
    md: 'p-4 min-h-[120px]',
    lg: 'p-5 min-h-[160px]',
  };
  
  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  const handleClick = () => {
    if (isLocked) {
      onPremiumClick?.();
    } else {
      onSelect?.(mode);
    }
  };
  
  // Depth shadows - no borders
  const baseShadow = `
    0 4px 20px ${mode.colorProfile.base.replace(')', ' / 0.4)')},
    0 0 24px ${mode.colorProfile.glow.replace(')', ' / 0.15)')}
  `;
  
  const hoverShadow = `
    0 8px 32px ${mode.colorProfile.base.replace(')', ' / 0.5)')},
    0 0 40px ${mode.colorProfile.glow.replace(')', ' / 0.25)')}
  `;
  
  const activeShadow = `
    0 8px 40px ${mode.colorProfile.base.replace(')', ' / 0.5)')},
    0 0 50px ${mode.colorProfile.glow.replace(')', ' / 0.35)')}
  `;
  
  return (
    <motion.button
      className={cn(
        'relative w-full text-left rounded-[20px] overflow-hidden',
        sizeClasses[size],
        isLocked && 'opacity-75'
      )}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: 'none', // No borders - depth via shadow only
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        boxShadow: isActive ? activeShadow : (isHovered ? hoverShadow : baseShadow),
        y: isHovered ? -2 : 0, // Subtle lift on hover
      }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.37, 0, 0.63, 1] // Sinusoidal
      }}
    >
      {/* Background gradient - subtle shift on hover */}
      <motion.div 
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `linear-gradient(135deg, ${mode.colorProfile.gradient[0]}, ${mode.colorProfile.gradient[1]})`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0.9,
        }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Glow overlay - responds to hover */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${mode.colorProfile.glow.replace(')', ' / 0.2)')}, transparent 60%)`,
        }}
        animate={{
          opacity: isHovered ? 1.3 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Top highlight - glass effect */}
      <div 
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${mode.colorProfile.glow.replace(')', ' / 0.2)')}, transparent)`,
        }}
      />
      
      {/* Inner glow */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow: `inset 0 0 24px ${mode.colorProfile.glow.replace(')', ' / 0.08)')}`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between">
          {/* Mode icon */}
          <motion.span 
            className={cn(iconSizes[size], 'leading-none')}
            style={{ color: mode.colorProfile.glow }}
            animate={{
              scale: isHovered && !isLocked ? 1.1 : 1,
              textShadow: isHovered 
                ? `0 0 20px ${mode.colorProfile.glow}`
                : `0 0 10px ${mode.colorProfile.glow.replace(')', ' / 0.5)')}`,
            }}
            transition={{ duration: 0.3 }}
          >
            {mode.icon}
          </motion.span>
          
          {/* Lock indicator */}
          {isLocked && (
            <div 
              className="p-1 rounded-full"
              style={{ 
                backgroundColor: mode.colorProfile.base.replace(')', ' / 0.3)'),
              }}
            >
              <Lock 
                className="w-3.5 h-3.5" 
                style={{ color: mode.colorProfile.textMuted }}
              />
            </div>
          )}
          
          {/* Active indicator - breathing dot */}
          {isActive && !isLocked && (
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: mode.colorProfile.glow,
                boxShadow: `0 0 8px ${mode.colorProfile.glow}`,
              }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: [0.37, 0, 0.63, 1],
              }}
            />
          )}
        </div>
        
        {/* Mode info */}
        <div className="mt-auto">
          <h3 
            className="font-medium text-base"
            style={{ color: mode.colorProfile.text }}
          >
            {mode.name}
          </h3>
          <p 
            className="text-xs mt-0.5 opacity-70 line-clamp-1"
            style={{ color: mode.colorProfile.textMuted }}
          >
            {mode.emotionalIntent}
          </p>
        </div>
        
        {/* Premium badge - subtle */}
        {isLocked && (
          <div 
            className="absolute bottom-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ 
              backgroundColor: mode.colorProfile.glow.replace(')', ' / 0.15)'),
              color: mode.colorProfile.text,
            }}
          >
            Premium
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default ModeCard;
