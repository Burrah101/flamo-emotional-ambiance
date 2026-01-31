/**
 * FLaMO Mode Motion
 * Breathing curves and animation values.
 * Motion ≠ animation. Motion = breathing.
 */

import { ModeDefinition, MotionProfile } from '../core/modeDefinitions';

export interface MotionValues {
  // Breathing animation
  breathingDuration: number;
  breathingEasing: string;
  breathingScale: { min: number; max: number };
  
  // Glow pulse
  glowPulseDuration: number;
  glowPulseIntensity: { min: number; max: number };
  
  // Blur breathing
  blurBreathingEnabled: boolean;
  blurRange: { min: number; max: number };
  
  // Opacity breathing
  opacityRange: { min: number; max: number };
}

// Sinusoidal easing approximation
export const SINUSOIDAL_EASING = 'cubic-bezier(0.37, 0, 0.63, 1)';

// Pattern-specific motion configurations
const MOTION_PATTERNS: Record<MotionProfile['pattern'], Partial<MotionValues>> = {
  tight: {
    breathingScale: { min: 0.98, max: 1.02 },
    glowPulseIntensity: { min: 0.7, max: 0.9 },
    blurBreathingEnabled: false,
    blurRange: { min: 18, max: 18 },
    opacityRange: { min: 0.95, max: 1 },
  },
  slow: {
    breathingScale: { min: 0.96, max: 1.04 },
    glowPulseIntensity: { min: 0.5, max: 0.8 },
    blurBreathingEnabled: true,
    blurRange: { min: 20, max: 24 },
    opacityRange: { min: 0.9, max: 1 },
  },
  still: {
    breathingScale: { min: 0.99, max: 1.01 },
    glowPulseIntensity: { min: 0.4, max: 0.5 },
    blurBreathingEnabled: false,
    blurRange: { min: 22, max: 22 },
    opacityRange: { min: 0.98, max: 1 },
  },
  responsive: {
    breathingScale: { min: 0.95, max: 1.05 },
    glowPulseIntensity: { min: 0.6, max: 1 },
    blurBreathingEnabled: true,
    blurRange: { min: 18, max: 26 },
    opacityRange: { min: 0.85, max: 1 },
  },
  synchronized: {
    breathingScale: { min: 0.97, max: 1.03 },
    glowPulseIntensity: { min: 0.6, max: 0.9 },
    blurBreathingEnabled: true,
    blurRange: { min: 18, max: 24 },
    opacityRange: { min: 0.9, max: 1 },
  },
  decay: {
    breathingScale: { min: 0.98, max: 1.02 },
    glowPulseIntensity: { min: 0.4, max: 0.7 },
    blurBreathingEnabled: true,
    blurRange: { min: 20, max: 26 },
    opacityRange: { min: 0.88, max: 1 },
  },
};

// Intensity multipliers
const INTENSITY_MULTIPLIERS: Record<MotionProfile['intensity'], number> = {
  minimal: 0.3,
  low: 0.5,
  medium: 0.75,
  high: 1,
};

export const generateMotionValues = (mode: ModeDefinition): MotionValues => {
  const { motionProfile } = mode;
  const patternConfig = MOTION_PATTERNS[motionProfile.pattern];
  const intensityMultiplier = INTENSITY_MULTIPLIERS[motionProfile.intensity];
  
  // Scale the motion ranges based on intensity
  const scaleRange = (range: { min: number; max: number }) => {
    const center = (range.min + range.max) / 2;
    const halfRange = (range.max - range.min) / 2;
    const scaledHalfRange = halfRange * intensityMultiplier;
    return {
      min: center - scaledHalfRange,
      max: center + scaledHalfRange,
    };
  };
  
  return {
    breathingDuration: motionProfile.breathingDuration,
    breathingEasing: SINUSOIDAL_EASING,
    breathingScale: scaleRange(patternConfig.breathingScale!),
    glowPulseDuration: motionProfile.breathingDuration * 1.2,
    glowPulseIntensity: scaleRange(patternConfig.glowPulseIntensity!),
    blurBreathingEnabled: patternConfig.blurBreathingEnabled!,
    blurRange: patternConfig.blurBreathingEnabled 
      ? scaleRange(patternConfig.blurRange!)
      : patternConfig.blurRange!,
    opacityRange: scaleRange(patternConfig.opacityRange!),
  };
};

// CSS keyframes generator
export const generateBreathingKeyframes = (motionValues: MotionValues): string => {
  const { breathingScale, glowPulseIntensity, opacityRange } = motionValues;
  
  return `
    @keyframes flamo-breathing {
      0%, 100% {
        transform: scale(${breathingScale.min});
        opacity: ${opacityRange.min};
      }
      50% {
        transform: scale(${breathingScale.max});
        opacity: ${opacityRange.max};
      }
    }
    
    @keyframes flamo-glow-pulse {
      0%, 100% {
        filter: brightness(${glowPulseIntensity.min});
      }
      50% {
        filter: brightness(${glowPulseIntensity.max});
      }
    }
    
    @keyframes flamo-float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-4px);
      }
    }
  `;
};

// Default motion for no active mode
export const DEFAULT_MOTION_VALUES: MotionValues = {
  breathingDuration: 7000,
  breathingEasing: SINUSOIDAL_EASING,
  breathingScale: { min: 0.98, max: 1.02 },
  glowPulseDuration: 8400,
  glowPulseIntensity: { min: 0.6, max: 0.8 },
  blurBreathingEnabled: false,
  blurRange: { min: 20, max: 20 },
  opacityRange: { min: 0.95, max: 1 },
};
