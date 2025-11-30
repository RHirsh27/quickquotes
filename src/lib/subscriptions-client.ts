/**
 * Client-safe subscription utilities
 * These functions don't require server-side code and can be used in Client Components
 */

/**
 * Get subscription limits based on plan ID
 * This is a pure function that can be used in both client and server components
 */
export function getSubscriptionLimits(planId: string | null): { maxUsers: number; planName: string } {
  // Default to free tier if no plan
  if (!planId) {
    return { maxUsers: 1, planName: 'Free' }
  }

  // Map Stripe Price IDs to limits
  // TODO: Replace these with your actual Stripe Price IDs
  const planLimits: Record<string, { maxUsers: number; planName: string }> = {
    // Solo Professional - 1 user (the owner)
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || 'price_solo']: {
      maxUsers: 1,
      planName: 'Solo Professional',
    },
    // Small Team - 3 users total
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || 'price_team']: {
      maxUsers: 3,
      planName: 'Small Team',
    },
    // Business - Unlimited (999 is effectively unlimited)
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || 'price_business']: {
      maxUsers: 999,
      planName: 'Business',
    },
  }

  return planLimits[planId] || { maxUsers: 1, planName: 'Free' }
}

