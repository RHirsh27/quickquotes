/**
 * Single Source of Truth for Pricing Strategy
 * All pricing-related logic should reference this configuration
 */

export type PlanId = 'STARTER' | 'GROWTH' | 'PRO'

// Legacy plan IDs for backward compatibility
export type LegacyPlanId = 'SOLO' | 'CREW' | 'TEAM'

export interface PricingPlan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  userLimit: number // Kept for backward compatibility (maps to calendarLimit)
  calendarLimit: number // New: Number of active calendars allowed
  stripePriceId: string
  description: string
  features: string[]
  label?: string // Optional label like "Best Value" or "MOST POPULAR"
  footer?: string // Optional footer text
  seatPrice?: number // Price per additional seat (for overage)
}

// =============================================================================
// ⚠️ CRITICAL: STRIPE PRICE IDs MUST BE CONFIGURED BEFORE PRODUCTION LAUNCH
// =============================================================================
// Follow these steps to set up Stripe pricing:
//
// 1. Go to Stripe Dashboard > Products: https://dashboard.stripe.com/products
// 2. Create 3 recurring products with the following details:
//
//    Product 1: "Starter Plan"
//      - Price: $29/month (recurring)
//      - Copy the Price ID (starts with "price_") and paste below as STARTER stripePriceId
//      - Update: Replace "price_starter_id_placeholder" with actual Price ID
//
//    Product 2: "Growth Plan"
//      - Price: $99/month (recurring)
//      - Copy the Price ID and paste below as GROWTH stripePriceId
//      - Update: Replace "price_growth_id_placeholder" with actual Price ID
//
//    Product 3: "Pro Plan"
//      - Price: $199/month (recurring)
//      - Copy the Price ID and paste below as PRO stripePriceId
//      - Update: Replace "price_pro_id_placeholder" with actual Price ID
//
// 3. Update this file with the actual Stripe Price IDs
// 4. Test checkout flow before launching
// =============================================================================

// Note: Extra seat pricing removed - new model uses calendar limits instead
export const EXTRA_SEAT_PRICE_ID = ""; // No longer used with new pricing model

export const APPLICATION_FEE_PERCENT = 0.01; // 1% platform fee on Stripe Connect payments

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  STARTER: {
    id: 'STARTER',
    name: "Starter",
    price: 29,
    interval: "month",
    userLimit: 1, // Maps to calendarLimit for backward compatibility
    calendarLimit: 1,
    stripePriceId: "price_starter_id_placeholder", // Update with actual Stripe Price ID
    description: "For the solo operator.",
    features: ["1 Active Calendar", "Unlimited Quotes", "Basic CRM"]
  },
  GROWTH: {
    id: 'GROWTH',
    name: "Growth",
    price: 99,
    interval: "month",
    userLimit: 3, // Maps to calendarLimit for backward compatibility
    calendarLimit: 3,
    stripePriceId: "price_growth_id_placeholder", // Update with actual Stripe Price ID
    description: "For small crews needing dispatch.",
    features: ["Up to 3 Active Calendars", "Magic Link Booking", "SMS Reminders"],
    label: "MOST POPULAR"
  },
  PRO: {
    id: 'PRO',
    name: "Pro",
    price: 199,
    interval: "month",
    userLimit: 999, // Maps to calendarLimit for backward compatibility
    calendarLimit: 999, // Unlimited
    stripePriceId: "price_pro_id_placeholder", // Update with actual Stripe Price ID
    description: "For growing businesses.",
    features: ["Unlimited Calendars", "AI Agent", "Fleet Tracking"]
  }
} as const

// Legacy plan mapping for backward compatibility
const LEGACY_PLAN_MAP: Record<LegacyPlanId, PlanId> = {
  SOLO: 'STARTER',
  CREW: 'GROWTH',
  TEAM: 'PRO'
}

/**
 * Get a plan by its ID (supports both new and legacy plan IDs)
 */
export function getPlanById(planId: PlanId | LegacyPlanId): PricingPlan {
  // Handle legacy plan IDs
  if (planId in LEGACY_PLAN_MAP) {
    const mappedId = LEGACY_PLAN_MAP[planId as LegacyPlanId]
    return PRICING_PLANS[mappedId]
  }
  return PRICING_PLANS[planId as PlanId]
}

/**
 * Get a plan by its Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): PricingPlan | null {
  const plan = Object.values(PRICING_PLANS).find(
    (p) => p.stripePriceId === stripePriceId
  )
  return plan || null
}

/**
 * Get all plans as an array
 */
export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS)
}

/**
 * Get the next plan (for upgrade suggestions)
 */
export function getNextPlan(currentPlanId: PlanId | LegacyPlanId): PricingPlan | null {
  // Map legacy plan IDs to new ones
  const mappedPlanId = currentPlanId in LEGACY_PLAN_MAP 
    ? LEGACY_PLAN_MAP[currentPlanId as LegacyPlanId]
    : currentPlanId as PlanId
    
  const planOrder: PlanId[] = ['STARTER', 'GROWTH', 'PRO']
  const currentIndex = planOrder.indexOf(mappedPlanId)
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null
  }
  return PRICING_PLANS[planOrder[currentIndex + 1]]
}

/**
 * Get plan by ID (case-insensitive, supports both new and legacy plan IDs)
 */
export function getPlanByIdCaseInsensitive(planId: string): PricingPlan | null {
  const upperPlanId = planId.toUpperCase()
  
  // Try new plan IDs first
  if (upperPlanId in PRICING_PLANS) {
    return PRICING_PLANS[upperPlanId as PlanId]
  }
  
  // Try legacy plan IDs
  if (upperPlanId in LEGACY_PLAN_MAP) {
    const mappedId = LEGACY_PLAN_MAP[upperPlanId as LegacyPlanId]
    return PRICING_PLANS[mappedId]
  }
  
  return null
}

