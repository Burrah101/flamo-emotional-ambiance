/**
 * FLaMO Configuration - Single Source of Truth
 * "People share presence without performance."
 * 
 * This file contains the app doctrine. Nothing here imports React.
 * If a feature increases cognitive load, remove it.
 * If a feature breaks calm, reject it.
 */

export const FLAMO_CONFIG = {
  appName: 'FLaMO',
  tagline: 'Shared Presence',
  philosophy: 'People share presence without performance.',
  
  // Visual constants
  glass: {
    blur: { min: 18, max: 22, default: 20 },
    transparency: { min: 0.06, max: 0.10, default: 0.08 },
    borderRadius: 20,
    borderWidth: 1,
  },
  
  // Motion constants (sinusoidal breathing)
  motion: {
    breathingDuration: { min: 6000, max: 8000, default: 7000 },
    easing: 'cubic-bezier(0.37, 0, 0.63, 1)', // Sinusoidal approximation
  },
  
  // Glow constants
  glow: {
    radiusMin: 24,
    radiusMax: 40,
    intensityMin: 0.3,
    intensityMax: 0.8,
  },
  
  // Pricing
  pricing: {
    premium: {
      monthly: 6.99,
      currency: 'USD',
    },
    oneTimeMoments: {
      min: 1.99,
      max: 4.99,
      currency: 'USD',
    },
  },
  
  // Privacy principles
  privacy: {
    noChat: true,
    noTracking: true,
    noContentStorage: true,
    optionalPermissionsOnly: true,
    micAmplitudeOnly: true,
    noAudioRecording: true,
  },
} as const;

export type FlamoConfig = typeof FLAMO_CONFIG;
