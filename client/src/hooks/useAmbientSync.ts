/**
 * FLaMO useAmbientSync Hook
 * React hook for ambient microphone sync with RMS energy modulation.
 * 
 * "Two people in the same room:
 *  Phones glow together
 *  Tempo subtly matches
 *  Presence without speech"
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { ambientListener, AmbientListener, AmbientModulation } from '../audio/ambientListener';

export interface UseAmbientSyncReturn {
  isListening: boolean;
  hasPermission: boolean | null;
  amplitude: number;
  modulation: AmbientModulation;
  isSupported: boolean;
  start: () => Promise<boolean>;
  stop: () => void;
  toggle: () => Promise<void>;
}

// Default modulation values when not listening
const DEFAULT_MODULATION: AmbientModulation = {
  glowIntensity: 0.5,
  pulseRate: 1.0,
  breathingRate: 1.0,
  backgroundPulse: 0,
};

export function useAmbientSync(): UseAmbientSyncReturn {
  const ambient = useModeStore(state => state.ambient);
  const setAmbientListening = useModeStore(state => state.setAmbientListening);
  const setAmbientAmplitude = useModeStore(state => state.setAmbientAmplitude);
  
  const features = useUserStore(state => state.features);
  
  const [modulation, setModulation] = useState<AmbientModulation>(DEFAULT_MODULATION);
  
  const isSupported = AmbientListener.isSupported();
  const callbackRef = useRef<((amplitude: number, modulation: AmbientModulation) => void) | undefined>(undefined);
  
  // Update callback ref
  callbackRef.current = (amplitude: number, mod: AmbientModulation) => {
    setAmbientAmplitude(amplitude);
    setModulation(mod);
  };
  
  // Handle amplitude updates
  const handleAmplitude = useCallback((amplitude: number, mod: AmbientModulation) => {
    if (callbackRef.current) {
      callbackRef.current(amplitude, mod);
    }
  }, []);
  
  // Start listening
  const start = useCallback(async (): Promise<boolean> => {
    if (!features.ambientSync) {
      console.warn('Ambient sync feature not available');
      return false;
    }
    
    if (!isSupported) {
      console.warn('Ambient sync not supported');
      return false;
    }
    
    const success = await ambientListener.start(handleAmplitude);
    setAmbientListening(success);
    return success;
  }, [features.ambientSync, isSupported, handleAmplitude, setAmbientListening]);
  
  // Stop listening
  const stop = useCallback(() => {
    ambientListener.stop();
    setAmbientListening(false);
    setAmbientAmplitude(0);
    setModulation(DEFAULT_MODULATION);
  }, [setAmbientListening, setAmbientAmplitude]);
  
  // Toggle listening
  const toggle = useCallback(async () => {
    if (ambient.isListening) {
      stop();
    } else {
      await start();
    }
  }, [ambient.isListening, start, stop]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientListener.isListening) {
        ambientListener.stop();
      }
    };
  }, []);
  
  return {
    isListening: ambient.isListening,
    hasPermission: ambientListener.hasPermission,
    amplitude: ambient.amplitude,
    modulation,
    isSupported,
    start,
    stop,
    toggle,
  };
}

export default useAmbientSync;
