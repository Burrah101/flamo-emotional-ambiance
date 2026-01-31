/**
 * FLaMO Feature Flags
 * Premium gating and feature toggles.
 * Nothing here imports React.
 */

export interface FeatureFlags {
  // Free features
  freeModes: boolean;
  visualPulse: boolean;
  offlinePWA: boolean;
  modeMemory: boolean;
  
  // Premium features
  premiumModes: boolean;
  sharedPresence: boolean;
  ambientSync: boolean;
  modeScheduling: boolean;
  customGlowIntensity: boolean;
  
  // One-time features
  oneTimeMoments: boolean;
  
  // Experimental
  voiceActivation: boolean;
  llmSuggestions: boolean;
}

export const DEFAULT_FREE_FLAGS: FeatureFlags = {
  freeModes: true,
  visualPulse: true,
  offlinePWA: true,
  modeMemory: true,
  
  premiumModes: false,
  sharedPresence: false,
  ambientSync: false,
  modeScheduling: false,
  customGlowIntensity: false,
  
  oneTimeMoments: true, // Can purchase but not use until bought
  
  voiceActivation: true,
  llmSuggestions: true,
};

export const PREMIUM_FLAGS: FeatureFlags = {
  freeModes: true,
  visualPulse: true,
  offlinePWA: true,
  modeMemory: true,
  
  premiumModes: true,
  sharedPresence: true,
  ambientSync: true,
  modeScheduling: true,
  customGlowIntensity: true,
  
  oneTimeMoments: true,
  
  voiceActivation: true,
  llmSuggestions: true,
};

export const getFeatureFlags = (isPremium: boolean): FeatureFlags => {
  return isPremium ? PREMIUM_FLAGS : DEFAULT_FREE_FLAGS;
};

export const canAccessFeature = (
  feature: keyof FeatureFlags,
  isPremium: boolean
): boolean => {
  const flags = getFeatureFlags(isPremium);
  return flags[feature];
};
