/**
 * FLaMO Mode Store - The Heart
 * Global mode + ambient + sync state.
 * ONE store for mode. NEVER duplicate mode locally.
 * UI subscribes, never mutates directly.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModeDefinition, MODE_DEFINITIONS } from '../core/modeDefinitions';

export interface AmbientState {
  amplitude: number; // 0-1, from mic
  isListening: boolean;
  hasPermission: boolean | null;
}

export interface SharedPresenceState {
  isSharing: boolean;
  sessionId: string | null;
  partnerId: string | null;
  partnerConnected: boolean;
}

export interface ModeState {
  // Current mode
  currentModeId: string | null;
  currentMode: ModeDefinition | null;
  
  // Ambient sync
  ambient: AmbientState;
  
  // Shared presence
  sharedPresence: SharedPresenceState;
  
  // Mode history for LLM suggestions
  modeHistory: Array<{ modeId: string; timestamp: number; duration: number }>;
  
  // Glow intensity (premium feature)
  glowIntensity: number; // 0-1
  
  // Actions
  enterMode: (modeId: string) => void;
  exitMode: () => void;
  setAmbientAmplitude: (amplitude: number) => void;
  setAmbientListening: (isListening: boolean) => void;
  setAmbientPermission: (hasPermission: boolean) => void;
  startSharedSession: (sessionId: string) => void;
  joinSharedSession: (sessionId: string, partnerId: string) => void;
  setPartnerConnected: (connected: boolean) => void;
  endSharedSession: () => void;
  setGlowIntensity: (intensity: number) => void;
  addToHistory: (modeId: string, duration: number) => void;
}

const HISTORY_MAX_LENGTH = 50;

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentModeId: null,
      currentMode: null,
      
      ambient: {
        amplitude: 0,
        isListening: false,
        hasPermission: null,
      },
      
      sharedPresence: {
        isSharing: false,
        sessionId: null,
        partnerId: null,
        partnerConnected: false,
      },
      
      modeHistory: [],
      glowIntensity: 0.6,
      
      // Actions
      enterMode: (modeId: string) => {
        const mode = MODE_DEFINITIONS[modeId];
        if (!mode) return;
        
        const currentState = get();
        const startTime = Date.now();
        
        // If exiting a previous mode, record it in history
        if (currentState.currentModeId && currentState.currentMode) {
          const lastEntry = currentState.modeHistory[currentState.modeHistory.length - 1];
          if (lastEntry && lastEntry.modeId === currentState.currentModeId) {
            // Update duration of last entry
            const duration = startTime - lastEntry.timestamp;
            set(state => ({
              modeHistory: [
                ...state.modeHistory.slice(0, -1),
                { ...lastEntry, duration },
              ],
            }));
          }
        }
        
        set({
          currentModeId: modeId,
          currentMode: mode,
        });
        
        // Add new entry to history
        set(state => ({
          modeHistory: [
            ...state.modeHistory.slice(-HISTORY_MAX_LENGTH + 1),
            { modeId, timestamp: startTime, duration: 0 },
          ],
        }));
      },
      
      exitMode: () => {
        const currentState = get();
        
        // Record final duration
        if (currentState.currentModeId) {
          const lastEntry = currentState.modeHistory[currentState.modeHistory.length - 1];
          if (lastEntry && lastEntry.modeId === currentState.currentModeId) {
            const duration = Date.now() - lastEntry.timestamp;
            set(state => ({
              modeHistory: [
                ...state.modeHistory.slice(0, -1),
                { ...lastEntry, duration },
              ],
            }));
          }
        }
        
        set({
          currentModeId: null,
          currentMode: null,
          ambient: {
            ...currentState.ambient,
            isListening: false,
            amplitude: 0,
          },
        });
      },
      
      setAmbientAmplitude: (amplitude: number) => {
        set(state => ({
          ambient: { ...state.ambient, amplitude: Math.max(0, Math.min(1, amplitude)) },
        }));
      },
      
      setAmbientListening: (isListening: boolean) => {
        set(state => ({
          ambient: { ...state.ambient, isListening },
        }));
      },
      
      setAmbientPermission: (hasPermission: boolean) => {
        set(state => ({
          ambient: { ...state.ambient, hasPermission },
        }));
      },
      
      startSharedSession: (sessionId: string) => {
        set({
          sharedPresence: {
            isSharing: true,
            sessionId,
            partnerId: null,
            partnerConnected: false,
          },
        });
      },
      
      joinSharedSession: (sessionId: string, partnerId: string) => {
        set({
          sharedPresence: {
            isSharing: true,
            sessionId,
            partnerId,
            partnerConnected: true,
          },
        });
      },
      
      setPartnerConnected: (connected: boolean) => {
        set(state => ({
          sharedPresence: { ...state.sharedPresence, partnerConnected: connected },
        }));
      },
      
      endSharedSession: () => {
        set({
          sharedPresence: {
            isSharing: false,
            sessionId: null,
            partnerId: null,
            partnerConnected: false,
          },
        });
      },
      
      setGlowIntensity: (intensity: number) => {
        set({ glowIntensity: Math.max(0, Math.min(1, intensity)) });
      },
      
      addToHistory: (modeId: string, duration: number) => {
        set(state => ({
          modeHistory: [
            ...state.modeHistory.slice(-HISTORY_MAX_LENGTH + 1),
            { modeId, timestamp: Date.now() - duration, duration },
          ],
        }));
      },
    }),
    {
      name: 'flamo-mode-store',
      partialize: (state) => ({
        currentModeId: state.currentModeId,
        modeHistory: state.modeHistory,
        glowIntensity: state.glowIntensity,
      }),
    }
  )
);

// Selectors for optimized subscriptions
export const selectCurrentMode = (state: ModeState) => state.currentMode;
export const selectCurrentModeId = (state: ModeState) => state.currentModeId;
export const selectAmbient = (state: ModeState) => state.ambient;
export const selectSharedPresence = (state: ModeState) => state.sharedPresence;
export const selectGlowIntensity = (state: ModeState) => state.glowIntensity;
export const selectModeHistory = (state: ModeState) => state.modeHistory;
