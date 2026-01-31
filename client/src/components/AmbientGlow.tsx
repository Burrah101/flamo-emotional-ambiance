/**
 * FLaMO Ambient Glow Component
 * Background glow that responds to mode and ambient state.
 * 
 * "Two people in the same room:
 *  Phones glow together
 *  Tempo subtly matches
 *  Presence without speech"
 * 
 * Responds to:
 * - Mode color profile
 * - RMS energy from ambient sync
 * - State vector tempo
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useModeStore } from '../state/modeStore';
import { useAmbientSync } from '../hooks/useAmbientSync';
import { cn } from '@/lib/utils';

interface AmbientGlowProps {
  className?: string;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ className }) => {
  const currentMode = useModeStore(state => state.currentMode);
  const glowIntensity = useModeStore(state => state.glowIntensity);
  
  const { isListening, amplitude, modulation } = useAmbientSync();
  
  // Get colors from current mode or defaults
  const glowColor = currentMode?.colorProfile.glow || 'oklch(0.60 0.10 250)';
  const baseColor = currentMode?.colorProfile.base || 'oklch(0.40 0.08 250)';
  const gradient = currentMode?.colorProfile.gradient || ['oklch(0.08 0.02 250)', 'oklch(0.05 0.02 280)'];
  
  // Animation duration from mode tempo (state vector)
  const stateVector = currentMode?.stateVector;
  const tempo = stateVector?.tempo || 60;
  // Convert tempo to breathing duration: 4 beats per breath cycle
  const breathingDuration = (60000 / tempo) * 4 / 1000; // in seconds
  
  // Apply ambient modulation to breathing rate
  const modulatedBreathingDuration = breathingDuration / modulation.breathingRate;
  
  // Dynamic values based on ambient amplitude and modulation
  const dynamicScale = 1 + (amplitude * 0.12);
  const dynamicOpacity = 0.3 + (glowIntensity * 0.25) + (modulation.glowIntensity * 0.2);
  
  return (
    <div className={cn('fixed inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Base gradient background - deep, dark */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      />
      
      {/* Primary glow orb - main presence */}
      <motion.div
        className="absolute w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] rounded-full"
        style={{
          left: '15%',
          top: '25%',
          background: `radial-gradient(circle, ${glowColor.replace(')', ` / ${dynamicOpacity * 0.5})`)}, transparent 65%)`,
          filter: 'blur(80px)',
        }}
        animate={{
          scale: [1, dynamicScale, 1],
          x: [0, 25, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: modulatedBreathingDuration,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1], // Sinusoidal
        }}
      />
      
      {/* Secondary glow orb - depth layer */}
      <motion.div
        className="absolute w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full"
        style={{
          right: '5%',
          bottom: '15%',
          background: `radial-gradient(circle, ${baseColor.replace(')', ` / ${dynamicOpacity * 0.35})`)}, transparent 65%)`,
          filter: 'blur(100px)',
        }}
        animate={{
          scale: [1, dynamicScale * 0.85, 1],
          x: [0, -15, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: modulatedBreathingDuration * 1.2,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1],
        }}
      />
      
      {/* Tertiary accent glow - subtle movement */}
      <motion.div
        className="absolute w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] rounded-full"
        style={{
          left: '55%',
          top: '8%',
          background: `radial-gradient(circle, ${glowColor.replace(')', ` / ${dynamicOpacity * 0.25})`)}, transparent 65%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [0.9, 1.05, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: modulatedBreathingDuration * 0.75,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1],
        }}
      />
      
      {/* Ambient-reactive pulse - responds to RMS energy */}
      {isListening && modulation.backgroundPulse > 0.05 && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${glowColor.replace(')', ` / ${modulation.backgroundPulse * 0.2})`)}, transparent 45%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: modulation.backgroundPulse,
            scale: [1, 1 + modulation.backgroundPulse * 0.1, 1],
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut',
          }}
        />
      )}
      
      {/* Subtle vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      
      {/* Noise texture overlay for organic feel */}
      <div 
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AmbientGlow;
