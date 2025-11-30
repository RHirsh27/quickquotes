import Stripe from 'stripe'

/**
 * Server-side Stripe client
 * Use this in API routes, server actions, and server components
 * Lazy initialization to avoid build-time errors when env vars are not set
 */
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover', // Use latest stable API version
      typescript: true,
    })
  }
  return stripeInstance
}

// Note: Use getStripe() instead of importing stripe directly to avoid build-time initialization

/**
 * Get Stripe publishable key for client-side use
 */
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return key
}

/**
 * Stripe subscription status types
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

/**
 * Helper to check if subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return status === 'active' || status === 'trialing'
}
