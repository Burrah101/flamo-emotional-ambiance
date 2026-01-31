/**
 * FLaMO Mode Definitions
 * Mode metadata only - no logic here.
 * Routes never own emotion. Emotion owns routes.
 * 
 * Each mode is a state vector, not a theme.
 * "Shared Presence. Not Words."
 */

export type AccessLevel = 'free' | 'premium' | 'oneTime';

/**
 * State Vector - the emotional/energetic signature of a mode
 * This is what makes FLaMO different from a "theme picker"
 */
export interface StateVector {
  energy: number;      // 0-1: Low energy (rest) to high energy (alert)
  tempo: number;       // BPM equivalent: breathing/pulse rate
  intimacy: number;    // 0-1: Solo to deeply connected
  attention: number;   // 0-1: Diffuse to focused
  openness: number;    // 0-1: Closed/protected to open/vulnerable
}

export interface ColorProfile {
  base: string;
  glow: string;
  gradient: string[];
  text: string;
  textMuted: string;
}

export interface MotionProfile {
  breathingDuration: number; // ms
  intensity: 'minimal' | 'low' | 'medium' | 'high';
  pattern: 'tight' | 'slow' | 'still' | 'responsive' | 'synchronized' | 'decay';
}

export interface AmbientProfile {
  blur: number; // px (18-24px per spec)
  glowRadius: number; // px
  pulseEnabled: boolean;
  syncEnabled: boolean;
}

export interface ModeDefinition {
  id: string;
  name: string;
  emotionalIntent: string;
  description: string;
  psychologicalHook: string; // Why people use this mode
  accessLevel: AccessLevel;
  stateVector: StateVector;
  colorProfile: ColorProfile;
  motionProfile: MotionProfile;
  ambientProfile: AmbientProfile;
  icon: string;
}

export const MODE_DEFINITIONS: Record<string, ModeDefinition> = {
  /**
   * FOCUS - Cognitive clarity
   * Color: Emerald/Teal (cognitive clarity association)
   * Hook: Productivity identity
   */
  focus: {
    id: 'focus',
    name: 'Focus',
    emotionalIntent: 'Cognitive clarity',
    description: 'Enter a state of deep focus.',
    psychologicalHook: 'Productivity identity',
    accessLevel: 'free',
    stateVector: {
      energy: 0.7,
      tempo: 72,      // Calm but alert heartbeat
      intimacy: 0.1,  // Solo activity
      attention: 0.95, // Maximum focus
      openness: 0.3,  // Protected, inward
    },
    colorProfile: {
      base: 'oklch(0.72 0.18 165)',      // Emerald/Teal
      glow: 'oklch(0.82 0.12 170)',      // Soft teal glow
      gradient: ['oklch(0.08 0.03 165)', 'oklch(0.12 0.04 175)'],
      text: 'oklch(0.95 0.02 165)',
      textMuted: 'oklch(0.65 0.06 165)',
    },
    motionProfile: {
      breathingDuration: 8000,
      intensity: 'minimal',
      pattern: 'tight',
    },
    ambientProfile: {
      blur: 18,
      glowRadius: 24,
      pulseEnabled: true,
      syncEnabled: false,
    },
    icon: '◎',
  },
  
  /**
   * CHILL - Nervous system downshift
   * Color: Blue-green (parasympathetic activation)
   * Hook: Stress relief
   */
  chill: {
    id: 'chill',
    name: 'Chill',
    emotionalIntent: 'Nervous system downshift',
    description: 'Let your system unwind.',
    psychologicalHook: 'Stress relief',
    accessLevel: 'free',
    stateVector: {
      energy: 0.35,
      tempo: 58,      // Slow, relaxed breathing
      intimacy: 0.2,  // Can be shared casually
      attention: 0.4, // Diffuse, wandering
      openness: 0.6,  // Relaxed, receptive
    },
    colorProfile: {
      base: 'oklch(0.65 0.14 195)',      // Blue-green
      glow: 'oklch(0.75 0.10 185)',      // Soft aqua
      gradient: ['oklch(0.10 0.04 200)', 'oklch(0.12 0.05 190)'],
      text: 'oklch(0.92 0.02 195)',
      textMuted: 'oklch(0.60 0.05 195)',
    },
    motionProfile: {
      breathingDuration: 7000,
      intensity: 'low',
      pattern: 'slow',
    },
    ambientProfile: {
      blur: 22,
      glowRadius: 32,
      pulseEnabled: true,
      syncEnabled: false,
    },
    icon: '◌',
  },
  
  /**
   * SLEEP - Surrender
   * Color: Indigo/Violet (melatonin association)
   * Hook: Trust + vulnerability
   */
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    emotionalIntent: 'Surrender',
    description: 'Release into darkness.',
    psychologicalHook: 'Trust + vulnerability',
    accessLevel: 'free',
    stateVector: {
      energy: 0.1,
      tempo: 48,      // Deep rest breathing
      intimacy: 0.4,  // Vulnerable state
      attention: 0.1, // Letting go
      openness: 0.8,  // Complete surrender
    },
    colorProfile: {
      base: 'oklch(0.40 0.16 280)',      // Deep indigo
      glow: 'oklch(0.50 0.18 295)',      // Violet
      gradient: ['oklch(0.05 0.02 280)', 'oklch(0.03 0.03 300)'],
      text: 'oklch(0.80 0.03 280)',
      textMuted: 'oklch(0.50 0.06 280)',
    },
    motionProfile: {
      breathingDuration: 12000,
      intensity: 'minimal',
      pattern: 'still',
    },
    ambientProfile: {
      blur: 24,
      glowRadius: 28,
      pulseEnabled: false,
      syncEnabled: false,
    },
    icon: '◐',
  },
  
  /**
   * ROMANCE - Intimacy
   * Color: Burnt amber → rose (warmth + skin tones)
   * Hook: Desire without words
   * Premium: Emotional permission to be close
   */
  romance: {
    id: 'romance',
    name: 'Romance',
    emotionalIntent: 'Intimacy',
    description: 'Share warmth without words.',
    psychologicalHook: 'Desire without words',
    accessLevel: 'premium',
    stateVector: {
      energy: 0.55,
      tempo: 66,      // Slightly elevated, anticipatory
      intimacy: 0.9,  // Deep connection
      attention: 0.7, // Present, focused on other
      openness: 0.85, // Vulnerable, receptive
    },
    colorProfile: {
      base: 'oklch(0.68 0.14 45)',       // Burnt amber
      glow: 'oklch(0.75 0.16 15)',       // Rose warmth
      gradient: ['oklch(0.12 0.06 40)', 'oklch(0.10 0.08 10)'],
      text: 'oklch(0.95 0.02 30)',
      textMuted: 'oklch(0.68 0.06 40)',
    },
    motionProfile: {
      breathingDuration: 6000,
      intensity: 'medium',
      pattern: 'responsive',
    },
    ambientProfile: {
      blur: 20,
      glowRadius: 40,
      pulseEnabled: true,
      syncEnabled: true,
    },
    icon: '◉',
  },
  
  /**
   * BOND - Stability
   * Color: Olive/gold (grounding, security)
   * Hook: Attachment security
   * Premium: Emotional permission for stability
   */
  bond: {
    id: 'bond',
    name: 'Bond',
    emotionalIntent: 'Stability',
    description: 'Feel grounded together.',
    psychologicalHook: 'Attachment security',
    accessLevel: 'premium',
    stateVector: {
      energy: 0.5,
      tempo: 60,      // Steady, reliable
      intimacy: 0.75, // Connected but stable
      attention: 0.6, // Comfortable presence
      openness: 0.7,  // Trusting
    },
    colorProfile: {
      base: 'oklch(0.62 0.12 95)',       // Olive/gold
      glow: 'oklch(0.72 0.14 85)',       // Warm gold
      gradient: ['oklch(0.10 0.04 90)', 'oklch(0.12 0.05 80)'],
      text: 'oklch(0.92 0.02 90)',
      textMuted: 'oklch(0.62 0.05 95)',
    },
    motionProfile: {
      breathingDuration: 7000,
      intensity: 'medium',
      pattern: 'synchronized',
    },
    ambientProfile: {
      blur: 20,
      glowRadius: 36,
      pulseEnabled: true,
      syncEnabled: true,
    },
    icon: '◈',
  },
  
  /**
   * AFTERGLOW - Post-connection warmth
   * Color: Plum/copper (memory + warmth)
   * Hook: Memory imprint
   * Premium: Emotional permission to linger
   */
  afterglow: {
    id: 'afterglow',
    name: 'Afterglow',
    emotionalIntent: 'Post-connection warmth',
    description: 'Let the moment linger.',
    psychologicalHook: 'Memory imprint',
    accessLevel: 'premium',
    stateVector: {
      energy: 0.3,
      tempo: 54,      // Slow, satisfied
      intimacy: 0.65, // Fading but present
      attention: 0.35, // Dreamy, diffuse
      openness: 0.75, // Soft, unguarded
    },
    colorProfile: {
      base: 'oklch(0.52 0.14 330)',      // Plum
      glow: 'oklch(0.65 0.12 50)',       // Copper warmth
      gradient: ['oklch(0.08 0.05 330)', 'oklch(0.10 0.04 40)'],
      text: 'oklch(0.88 0.03 330)',
      textMuted: 'oklch(0.55 0.06 330)',
    },
    motionProfile: {
      breathingDuration: 10000,
      intensity: 'low',
      pattern: 'decay',
    },
    ambientProfile: {
      blur: 24,
      glowRadius: 44,
      pulseEnabled: true,
      syncEnabled: true,
    },
    icon: '◍',
  },
} as const;

// One-time premium moments
export interface OneTimeMoment {
  id: string;
  name: string;
  description: string;
  price: number;
  baseModeId: string;
  durationHours: number;
}

export const ONE_TIME_MOMENTS: OneTimeMoment[] = [
  {
    id: 'date-night',
    name: 'Date Night',
    description: 'A special evening together.',
    price: 2.99,
    baseModeId: 'romance',
    durationHours: 12,
  },
  {
    id: 'reunion',
    name: 'Reunion',
    description: 'Reconnect after time apart.',
    price: 3.99,
    baseModeId: 'bond',
    durationHours: 24,
  },
  {
    id: 'long-distance-night',
    name: 'Long Distance Night',
    description: 'Feel close across any distance.',
    price: 1.99,
    baseModeId: 'afterglow',
    durationHours: 8,
  },
];

// Helper functions
export const getFreeModes = () => 
  Object.values(MODE_DEFINITIONS).filter(m => m.accessLevel === 'free');

export const getPremiumModes = () => 
  Object.values(MODE_DEFINITIONS).filter(m => m.accessLevel === 'premium');

export const getModeById = (id: string) => MODE_DEFINITIONS[id];

export const isModeAccessible = (modeId: string, isPremium: boolean): boolean => {
  const mode = MODE_DEFINITIONS[modeId];
  if (!mode) return false;
  if (mode.accessLevel === 'free') return true;
  return isPremium;
};

/**
 * Get tempo-based breathing duration
 * Converts BPM to milliseconds per breath cycle
 */
export const getBreathingFromTempo = (tempo: number): number => {
  // One breath cycle = 4 beats at the given tempo
  return (60000 / tempo) * 4;
};

/**
 * Calculate mode compatibility between two users
 * Based on state vector similarity
 */
export const getModeCompatibility = (mode1: string, mode2: string): number => {
  const m1 = MODE_DEFINITIONS[mode1];
  const m2 = MODE_DEFINITIONS[mode2];
  if (!m1 || !m2) return 0;
  
  const v1 = m1.stateVector;
  const v2 = m2.stateVector;
  
  // Euclidean distance in state space, normalized
  const distance = Math.sqrt(
    Math.pow(v1.energy - v2.energy, 2) +
    Math.pow((v1.tempo - v2.tempo) / 100, 2) + // Normalize tempo
    Math.pow(v1.intimacy - v2.intimacy, 2) +
    Math.pow(v1.attention - v2.attention, 2) +
    Math.pow(v1.openness - v2.openness, 2)
  );
  
  // Convert distance to similarity (0-1)
  return Math.max(0, 1 - (distance / 2.5));
};
