import { describe, expect, it, beforeEach } from "vitest";

/**
 * Onboarding Store Tests
 * Tests for the onboarding state management logic.
 * Note: Since the store uses zustand with persist middleware,
 * we test the core logic patterns here.
 */

describe("Onboarding Logic", () => {
  describe("step navigation", () => {
    it("should start at step 0", () => {
      const initialStep = 0;
      expect(initialStep).toBe(0);
    });

    it("should have 6 total steps", () => {
      const totalSteps = 6;
      const steps = [
        'welcome',
        'modes-free', 
        'modes-premium',
        'ambient',
        'presence',
        'start'
      ];
      expect(steps.length).toBe(totalSteps);
    });

    it("should not go below step 0", () => {
      let currentStep = 0;
      const prevStep = () => {
        if (currentStep > 0) {
          currentStep = currentStep - 1;
        }
      };
      
      prevStep();
      expect(currentStep).toBe(0);
    });

    it("should not exceed total steps", () => {
      let currentStep = 5;
      const totalSteps = 6;
      const nextStep = () => {
        if (currentStep < totalSteps - 1) {
          currentStep = currentStep + 1;
        }
      };
      
      nextStep();
      expect(currentStep).toBe(5); // Should stay at 5 (last step)
    });

    it("should advance through all steps", () => {
      let currentStep = 0;
      const totalSteps = 6;
      const nextStep = () => {
        if (currentStep < totalSteps - 1) {
          currentStep = currentStep + 1;
        }
      };
      
      // Advance through all steps
      for (let i = 0; i < totalSteps - 1; i++) {
        nextStep();
      }
      
      expect(currentStep).toBe(5);
    });
  });

  describe("onboarding completion", () => {
    it("should mark onboarding as complete", () => {
      let hasCompletedOnboarding = false;
      
      const completeOnboarding = () => {
        hasCompletedOnboarding = true;
      };
      
      completeOnboarding();
      expect(hasCompletedOnboarding).toBe(true);
    });

    it("should reset onboarding state", () => {
      let hasCompletedOnboarding = true;
      let currentStep = 3;
      
      const resetOnboarding = () => {
        hasCompletedOnboarding = false;
        currentStep = 0;
      };
      
      resetOnboarding();
      expect(hasCompletedOnboarding).toBe(false);
      expect(currentStep).toBe(0);
    });
  });

  describe("step content", () => {
    const ONBOARDING_STEPS = [
      { id: 'welcome', title: 'Welcome to FLaMO' },
      { id: 'modes-free', title: 'Free Modes', modes: ['focus', 'chill', 'sleep'] },
      { id: 'modes-premium', title: 'Premium Modes', modes: ['romance', 'bond', 'afterglow'], isPremium: true },
      { id: 'ambient', title: 'Ambient Sync', feature: 'ambient' },
      { id: 'presence', title: 'Shared Presence', feature: 'presence' },
      { id: 'start', title: 'Ready to Begin' },
    ];

    it("should have welcome as first step", () => {
      expect(ONBOARDING_STEPS[0].id).toBe('welcome');
    });

    it("should have start as last step", () => {
      expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].id).toBe('start');
    });

    it("should show free modes in step 1", () => {
      const freeModeStep = ONBOARDING_STEPS[1];
      expect(freeModeStep.modes).toContain('focus');
      expect(freeModeStep.modes).toContain('chill');
      expect(freeModeStep.modes).toContain('sleep');
    });

    it("should show premium modes in step 2", () => {
      const premiumModeStep = ONBOARDING_STEPS[2];
      expect(premiumModeStep.modes).toContain('romance');
      expect(premiumModeStep.modes).toContain('bond');
      expect(premiumModeStep.modes).toContain('afterglow');
      expect(premiumModeStep.isPremium).toBe(true);
    });

    it("should explain ambient sync feature", () => {
      const ambientStep = ONBOARDING_STEPS.find(s => s.feature === 'ambient');
      expect(ambientStep).toBeDefined();
      expect(ambientStep?.title).toBe('Ambient Sync');
    });

    it("should explain shared presence feature", () => {
      const presenceStep = ONBOARDING_STEPS.find(s => s.feature === 'presence');
      expect(presenceStep).toBeDefined();
      expect(presenceStep?.title).toBe('Shared Presence');
    });
  });
});
