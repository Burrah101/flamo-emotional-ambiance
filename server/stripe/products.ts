/**
 * FLaMO Stripe Products Configuration
 * Centralized product and pricing definitions.
 */

export const PRODUCTS = {
  // Premium subscription - $6.99/month
  PREMIUM_MONTHLY: {
    id: 'premium_monthly',
    name: 'FLaMO Premium',
    description: 'Unlock Romance, Bond, and Afterglow modes plus shared presence features',
    price: 699, // in cents
    currency: 'usd',
    interval: 'month' as const,
    features: [
      'Romance mode - rose-gold ambiance',
      'Bond mode - amber/teal connection',
      'Afterglow mode - orchid fade',
      'Shared presence with partner',
      'Priority support',
    ],
  },

  // Premium subscription - $59.99/year (save ~28%)
  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    name: 'FLaMO Premium (Annual)',
    description: 'Unlock all premium features - save 28% with annual billing',
    price: 5999, // in cents
    currency: 'usd',
    interval: 'year' as const,
    features: [
      'All Premium features',
      'Save 28% vs monthly',
      'Best value',
    ],
  },

  // One-time moment purchases
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
export type MomentId = keyof typeof PRODUCTS.MOMENTS;

interface MomentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
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

export function getSubscriptionProduct(type: 'monthly' | 'yearly') {
  return type === 'monthly' ? PRODUCTS.PREMIUM_MONTHLY : PRODUCTS.PREMIUM_YEARLY;
}
