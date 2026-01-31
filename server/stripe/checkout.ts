/**
 * FLaMO Stripe Checkout Handlers
 * Creates checkout sessions for subscriptions and moment purchases.
 */

import Stripe from 'stripe';
import { PRODUCTS, getMomentById, getSubscriptionProduct } from './products';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

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
  const product = getSubscriptionProduct(type);

  const session = await stripe.checkout.sessions.create({
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
  const moment = getMomentById(momentId);
  
  if (!moment) {
    throw new Error(`Invalid moment ID: ${momentId}`);
  }

  const session = await stripe.checkout.sessions.create({
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
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Get Stripe instance for webhook verification
 */
export function getStripe() {
  return stripe;
}
