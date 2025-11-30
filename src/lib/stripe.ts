import Stripe from 'stripe'

/**
 * Server-side Stripe client
 * Use this in API routes, server actions, and server components
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

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

