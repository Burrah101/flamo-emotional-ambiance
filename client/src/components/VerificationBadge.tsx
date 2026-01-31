/**
 * FLaMO Verification Badge Component
 * Displays a cyan checkmark badge for verified users.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-4 h-4', icon: 'w-2.5 h-2.5' },
  md: { container: 'w-5 h-5', icon: 'w-3 h-3' },
  lg: { container: 'w-6 h-6', icon: 'w-4 h-4' },
};

export function VerificationBadge({ 
  size = 'md', 
  showTooltip = true,
  className = '' 
}: VerificationBadgeProps) {
  const sizes = sizeMap[size];
  
  const badge = (
    <motion.div
      className={`${sizes.container} rounded-full flex items-center justify-center ${className}`}
      style={{
        background: 'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.65 0.12 210))',
        boxShadow: '0 0 8px oklch(0.7 0.15 195 / 0.5)',
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Check className={`${sizes.icon} text-white`} strokeWidth={3} />
    </motion.div>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Verified Profile</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Inline verification badge for use next to names
 */
export function InlineVerificationBadge({ className = '' }: { className?: string }) {
  return (
    <span 
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full ml-1 ${className}`}
      style={{
        background: 'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.65 0.12 210))',
        boxShadow: '0 0 6px oklch(0.7 0.15 195 / 0.4)',
      }}
      title="Verified Profile"
    >
      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
    </span>
  );
}
