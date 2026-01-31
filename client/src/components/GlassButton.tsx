/**
 * FLaMO Glass Button Component
 * Glassmorphic button with mode-based styling.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useModeStore } from '../state/modeStore';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  type = 'button',
  style: customStyle,
}) => {
  const currentMode = useModeStore(state => state.currentMode);
  
  const glowColor = currentMode?.colorProfile.glow || 'oklch(0.60 0.10 250)';
  const baseColor = currentMode?.colorProfile.base || 'oklch(0.40 0.08 250)';
  const textColor = currentMode?.colorProfile.text || 'oklch(0.92 0.02 250)';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `${baseColor.replace(')', ' / 0.25)')}`,
          border: `1px solid ${glowColor.replace(')', ' / 0.3)')}`,
          boxShadow: `0 0 20px ${glowColor.replace(')', ' / 0.2)')}`,
        };
      case 'secondary':
        return {
          background: `${baseColor.replace(')', ' / 0.12)')}`,
          border: `1px solid ${glowColor.replace(')', ' / 0.15)')}`,
          boxShadow: `0 0 10px ${glowColor.replace(')', ' / 0.1)')}`,
        };
      case 'ghost':
        return {
          background: 'transparent',
          border: `1px solid ${glowColor.replace(')', ' / 0.1)')}`,
          boxShadow: 'none',
        };
    }
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <motion.button
      type={type}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-xl',
        'backdrop-blur-md transition-colors duration-300',
        sizeClasses[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        ...getVariantStyles(),
        color: textColor,
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
        ...customStyle,
      }}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? {
        scale: 1.02,
        boxShadow: variant !== 'ghost' 
          ? `0 0 30px ${glowColor.replace(')', ' / 0.35)')}`
          : undefined,
      } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: [0.37, 0, 0.63, 1] }}
    >
      {/* Inner glow */}
      {variant === 'primary' && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 15px ${glowColor.replace(')', ' / 0.15)')}`,
          }}
        />
      )}
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : icon && iconPosition === 'left' ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      
      <span className="relative z-10">{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
};

export default GlassButton;
