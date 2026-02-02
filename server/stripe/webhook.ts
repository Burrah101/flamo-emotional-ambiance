/**
 * FLaMO Stripe Webhook Handler
 * Processes Stripe events for VIP subscriptions, one-time purchases, and power-ups.
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getStripe } from './checkout';
import { getMomentById, getOneTimeById, getPowerUpById } from './products';
import * as db from '../db';
import { notifyOwner } from '../_core/notification';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    console.error('[Stripe Webhook] Stripe not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing webhook secret');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle test events for webhook verification
  if (event.id.startsWith('evt_test_')) {
    console.log('[Stripe Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.user_id || '0', 10);
  const productType = session.metadata?.product_type;

  if (!userId) {
    console.error('[Stripe Webhook] No user_id in session metadata');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, type: ${productType}`);

  switch (productType) {
    case 'vip_subscription':
      await handleVIPSubscription(session, userId);
      break;
    
    case 'one_time':
      await handleOneTimePurchase(session, userId);
      break;
    
    case 'power_up':
      await handlePowerUpPurchase(session, userId);
      break;
    
    case 'moment':
      await handleMomentPurchase(session, userId);
      break;
    
    // Legacy support
    case 'subscription':
      await handleVIPSubscription(session, userId);
      break;
    
    default:
      console.error(`[Stripe Webhook] Unknown product type: ${productType}`);
  }
}

/**
 * Handle VIP subscription purchase
 */
async function handleVIPSubscription(session: Stripe.Checkout.Session, userId: number) {
  const subscriptionType = session.metadata?.subscription_type as 'monthly' | 'yearly';
  
  // Create payment record
  await db.createPayment({
    userId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    type: 'vip_subscription',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    itemId: subscriptionType,
  });

  // Create subscription in our database
  const now = new Date();
  const expiresAt = new Date(now);
  if (subscriptionType === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  await db.createSubscription({
    userId,
    type: subscriptionType,
    status: 'active',
    expiresAt,
  });

  // Notify owner
  await notifyOwner({
    title: '🔥 New VIP Subscription!',
    content: `User ${userId} subscribed to FLaMO VIP (${subscriptionType}). Amount: $${((session.amount_total || 0) / 100).toFixed(2)}`,
  });
}

/**
 * Handle one-time purchase (single chat unlock, unlimited tonight)
 */
async function handleOneTimePurchase(session: Stripe.Checkout.Session, userId: number) {
  const productId = session.metadata?.product_id || '';
  const targetUserId = parseInt(session.metadata?.target_user_id || '0', 10);
  const durationMs = parseInt(session.metadata?.duration_ms || '0', 10);
  const product = getOneTimeById(productId);

  // Create payment record
  await db.createPayment({
    userId,
    stripeCustomerId: session.customer as string,
    stripePaymentIntentId: session.payment_intent as string,
    type: 'one_time_purchase',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    itemId: productId,
  });

  // Handle different one-time purchase types
  if (productId === 'single_chat' && targetUserId) {
    // Unlock chat with specific user
    await db.createChatUnlock({
      userId,
      targetUserId,
      price: session.amount_total || 0,
    });
  } else if (productId === 'unlimited_tonight') {
    // Create time-limited access
    const expiresAt = calculateTonightExpiry();
    await db.createTimeLimitedAccess({
      userId,
      type: 'unlimited_messaging',
      expiresAt,
      price: session.amount_total || 0,
    });
  }

  // Notify owner
  await notifyOwner({
    title: '💰 New One-Time Purchase!',
    content: `User ${userId} purchased ${product?.name || productId}. Amount: $${((session.amount_total || 0) / 100).toFixed(2)}`,
  });
}

/**
 * Handle power-up purchase
 */
async function handlePowerUpPurchase(session: Stripe.Checkout.Session, userId: number) {
  const productId = session.metadata?.product_id || '';
  const durationMs = parseInt(session.metadata?.duration_ms || '0', 10);
  const quantity = parseInt(session.metadata?.quantity || '0', 10);
  const product = getPowerUpById(productId);

  // Create payment record
  await db.createPayment({
    userId,
    stripeCustomerId: session.customer as string,
    stripePaymentIntentId: session.payment_intent as string,
    type: 'power_up',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    itemId: productId,
  });

  // Handle different power-up types
  if (productId === 'profile_boost') {
    const expiresAt = new Date(Date.now() + durationMs);
    await db.createPowerUp({
      userId,
      type: 'profile_boost',
      expiresAt,
      multiplier: 10,
    });
  } else if (productId === 'super_likes') {
    await db.addSuperLikes(userId, quantity);
  } else if (productId === 'incognito') {
    const expiresAt = new Date(Date.now() + durationMs);
    await db.createPowerUp({
      userId,
      type: 'incognito',
      expiresAt,
    });
  }

  // Notify owner
  await notifyOwner({
    title: '⚡ New Power-Up Purchase!',
    content: `User ${userId} purchased ${product?.name || productId}. Amount: $${((session.amount_total || 0) / 100).toFixed(2)}`,
  });
}

/**
 * Handle moment purchase (legacy)
 */
async function handleMomentPurchase(session: Stripe.Checkout.Session, userId: number) {
  const momentId = session.metadata?.moment_id || '';
  const durationMs = parseInt(session.metadata?.duration_ms || '0', 10);
  const moment = getMomentById(momentId);

  // Create payment record
  await db.createPayment({
    userId,
    stripeCustomerId: session.customer as string,
    stripePaymentIntentId: session.payment_intent as string,
    type: 'moment_purchase',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    itemId: momentId,
  });

  // Create moment purchase
  const expiresAt = new Date(Date.now() + durationMs);
  await db.createMomentPurchase({
    userId,
    momentId,
    expiresAt,
    price: session.amount_total || 0,
  });

  // Notify owner
  await notifyOwner({
    title: '✨ New Moment Purchase!',
    content: `User ${userId} purchased ${moment?.name || momentId}. Amount: $${((session.amount_total || 0) / 100).toFixed(2)}`,
  });
}

/**
 * Calculate expiry time for "Unlimited Tonight" (6 AM next morning)
 */
function calculateTonightExpiry(): Date {
  const now = new Date();
  const expiry = new Date(now);
  
  // If before 6 AM, expire at 6 AM today
  // If after 6 AM, expire at 6 AM tomorrow
  if (now.getHours() < 6) {
    expiry.setHours(6, 0, 0, 0);
  } else {
    expiry.setDate(expiry.getDate() + 1);
    expiry.setHours(6, 0, 0, 0);
  }
  
  return expiry;
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Subscription ${subscription.id} updated, status: ${subscription.status}`);
  
  // We primarily handle subscription status through checkout.session.completed
  // This is for additional updates like plan changes
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Subscription ${subscription.id} canceled`);
  
  // Find and update the subscription in our database
  // The subscription will naturally expire based on expiresAt
  
  await notifyOwner({
    title: '😢 Subscription Canceled',
    content: `Stripe subscription ${subscription.id} was canceled.`,
  });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Invoice ${invoice.id} paid`);
  
  // For recurring subscription payments
  // Subscription info is available in invoice.lines.data
  // This is handled automatically by Stripe, but we can update our records
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Invoice ${invoice.id} payment failed`);
  
  await notifyOwner({
    title: '⚠️ Payment Failed',
    content: `Invoice ${invoice.id} payment failed. Customer may need to update payment method.`,
  });
}
