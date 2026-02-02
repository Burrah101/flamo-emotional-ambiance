/**
 * FLaMO Premium/VIP Screen - Nightlife Dating
 * Unlock chat access, VIP features, and special perks
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import { useUserStore } from '../state/userStore';
import { FLAMO_CONFIG } from '../core/flamoConfig';
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
  MessageCircle,
  Zap,
  Clock,
  CreditCard,
  Loader2,
  Flame,
  Star,
  Eye,
  Send,
  Infinity,
  Shield
} from 'lucide-react';

// Floating embers background
function FloatingEmbers() {
  const [embers, setEmbers] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  
  useEffect(() => {
    const newEmbers = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    }));
    setEmbers(newEmbers);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="absolute rounded-full"
          style={{
            left: `${ember.x}%`,
            top: `${ember.y}%`,
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, rgba(255,106,0,0.6) 0%, transparent 100%)`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Premium() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const { isAuthenticated, user } = useAuth();
  
  const isPremium = useUserStore(state => state.isPremium);
  const setPremium = useUserStore(state => state.setPremium);
  
  // Stripe mutations for different purchase types
  const subscriptionCheckout = trpc.stripe.createSubscriptionCheckout.useMutation();
  const oneTimeCheckout = trpc.stripe.createOneTimeCheckout.useMutation();
  const powerUpCheckout = trpc.stripe.createPowerUpCheckout.useMutation();
  
  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    
    if (params.get('success') === 'true') {
      const type = params.get('type');
      const product = params.get('product');
      
      if (type === 'vip') {
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        setPremium(true, expiresAt);
        toast.success('🔥 Welcome to VIP!', {
          description: 'You now have unlimited messaging access.',
        });
      } else if (type === 'one_time') {
        if (product === 'unlimited_tonight') {
          // Calculate 6 AM expiry
          const now = new Date();
          const expiry = new Date(now);
          if (now.getHours() < 6) {
            expiry.setHours(6, 0, 0, 0);
          } else {
            expiry.setDate(expiry.getDate() + 1);
            expiry.setHours(6, 0, 0, 0);
          }
          setPremium(true, expiry.getTime());
          toast.success('⚡ Unlimited Tonight Activated!', {
            description: 'Message anyone until 6 AM.',
          });
        } else if (product === 'single_chat') {
          toast.success('💬 Chat Unlocked!', {
            description: 'You can now message this person.',
          });
        }
      } else if (type === 'power_up') {
        toast.success('⚡ Power-Up Activated!', {
          description: `Your ${product?.replace('_', ' ')} is now active.`,
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
  
  const handlePurchase = async (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    setIsProcessing(true);
    setSelectedPlan(planId);
    
    try {
      let checkoutUrl: string | undefined;
      
      // Route to correct checkout based on plan type
      if (planId === 'vip') {
        const result = await subscriptionCheckout.mutateAsync({ type: 'monthly' });
        checkoutUrl = result.checkoutUrl;
      } else if (planId === 'vip_yearly') {
        const result = await subscriptionCheckout.mutateAsync({ type: 'yearly' });
        checkoutUrl = result.checkoutUrl;
      } else if (planId === 'single') {
        // For single chat unlock, we need a target user
        // This would typically be called from a profile page with a specific user
        toast.info('Select a profile first', {
          description: 'Go to someone\'s profile to unlock chat with them.',
        });
        setIsProcessing(false);
        setSelectedPlan(null);
        return;
      } else if (planId === 'tonight') {
        const result = await oneTimeCheckout.mutateAsync({ productId: 'unlimited_tonight' });
        checkoutUrl = result.checkoutUrl;
      } else if (planId === 'boost') {
        const result = await powerUpCheckout.mutateAsync({ productId: 'profile_boost' });
        checkoutUrl = result.checkoutUrl;
      } else if (planId === 'superlike') {
        const result = await powerUpCheckout.mutateAsync({ productId: 'super_likes' });
        checkoutUrl = result.checkoutUrl;
      } else if (planId === 'incognito') {
        const result = await powerUpCheckout.mutateAsync({ productId: 'incognito' });
        checkoutUrl = result.checkoutUrl;
      }
      
      if (checkoutUrl) {
        toast.info('Redirecting to checkout...', {
          description: 'You will be taken to Stripe to complete payment.',
        });
        // Open in same window for better mobile experience
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (error.message?.includes('Stripe is not configured')) {
        toast.error('Payment not available', {
          description: 'Stripe is not configured. Please contact support.',
        });
      } else {
        toast.error('Something went wrong', {
          description: 'Please try again later.',
        });
      }
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };
  
  const plans = [
    {
      id: 'single',
      name: 'Unlock One Chat',
      description: 'Message one person',
      price: 1.99,
      icon: MessageCircle,
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-500/30',
      features: ['Send unlimited messages to 1 person', 'See if they\'re online', 'Photo sharing'],
    },
    {
      id: 'tonight',
      name: 'Unlimited Tonight',
      description: 'Message anyone until sunrise',
      price: 4.99,
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      features: ['Unlimited messaging until 6 AM', 'See who viewed your profile', 'Priority in discover'],
      popular: true,
    },
    {
      id: 'vip',
      name: 'VIP Access',
      description: 'Unlimited everything, forever',
      price: 9.99,
      priceLabel: '/month',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-500/30',
      features: [
        'Unlimited messaging forever',
        'See who liked you',
        'Appear first in discover',
        'Exclusive VIP badge',
        'Undo swipes',
        'Ad-free experience',
      ],
      bestValue: true,
    },
  ];
  
  const boosts = [
    {
      id: 'boost',
      name: 'Profile Boost',
      description: 'Get 10x more views for 30 minutes',
      price: 2.99,
      icon: Flame,
    },
    {
      id: 'superlike',
      name: 'Super Likes (5)',
      description: 'Stand out from the crowd',
      price: 4.99,
      icon: Star,
    },
    {
      id: 'incognito',
      name: 'Incognito Mode',
      description: 'Browse without being seen',
      price: 1.99,
      icon: Eye,
    },
  ];
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <FloatingEmbers />
      
      {/* Fire glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,106,0,0.3) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative z-10 min-h-screen safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Go VIP
              </h1>
              <p className="text-sm text-white/50">Unlock the full experience</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8 overflow-y-auto">
          {/* Already VIP */}
          {isPremium && (
            <motion.div
              className="p-6 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white mb-2">You're VIP! 🔥</h2>
              <p className="text-white/60">
                Enjoy unlimited messaging and all premium features.
              </p>
            </motion.div>
          )}
          
          {/* Pricing plans */}
          {!isPremium && (
            <div className="space-y-4 mb-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  className={`relative p-5 rounded-2xl bg-white/5 ${plan.borderColor} border overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Best value badge */}
                  {plan.bestValue && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-bl-xl">
                      BEST VALUE
                    </div>
                  )}
                  
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-bl-xl">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <span className="text-xl font-bold text-white">
                          ${plan.price}
                          {plan.priceLabel && <span className="text-sm text-white/50">{plan.priceLabel}</span>}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm mb-3">{plan.description}</p>
                      
                      {/* Features */}
                      <div className="space-y-1.5 mb-4">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-white/70">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      <motion.button
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.color} text-white font-semibold flex items-center justify-center gap-2`}
                        onClick={() => handlePurchase(plan.id)}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isProcessing && selectedPlan === plan.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Get {plan.name}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Boosts section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Power-Ups
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {boosts.map((boost) => (
                <motion.button
                  key={boost.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
                  onClick={() => handlePurchase(boost.id)}
                  disabled={isProcessing}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isProcessing && selectedPlan === boost.id ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-orange-400 animate-spin" />
                  ) : (
                    <boost.icon className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                  )}
                  <p className="text-white text-sm font-medium mb-1">{boost.name}</p>
                  <p className="text-orange-400 font-bold">${boost.price}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-6 text-white/40 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Stripe
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              Cancel Anytime
            </div>
          </motion.div>
          
          {/* Test mode notice */}
          <motion.p
            className="text-center text-white/30 text-xs mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC.
          </motion.p>
        </main>
      </div>
    </div>
  );
}
