/**
 * FLaMO Stripe Products Configuration
 * Nightlife Dating VIP Tiers and Power-Ups
 */

export const PRODUCTS = {
  // ============= VIP Subscription Tiers =============
  
  // VIP Access - $9.99/month (unlimited everything)
  VIP_MONTHLY: {
    id: 'vip_monthly',
    name: 'VIP Access',
    description: 'Unlimited messaging, see who liked you, appear first in discover, exclusive VIP badge',
    price: 999, // in cents
    currency: 'usd',
    interval: 'month' as const,
    features: [
      'Unlimited messaging forever',
      'See who liked you',
      'Appear first in discover',
      'Exclusive VIP badge',
      'Undo swipes',
      'Ad-free experience',
    ],
  },

  // VIP Access - $79.99/year (save ~33%)
  VIP_YEARLY: {
    id: 'vip_yearly',
    name: 'VIP Access (Annual)',
    description: 'All VIP features - save 33% with annual billing',
    price: 7999, // in cents
    currency: 'usd',
    interval: 'year' as const,
    features: [
      'All VIP features',
      'Save 33% vs monthly',
      'Best value',
    ],
  },

  // ============= One-Time Purchases =============
  
  ONE_TIME: {
    // Unlock One Chat - $1.99
    SINGLE_CHAT: {
      id: 'single_chat',
      name: 'Unlock One Chat',
      description: 'Send unlimited messages to one person',
      price: 199, // $1.99
      currency: 'usd',
      type: 'single_unlock',
      features: [
        'Send unlimited messages to 1 person',
        'See if they\'re online',
        'Photo sharing',
      ],
    },
    
    // Unlimited Tonight - $4.99
    UNLIMITED_TONIGHT: {
      id: 'unlimited_tonight',
      name: 'Unlimited Tonight',
      description: 'Message anyone until sunrise',
      price: 499, // $4.99
      currency: 'usd',
      type: 'time_limited',
      duration: 12 * 60 * 60 * 1000, // 12 hours (until 6 AM)
      features: [
        'Unlimited messaging until 6 AM',
        'See who viewed your profile',
        'Priority in discover',
      ],
    },
  },

  // ============= Power-Ups =============
  
  POWER_UPS: {
    // Profile Boost - $2.99
    PROFILE_BOOST: {
      id: 'profile_boost',
      name: 'Profile Boost',
      description: 'Get 10x more views for 30 minutes',
      price: 299, // $2.99
      currency: 'usd',
      duration: 30 * 60 * 1000, // 30 minutes
    },
    
    // Super Likes (5) - $4.99
    SUPER_LIKES: {
      id: 'super_likes',
      name: 'Super Likes (5)',
      description: 'Stand out from the crowd',
      price: 499, // $4.99
      currency: 'usd',
      quantity: 5,
    },
    
    // Incognito Mode - $1.99
    INCOGNITO: {
      id: 'incognito',
      name: 'Incognito Mode',
      description: 'Browse without being seen for 24 hours',
      price: 199, // $1.99
      currency: 'usd',
      duration: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // ============= Legacy Moment Purchases (for backward compatibility) =============
  
  MOMENTS: {
    DATE_NIGHT: {
      id: 'moment_date_night',
      name: 'Date Night Mode',
      description: 'Perfect ambiance for a romantic evening - 24 hour access',
      price: 299, // $2.99
      currency: 'usd',
      duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    },
    REUNION: {
      id: 'moment_reunion',
      name: 'Reunion Mode',
      description: 'Celebrate reconnecting with someone special - 24 hour access',
      price: 399, // $3.99
      currency: 'usd',
      duration: 24 * 60 * 60 * 1000,
    },
    LONG_DISTANCE: {
      id: 'moment_long_distance',
      name: 'Long Distance Night',
      description: 'Feel close even when apart - 48 hour access',
      price: 499, // $4.99
      currency: 'usd',
      duration: 48 * 60 * 60 * 1000, // 48 hours
    },
    ANNIVERSARY: {
      id: 'moment_anniversary',
      name: 'Anniversary Special',
      description: 'Celebrate your special day - 72 hour access',
      price: 499, // $4.99
      currency: 'usd',
      duration: 72 * 60 * 60 * 1000, // 72 hours
    },
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
export type OneTimeId = keyof typeof PRODUCTS.ONE_TIME;
export type PowerUpId = keyof typeof PRODUCTS.POWER_UPS;
export type MomentId = keyof typeof PRODUCTS.MOMENTS;

interface BaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
}

interface MomentProduct extends BaseProduct {
  duration: number;
}

interface OneTimeProduct extends BaseProduct {
  type: string;
  features: string[];
  duration?: number;
}

interface PowerUpProduct extends BaseProduct {
  duration?: number;
  quantity?: number;
}

export function getMomentById(momentId: string): MomentProduct | null {
  const moments = PRODUCTS.MOMENTS;
  for (const key of Object.keys(moments) as Array<keyof typeof moments>) {
    const moment = moments[key];
    if (moment.id === momentId) {
      return moment as MomentProduct;
    }
  }
  return null;
}

export function getOneTimeById(productId: string): OneTimeProduct | null {
  const oneTime = PRODUCTS.ONE_TIME;
  for (const key of Object.keys(oneTime) as Array<keyof typeof oneTime>) {
    const product = oneTime[key];
    if (product.id === productId) {
      return product as OneTimeProduct;
    }
  }
  return null;
}

export function getPowerUpById(productId: string): PowerUpProduct | null {
  const powerUps = PRODUCTS.POWER_UPS;
  for (const key of Object.keys(powerUps) as Array<keyof typeof powerUps>) {
    const product = powerUps[key];
    if (product.id === productId) {
      return product as PowerUpProduct;
    }
  }
  return null;
}

export function getSubscriptionProduct(type: 'monthly' | 'yearly') {
  return type === 'monthly' ? PRODUCTS.VIP_MONTHLY : PRODUCTS.VIP_YEARLY;
}

// Get all available products for display
export function getAllProducts() {
  return {
    subscriptions: [PRODUCTS.VIP_MONTHLY, PRODUCTS.VIP_YEARLY],
    oneTime: Object.values(PRODUCTS.ONE_TIME),
    powerUps: Object.values(PRODUCTS.POWER_UPS),
    moments: Object.values(PRODUCTS.MOMENTS),
  };
}
