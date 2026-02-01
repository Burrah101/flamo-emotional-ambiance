/**
 * FLaMO Stripe Checkout Handlers
 * Creates checkout sessions for subscriptions and moment purchases.
 */

import Stripe from 'stripe';
import { getMomentById, getSubscriptionProduct } from './products';

// Initialize Stripe with secret key (lazy initialization to handle missing key)
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('Stripe is not configured. Please set up payment settings.');
    }
    stripe = new Stripe(key, {
      apiVersion: '2025-12-15.acacia' as Stripe.LatestApiVersion,
    });
  }
  return stripe;
}

interface CheckoutOptions {
  userId: number;
  userEmail: string;
  userName?: string;
  origin: string;
}

/**
 * Create a checkout session for premium subscription
 */
export async function createSubscriptionCheckout(
  type: 'monthly' | 'yearly',
  options: CheckoutOptions
): Promise<string> {
  const stripeClient = getStripeClient();
  const product = getSubscriptionProduct(type);

  const session = await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: options.userEmail,
    client_reference_id: options.userId.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
          recurring: {
            interval: product.interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: options.userId.toString(),
      customer_email: options.userEmail,
      customer_name: options.userName || '',
      product_type: 'subscription',
      subscription_type: type,
    },
    success_url: `${options.origin}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.origin}/premium?canceled=true`,
  });

  return session.url || '';
}

/**
 * Create a checkout session for one-time moment purchase
 */
export async function createMomentCheckout(
  momentId: string,
  options: CheckoutOptions
): Promise<string> {
  const stripeClient = getStripeClient();
  const moment = getMomentById(momentId);
  
  if (!moment) {
    throw new Error(`Invalid moment ID: ${momentId}`);
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: options.userEmail,
    client_reference_id: options.userId.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: moment.currency,
          product_data: {
            name: moment.name,
            description: moment.description,
          },
          unit_amount: moment.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: options.userId.toString(),
      customer_email: options.userEmail,
      customer_name: options.userName || '',
      product_type: 'moment',
      moment_id: momentId,
      duration_ms: moment.duration.toString(),
    },
    success_url: `${options.origin}/premium?moment_success=true&moment_id=${momentId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.origin}/premium?canceled=true`,
  });

  return session.url || '';
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  const stripeClient = getStripeClient();
  return stripeClient.checkout.sessions.retrieve(sessionId);
}

/**
 * Get Stripe instance for webhook verification
 */
export function getStripe(): Stripe | null {
  try {
    return getStripeClient();
  } catch {
    return null;
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
