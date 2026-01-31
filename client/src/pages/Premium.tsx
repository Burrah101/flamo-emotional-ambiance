/**
 * FLaMO Premium Screen
 * Subscription and one-time purchases with Stripe integration.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { getPremiumModes, ONE_TIME_MOMENTS } from '../core/modeDefinitions';
import { FLAMO_CONFIG } from '../core/flamoConfig';
import { AmbientGlow } from '../components/AmbientGlow';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles,
  Heart,
  Users,
  Volume2,
  Clock,
  CreditCard,
  Loader2
} from 'lucide-react';

export default function Premium() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const { isAuthenticated, user } = useAuth();
  
  const isPremium = useUserStore(state => state.isPremium);
  const setPremium = useUserStore(state => state.setPremium);
  const addPurchasedMoment = useUserStore(state => state.addPurchasedMoment);
  
  const premiumModes = getPremiumModes();
  
  // Stripe mutations
  const subscriptionCheckout = trpc.stripe.createSubscriptionCheckout.useMutation();
  const momentCheckout = trpc.stripe.createMomentCheckout.useMutation();
  
  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    
    if (params.get('success') === 'true') {
      // Subscription successful
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      setPremium(true, expiresAt);
      toast.success('Welcome to Premium!', {
        description: 'You now have access to all premium features.',
      });
      // Clean URL
      navigate('/premium', { replace: true });
    } else if (params.get('moment_success') === 'true') {
      // Moment purchase successful
      const momentId = params.get('moment_id');
      const moment = ONE_TIME_MOMENTS.find(m => m.id === momentId);
      if (moment) {
        addPurchasedMoment(momentId!, moment.durationHours);
        toast.success(`${moment.name} unlocked!`, {
          description: `Available for ${moment.durationHours} hours.`,
        });
      }
      navigate('/premium', { replace: true });
    } else if (params.get('canceled') === 'true') {
      toast.info('Payment canceled', {
        description: 'No charges were made.',
      });
      navigate('/premium', { replace: true });
    }
  }, [searchString]);
  
  const premiumFeatures = [
    { icon: Heart, label: 'Romance, Bond & Afterglow modes' },
    { icon: Users, label: 'Shared presence with anyone' },
    { icon: Volume2, label: 'Ambient sync with environment' },
    { icon: Clock, label: 'Mode scheduling' },
    { icon: Sparkles, label: 'Custom glow intensity' },
  ];
  
  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await subscriptionCheckout.mutateAsync({ type: billingCycle });
      
      if (result.checkoutUrl) {
        toast.info('Redirecting to checkout...', {
          description: 'You will be taken to Stripe to complete payment.',
        });
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePurchaseMoment = async (momentId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    const moment = ONE_TIME_MOMENTS.find(m => m.id === momentId);
    if (!moment) return;
    
    setIsProcessing(true);
    setSelectedMoment(momentId);
    
    try {
      const result = await momentCheckout.mutateAsync({ momentId: `moment_${momentId}` });
      
      if (result.checkoutUrl) {
        toast.info('Redirecting to checkout...', {
          description: 'You will be taken to Stripe to complete payment.',
        });
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (error) {
      toast.error('Purchase failed', {
        description: 'Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedMoment(null);
    }
  };
  
  const monthlyPrice = FLAMO_CONFIG.pricing.premium.monthly;
  const yearlyPrice = 59.99;
  const yearlySavings = Math.round((1 - (yearlyPrice / (monthlyPrice * 12))) * 100);
  
  return (
    <div className="min-h-screen relative">
      <AmbientGlow />
      
      <div className="relative z-10 min-h-screen safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-full flamo-glass-subtle flex items-center justify-center"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 flamo-text" />
            </motion.button>
            <div>
              <h1 className="text-xl font-medium flamo-text">Premium</h1>
              <p className="text-sm flamo-text-muted">Unlock deeper experiences</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8 overflow-y-auto">
          {/* Premium subscription card */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.37, 0, 0.63, 1] }}
            >
              <GlassCard className="p-6 mb-8" breathing>
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.75 0.12 45 / 0.3), oklch(0.65 0.15 25 / 0.3))',
                    }}
                  >
                    <Crown className="w-6 h-6" style={{ color: 'oklch(0.85 0.15 45)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium flamo-text">FLaMO Premium</h2>
                    <p className="text-sm flamo-text-muted">
                      Unlock all premium features
                    </p>
                  </div>
                </div>
                
                {/* Billing cycle toggle */}
                <div className="flex gap-2 mb-6 p-1 rounded-xl flamo-glass-subtle">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      billingCycle === 'monthly' 
                        ? 'flamo-glass flamo-text' 
                        : 'flamo-text-muted hover:flamo-text'
                    }`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative ${
                      billingCycle === 'yearly' 
                        ? 'flamo-glass flamo-text' 
                        : 'flamo-text-muted hover:flamo-text'
                    }`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                      Save {yearlySavings}%
                    </span>
                  </button>
                </div>
                
                {/* Price display */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold flamo-text">
                    ${billingCycle === 'monthly' ? monthlyPrice : yearlyPrice}
                    <span className="text-base font-normal flamo-text-muted">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-400 mt-1">
                      That's just ${(yearlyPrice / 12).toFixed(2)}/month
                    </p>
                  )}
                </div>
                
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {premiumFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-full flamo-glass-subtle flex items-center justify-center">
                        <feature.icon className="w-4 h-4 flamo-text-muted" />
                      </div>
                      <span className="text-sm flamo-text">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Subscribe button */}
                <GlassButton
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-4"
                  icon={isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                >
                  {isProcessing ? 'Processing...' : `Subscribe for $${billingCycle === 'monthly' ? monthlyPrice : yearlyPrice}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                </GlassButton>
                
                <p className="text-xs text-center flamo-text-muted mt-4">
                  Secure payment via Stripe. Cancel anytime.
                </p>
              </GlassCard>
            </motion.div>
          )}
          
          {/* Already premium */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-6 mb-8 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4" style={{ color: 'oklch(0.85 0.15 45)' }} />
                <h2 className="text-lg font-medium flamo-text mb-2">You're Premium!</h2>
                <p className="text-sm flamo-text-muted">
                  Enjoy all premium features and modes.
                </p>
              </GlassCard>
            </motion.div>
          )}
          
          {/* Premium modes preview */}
          <section className="mb-8">
            <h3 className="text-lg font-medium flamo-text mb-4">Premium Modes</h3>
            <div className="grid grid-cols-3 gap-3">
              {premiumModes.map((mode) => (
                <motion.div
                  key={mode.id}
                  className="aspect-square rounded-2xl flamo-glass-subtle p-3 flex flex-col items-center justify-center text-center"
                  whileHover={{ scale: 1.02 }}
                  style={{
                    background: `linear-gradient(135deg, ${mode.colorProfile.base}20, ${mode.colorProfile.glow}10)`,
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full mb-2 flex items-center justify-center"
                    style={{ background: `${mode.colorProfile.base}30` }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: mode.colorProfile.base }} />
                  </div>
                  <span className="text-xs font-medium flamo-text">{mode.name}</span>
                </motion.div>
              ))}
            </div>
          </section>
          
          {/* One-time moments */}
          <section>
            <h3 className="text-lg font-medium flamo-text mb-2">Special Moments</h3>
            <p className="text-sm flamo-text-muted mb-4">
              One-time unlocks for special occasions
            </p>
            
            <div className="space-y-3">
              {ONE_TIME_MOMENTS.map((moment) => (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flamo-text">{moment.name}</h4>
                        <p className="text-xs flamo-text-muted">
                          {moment.durationHours}h access • ${moment.price.toFixed(2)}
                        </p>
                      </div>
                      <GlassButton
                        onClick={() => handlePurchaseMoment(moment.id)}
                        disabled={isProcessing && selectedMoment === moment.id}
                        className="px-4 py-2 text-sm"
                        icon={isProcessing && selectedMoment === moment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      >
                        {isProcessing && selectedMoment === moment.id ? '...' : 'Buy'}
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
          
          {/* Test card info */}
          <div className="mt-8 p-4 rounded-xl flamo-glass-subtle">
            <p className="text-xs text-center flamo-text-muted">
              <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
