/**
 * FLaMO Glass Card Component
 * Glassmorphic card with mode-based styling.
 * 
 * Motion Rules:
 * - Idle: slow breathing pulse
 * - Hover: parallax depth effect + subtle gradient
 * - Active: glow + tempo sync
 * - Never flashy, never sharp
 * 
 * Visual Rules:
 * - No borders - depth via shadow + glow only
 * - Subtle animated gradient only on hover/active
 * - 20px border radius
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useModeStore } from '../state/modeStore';
import { GlassVariant, getGlassClasses } from '../modes/ModeGlass';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  className?: string;
  breathing?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
  as?: 'div' | 'button' | 'article' | 'section';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'card',
  className,
  breathing = false,
  glowOnHover = true,
  onClick,
  as = 'div',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const currentMode = useModeStore(state => state.currentMode);
  const ambient = useModeStore(state => state.ambient);
  const glowIntensity = useModeStore(state => state.glowIntensity);
  
  // Get colors from current mode or defaults
  const glowColor = currentMode?.colorProfile.glow || 'oklch(0.60 0.10 250)';
  const baseColor = currentMode?.colorProfile.base || 'oklch(0.20 0.02 250)';
  const gradientColors = currentMode?.colorProfile.gradient || ['oklch(0.10 0.02 250)', 'oklch(0.12 0.03 260)'];
  const blur = currentMode?.ambientProfile.blur || 20;
  
  // Dynamic glow based on ambient amplitude
  const dynamicGlowRadius = 20 + (ambient.amplitude * 20);
  const glowOpacity = 0.15 + (glowIntensity * 0.25) + (ambient.amplitude * 0.15);
  
  // Breathing animation duration
  const breathingDuration = currentMode?.motionProfile.breathingDuration || 7000;
  
  const Component = motion[as] as typeof motion.div;
  
  // Depth shadow - no borders, depth via shadow only
  const depthShadow = `
    0 4px 24px ${baseColor.replace(')', ' / 0.4)')},
    0 0 ${dynamicGlowRadius}px ${glowColor.replace(')', ` / ${glowOpacity})`)}
  `;
  
  const hoverShadow = `
    0 8px 40px ${baseColor.replace(')', ' / 0.5)')},
    0 0 ${dynamicGlowRadius * 1.5}px ${glowColor.replace(')', ` / ${glowOpacity * 1.4})`)}
  `;
  
  return (
    <Component
      className={cn(
        getGlassClasses(variant),
        'relative overflow-hidden rounded-[20px]',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        // No border - depth via shadow only
        border: 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        // Idle breathing
        scale: breathing ? [1, 1.008, 1] : 1,
        opacity: breathing ? [0.95, 1, 0.95] : 1,
        boxShadow: isHovered && glowOnHover ? hoverShadow : depthShadow,
      }}
      transition={{
        scale: breathing ? {
          duration: breathingDuration / 1000,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1], // Sinusoidal
        } : { duration: 0.3 },
        opacity: breathing ? {
          duration: breathingDuration / 1000,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1],
        } : { duration: 0.3 },
        boxShadow: { duration: 0.4, ease: [0.37, 0, 0.63, 1] },
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Background gradient - subtle, animated on hover */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0].replace(')', ' / 0.7)')}, ${gradientColors[1].replace(')', ' / 0.5)')})`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Subtle top highlight - glass effect */}
      <div 
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColor.replace(')', ' / 0.15)')}, transparent)`,
        }}
      />
      
      {/* Inner glow - subtle depth */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow: `inset 0 0 ${dynamicGlowRadius / 2}px ${glowColor.replace(')', ` / ${glowOpacity * 0.3})`)}`,
        }}
        animate={{
          opacity: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

export default GlassCard;
