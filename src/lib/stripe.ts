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

/**
 * Update subscription seats for Enterprise plan
 * Enterprise plan includes 12 users, then charges $25/seat for additional users
 * 
 * @param subscriptionId - Stripe subscription ID
 * @param totalUsers - Total number of users in the team
 * @returns Promise<void>
 */
export async function updateSubscriptionSeats(
  subscriptionId: string,
  totalUsers: number
): Promise<void> {
  const stripe = getStripe()
  
  // Get the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  })

  // Check if this is an Enterprise plan by looking at the plan ID
  const { EXTRA_SEAT_PRICE_ID, PRICING_PLANS } = await import('@/config/pricing')
  const enterprisePlan = PRICING_PLANS.ENTERPRISE
  
  // Validate EXTRA_SEAT_PRICE_ID is configured
  if (!EXTRA_SEAT_PRICE_ID || EXTRA_SEAT_PRICE_ID === 'price_YOUR_ID_HERE') {
    console.warn('[Stripe] EXTRA_SEAT_PRICE_ID not configured, skipping seat update')
    return
  }
  
  // Find the main plan item (not the extra seat item)
  const mainPlanItem = subscription.items.data.find(
    (item) => item.price.id === enterprisePlan.stripePriceId
  )

  // If not Enterprise plan, do nothing
  if (!mainPlanItem) {
    console.log('[Stripe] Subscription is not Enterprise plan, skipping seat update')
    return
  }

  // Calculate billable seats (Enterprise includes first 12 users)
  const billableSeats = Math.max(0, totalUsers - 12)

  // Find existing extra seat item
  const existingSeatItem = subscription.items.data.find(
    (item) => item.price.id === EXTRA_SEAT_PRICE_ID
  )

  if (billableSeats > 0) {
    // Need to add or update extra seat item
    if (existingSeatItem) {
      // Update existing item quantity
      if (existingSeatItem.quantity !== billableSeats) {
        await stripe.subscriptionItems.update(existingSeatItem.id, {
          quantity: billableSeats,
        })
        console.log(`[Stripe] Updated extra seat quantity to ${billableSeats}`)
      } else {
        console.log(`[Stripe] Extra seat quantity already correct: ${billableSeats}`)
      }
    } else {
      // Add new item for extra seats
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: mainPlanItem.id, // Keep existing main plan item unchanged
          },
          {
            price: EXTRA_SEAT_PRICE_ID,
            quantity: billableSeats,
          },
        ],
      })
      console.log(`[Stripe] Added ${billableSeats} extra seat(s) to subscription`)
    }
  } else {
    // No billable seats - remove extra seat item if it exists
    if (existingSeatItem) {
      await stripe.subscriptionItems.del(existingSeatItem.id)
      console.log('[Stripe] Removed extra seat item (no billable seats)')
    } else {
      console.log('[Stripe] No extra seat item to remove')
    }
  }
}
