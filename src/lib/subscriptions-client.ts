/**
 * Client-safe subscription utilities
 * These functions don't require server-side code and can be used in Client Components
 */

import { getPlanByStripePriceId, PRICING_PLANS } from '@/config/pricing'

/**
 * Get subscription limits based on plan ID (Stripe Price ID)
 * This is a pure function that can be used in both client and server components
 * Uses PRICING_PLANS as the single source of truth
 */
export function getSubscriptionLimits(planId: string | null): { maxUsers: number; planName: string } {
  // Default to free tier if no plan
  if (!planId) {
    return { maxUsers: 1, planName: 'Free' }
  }

  // Get plan from PRICING_PLANS config
  const plan = getPlanByStripePriceId(planId)
  
  if (plan) {
    return {
      maxUsers: plan.userLimit,
      planName: plan.name,
    }
  }

  // Fallback to free tier if plan not found
  return { maxUsers: 1, planName: 'Free' }
}

