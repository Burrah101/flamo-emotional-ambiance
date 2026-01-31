/**
 * FLaMO User Store
 * Auth + premium state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFeatureFlags, FeatureFlags } from '../core/featureFlags';

export interface PurchasedMoment {
  momentId: string;
  purchasedAt: number;
  expiresAt: number;
}

export interface UserState {
  // Auth state (synced with backend)
  userId: string | null;
  isAuthenticated: boolean;
  
  // Premium state
  isPremium: boolean;
  premiumExpiresAt: number | null;
  
  // One-time purchases
  purchasedMoments: PurchasedMoment[];
  
  // Feature flags (derived from premium status)
  features: FeatureFlags;
  
  // Actions
  setUser: (userId: string) => void;
  clearUser: () => void;
  setPremium: (isPremium: boolean, expiresAt?: number) => void;
  addPurchasedMoment: (momentId: string, durationHours: number) => void;
  hasMomentAccess: (momentId: string) => boolean;
  refreshFeatures: () => void;
  cleanupExpiredMoments: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      isAuthenticated: false,
      isPremium: false,
      premiumExpiresAt: null,
      purchasedMoments: [],
      features: getFeatureFlags(false),
      
      setUser: (userId: string) => {
        set({ userId, isAuthenticated: true });
      },
      
      clearUser: () => {
        set({
          userId: null,
          isAuthenticated: false,
          isPremium: false,
          premiumExpiresAt: null,
          purchasedMoments: [],
          features: getFeatureFlags(false),
        });
      },
      
      setPremium: (isPremium: boolean, expiresAt?: number) => {
        set({
          isPremium,
          premiumExpiresAt: expiresAt || null,
          features: getFeatureFlags(isPremium),
        });
      },
      
      addPurchasedMoment: (momentId: string, durationHours: number) => {
        const now = Date.now();
        const expiresAt = now + durationHours * 60 * 60 * 1000;
        
        set(state => ({
          purchasedMoments: [
            ...state.purchasedMoments.filter(m => m.momentId !== momentId),
            { momentId, purchasedAt: now, expiresAt },
          ],
        }));
      },
      
      hasMomentAccess: (momentId: string) => {
        const state = get();
        const moment = state.purchasedMoments.find(m => m.momentId === momentId);
        if (!moment) return false;
        return moment.expiresAt > Date.now();
      },
      
      refreshFeatures: () => {
        const state = get();
        set({ features: getFeatureFlags(state.isPremium) });
      },
      
      cleanupExpiredMoments: () => {
        const now = Date.now();
        set(state => ({
          purchasedMoments: state.purchasedMoments.filter(m => m.expiresAt > now),
        }));
      },
    }),
    {
      name: 'flamo-user-store',
      partialize: (state) => ({
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
        isPremium: state.isPremium,
        premiumExpiresAt: state.premiumExpiresAt,
        purchasedMoments: state.purchasedMoments,
      }),
    }
  )
);

// Initialize cleanup on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useUserStore.getState().cleanupExpiredMoments();
    useUserStore.getState().refreshFeatures();
  }, 0);
}

// Selectors
export const selectIsPremium = (state: UserState) => state.isPremium;
export const selectFeatures = (state: UserState) => state.features;
export const selectIsAuthenticated = (state: UserState) => state.isAuthenticated;
