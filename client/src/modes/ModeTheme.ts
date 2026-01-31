/**
 * FLaMO Mode Theme
 * Color, glow, blur math.
 * Modes do not know screens exist.
 */

import { ModeDefinition, ColorProfile } from '../core/modeDefinitions';
import { FLAMO_CONFIG } from '../core/flamoConfig';

export interface ThemeStyles {
  // Background
  backgroundGradient: string;
  
  // Glass
  glassBackground: string;
  glassBorder: string;
  glassBlur: string;
  
  // Glow
  glowColor: string;
  glowRadius: string;
  glowShadow: string;
  innerGlow: string;
  
  // Text
  textColor: string;
  textMutedColor: string;
  
  // Accent
  accentColor: string;
}

export const generateThemeStyles = (
  mode: ModeDefinition,
  glowIntensity: number = 0.6,
  ambientAmplitude: number = 0
): ThemeStyles => {
  const { colorProfile, ambientProfile } = mode;
  const config = FLAMO_CONFIG.glass;
  
  // Calculate dynamic glow based on intensity and ambient
  const baseGlowRadius = ambientProfile.glowRadius;
  const dynamicGlowRadius = baseGlowRadius + (ambientAmplitude * 16);
  const glowOpacity = 0.3 + (glowIntensity * 0.4) + (ambientAmplitude * 0.2);
  
  // Glass transparency
  const transparency = config.transparency.default;
  
  return {
    // Background gradient
    backgroundGradient: `linear-gradient(135deg, ${colorProfile.gradient[0]}, ${colorProfile.gradient[1]})`,
    
    // Glass card styles
    glassBackground: `${colorProfile.base.replace(')', ` / ${transparency})`)}`,
    glassBorder: `1px solid ${colorProfile.glow.replace(')', ' / 0.15)')}`,
    glassBlur: `${ambientProfile.blur}px`,
    
    // Glow effects
    glowColor: colorProfile.glow,
    glowRadius: `${dynamicGlowRadius}px`,
    glowShadow: `0 0 ${dynamicGlowRadius}px ${colorProfile.glow.replace(')', ` / ${glowOpacity})`)}`,
    innerGlow: `inset 0 0 ${dynamicGlowRadius / 2}px ${colorProfile.glow.replace(')', ` / ${glowOpacity * 0.5})`)}`,
    
    // Text colors
    textColor: colorProfile.text,
    textMutedColor: colorProfile.textMuted,
    
    // Accent
    accentColor: colorProfile.base,
  };
};

// CSS custom properties generator
export const generateCSSVariables = (
  mode: ModeDefinition,
  glowIntensity: number = 0.6,
  ambientAmplitude: number = 0
): Record<string, string> => {
  const styles = generateThemeStyles(mode, glowIntensity, ambientAmplitude);
  
  return {
    '--flamo-bg-gradient': styles.backgroundGradient,
    '--flamo-glass-bg': styles.glassBackground,
    '--flamo-glass-border': styles.glassBorder,
    '--flamo-glass-blur': styles.glassBlur,
    '--flamo-glow-color': styles.glowColor,
    '--flamo-glow-radius': styles.glowRadius,
    '--flamo-glow-shadow': styles.glowShadow,
    '--flamo-inner-glow': styles.innerGlow,
    '--flamo-text': styles.textColor,
    '--flamo-text-muted': styles.textMutedColor,
    '--flamo-accent': styles.accentColor,
  };
};

// Default theme for when no mode is active
export const DEFAULT_THEME_STYLES: ThemeStyles = {
  backgroundGradient: 'linear-gradient(135deg, oklch(0.12 0.02 250), oklch(0.08 0.02 280))',
  glassBackground: 'oklch(0.20 0.02 250 / 0.08)',
  glassBorder: '1px solid oklch(0.40 0.04 250 / 0.15)',
  glassBlur: '20px',
  glowColor: 'oklch(0.60 0.10 250)',
  glowRadius: '28px',
  glowShadow: '0 0 28px oklch(0.60 0.10 250 / 0.3)',
  innerGlow: 'inset 0 0 14px oklch(0.60 0.10 250 / 0.15)',
  textColor: 'oklch(0.92 0.02 250)',
  textMutedColor: 'oklch(0.65 0.04 250)',
  accentColor: 'oklch(0.60 0.10 250)',
};

export const DEFAULT_CSS_VARIABLES: Record<string, string> = {
  '--flamo-bg-gradient': DEFAULT_THEME_STYLES.backgroundGradient,
  '--flamo-glass-bg': DEFAULT_THEME_STYLES.glassBackground,
  '--flamo-glass-border': DEFAULT_THEME_STYLES.glassBorder,
  '--flamo-glass-blur': DEFAULT_THEME_STYLES.glassBlur,
  '--flamo-glow-color': DEFAULT_THEME_STYLES.glowColor,
  '--flamo-glow-radius': DEFAULT_THEME_STYLES.glowRadius,
  '--flamo-glow-shadow': DEFAULT_THEME_STYLES.glowShadow,
  '--flamo-inner-glow': DEFAULT_THEME_STYLES.innerGlow,
  '--flamo-text': DEFAULT_THEME_STYLES.textColor,
  '--flamo-text-muted': DEFAULT_THEME_STYLES.textMutedColor,
  '--flamo-accent': DEFAULT_THEME_STYLES.accentColor,
};
