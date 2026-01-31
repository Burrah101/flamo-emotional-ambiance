/**
 * FLaMO Mode Glass
 * Glass presets and calculations.
 * Design Law: Nothing is sharp. Nothing is loud. Nothing demands.
 */

import { ModeDefinition } from '../core/modeDefinitions';
import { FLAMO_CONFIG } from '../core/flamoConfig';

export interface GlassPreset {
  blur: number;
  transparency: number;
  borderRadius: number;
  borderWidth: number;
  borderOpacity: number;
  shadowSpread: number;
  innerGlowIntensity: number;
}

// Base glass formula from spec
const BASE_GLASS: GlassPreset = {
  blur: FLAMO_CONFIG.glass.blur.default,
  transparency: FLAMO_CONFIG.glass.transparency.default,
  borderRadius: FLAMO_CONFIG.glass.borderRadius,
  borderWidth: FLAMO_CONFIG.glass.borderWidth,
  borderOpacity: 0.15,
  shadowSpread: 20,
  innerGlowIntensity: 0.5,
};

// Variant presets
export type GlassVariant = 'card' | 'button' | 'panel' | 'modal' | 'subtle' | 'intense';

const GLASS_VARIANTS: Record<GlassVariant, Partial<GlassPreset>> = {
  card: {
    // Standard glass card
  },
  button: {
    blur: 16,
    transparency: 0.12,
    borderRadius: 12,
    innerGlowIntensity: 0.3,
  },
  panel: {
    blur: 24,
    transparency: 0.06,
    borderRadius: 24,
    shadowSpread: 30,
  },
  modal: {
    blur: 28,
    transparency: 0.08,
    borderRadius: 28,
    shadowSpread: 40,
    innerGlowIntensity: 0.6,
  },
  subtle: {
    blur: 12,
    transparency: 0.04,
    borderOpacity: 0.08,
    innerGlowIntensity: 0.2,
  },
  intense: {
    blur: 22,
    transparency: 0.14,
    borderOpacity: 0.25,
    innerGlowIntensity: 0.8,
    shadowSpread: 35,
  },
};

export const getGlassPreset = (variant: GlassVariant = 'card'): GlassPreset => {
  return { ...BASE_GLASS, ...GLASS_VARIANTS[variant] };
};

export const generateGlassStyles = (
  mode: ModeDefinition | null,
  variant: GlassVariant = 'card',
  ambientAmplitude: number = 0
): React.CSSProperties => {
  const preset = getGlassPreset(variant);
  
  // Dynamic adjustments based on ambient
  const dynamicBlur = preset.blur + (ambientAmplitude * 4);
  const dynamicShadow = preset.shadowSpread + (ambientAmplitude * 10);
  
  // Get colors from mode or use defaults
  const glowColor = mode?.colorProfile.glow || 'oklch(0.60 0.10 250)';
  const baseColor = mode?.colorProfile.base || 'oklch(0.20 0.02 250)';
  
  return {
    backdropFilter: `blur(${dynamicBlur}px)`,
    WebkitBackdropFilter: `blur(${dynamicBlur}px)`,
    backgroundColor: `${baseColor.replace(')', ` / ${preset.transparency})`)}`,
    borderRadius: `${preset.borderRadius}px`,
    border: `${preset.borderWidth}px solid ${glowColor.replace(')', ` / ${preset.borderOpacity})`)}`,
    boxShadow: `
      0 0 ${dynamicShadow}px ${glowColor.replace(')', ` / ${preset.innerGlowIntensity * 0.3})`)}`,
  };
};

// Tailwind-compatible class generator
export const getGlassClasses = (variant: GlassVariant = 'card'): string => {
  const baseClasses = 'backdrop-blur-xl transition-all duration-500';
  
  const variantClasses: Record<GlassVariant, string> = {
    card: 'rounded-[20px]',
    button: 'rounded-xl',
    panel: 'rounded-3xl',
    modal: 'rounded-[28px]',
    subtle: 'rounded-[20px]',
    intense: 'rounded-[20px]',
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
};

// CSS variable-based glass styles (for dynamic theming)
export const GLASS_CSS_TEMPLATE = `
  .flamo-glass {
    backdrop-filter: blur(var(--flamo-glass-blur, 20px));
    -webkit-backdrop-filter: blur(var(--flamo-glass-blur, 20px));
    background: var(--flamo-glass-bg);
    border: var(--flamo-glass-border);
    border-radius: 20px;
    box-shadow: var(--flamo-glow-shadow), var(--flamo-inner-glow);
    transition: all 0.5s cubic-bezier(0.37, 0, 0.63, 1);
  }
  
  .flamo-glass-button {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: var(--flamo-glass-bg);
    border: var(--flamo-glass-border);
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.37, 0, 0.63, 1);
  }
  
  .flamo-glass-panel {
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    background: var(--flamo-glass-bg);
    border: var(--flamo-glass-border);
    border-radius: 24px;
    box-shadow: var(--flamo-glow-shadow);
    transition: all 0.6s cubic-bezier(0.37, 0, 0.63, 1);
  }
`;
