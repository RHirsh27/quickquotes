/**
 * Single Source of Truth for Pricing Strategy
 * All pricing-related logic should reference this configuration
 */

export type PlanId = 'SOLO' | 'CREW' | 'TEAM'

export interface PricingPlan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  userLimit: number
  stripePriceId: string
  description: string
  features: string[]
  label?: string // Optional label like "Best Value"
  footer?: string // Optional footer text like "+ $25/seat after 10 users"
  seatPrice?: number // Price per additional seat (for Team plan overage)
}

// =============================================================================
// ⚠️ CRITICAL: STRIPE PRICE IDs MUST BE CONFIGURED BEFORE PRODUCTION LAUNCH
// =============================================================================
// Follow these steps to set up Stripe pricing:
//
// 1. Go to Stripe Dashboard > Products: https://dashboard.stripe.com/products
// 2. Create 4 recurring products with the following details:
//
//    Product 1: "Solo Plan"
//      - Price: $29/month (recurring)
//      - Copy the Price ID (starts with "price_") and paste below as SOLO stripePriceId
//      - Also set in .env: NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_xxx
//
//    Product 2: "Crew Plan"
//      - Price: $99/month (recurring)
//      - Copy the Price ID and paste below as CREW stripePriceId
//      - Also set in .env: NEXT_PUBLIC_STRIPE_PRICE_CREW=price_xxx
//
//    Product 3: "Team Plan"
//      - Price: $199/month (recurring)
//      - Copy the Price ID and paste below as TEAM stripePriceId
//      - Also set in .env: NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_xxx
//
//    Product 4: "Extra Seat" (for Team plan overage)
//      - Price: $25/month (recurring)
//      - Copy the Price ID and paste below as EXTRA_SEAT_PRICE_ID
//      - Also set in .env: NEXT_PUBLIC_STRIPE_EXTRA_SEAT_PRICE_ID=price_xxx
//
// 3. Update both this file AND your .env file with the Price IDs
// 4. Verify all IDs match between this file and environment variables
// 5. Test checkout flow before launching
// =============================================================================

export const EXTRA_SEAT_PRICE_ID = "price_1SZhk5CCOgkFoQDAw4bb166l"; // Extra Seat Price ID for Team plan overage ($25/month)

export const APPLICATION_FEE_PERCENT = 0.01; // 1% platform fee on Stripe Connect payments

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  SOLO: {
    id: 'SOLO',
    name: "Solo",
    price: 29,
    interval: "month",
    userLimit: 1,
    stripePriceId: "price_1SZBBcCCOgkFoQDA9XbZzVpz",
    description: "For the owner-operator.",
    features: ["Unlimited Quotes", "Branded PDF", "Client History", "Accept Credit Cards"]
  },
  CREW: {
    id: 'CREW',
    name: "Crew",
    price: 99,
    interval: "month",
    userLimit: 5,
    stripePriceId: "price_1SZBCVCCOgkFoQDA1I8d7xnu",
    description: "For small crews (up to 5).",
    features: ["Everything in Solo", "Up to 5 Users", "Shared Price Book", "Team Dashboard"],
    label: "Best Value"
  },
  TEAM: {
    id: 'TEAM',
    name: "Team",
    price: 199,
    interval: "month",
    userLimit: 10,
    stripePriceId: "price_1SZBDTCCOgkFoQDA0seUDd2R",
    description: "For growing businesses.",
    features: ["Everything in Crew", "Up to 10 Users", "Role Permissions", "Priority Support"],
    footer: "+ $25/seat after 10 users",
    seatPrice: 25
  }
} as const

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: PlanId): PricingPlan {
  return PRICING_PLANS[planId]
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
export function getNextPlan(currentPlanId: PlanId): PricingPlan | null {
  const planOrder: PlanId[] = ['SOLO', 'CREW', 'TEAM']
  const currentIndex = planOrder.indexOf(currentPlanId)
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null
  }
  return PRICING_PLANS[planOrder[currentIndex + 1]]
}

/**
 * Get plan by ID (case-insensitive)
 */
export function getPlanByIdCaseInsensitive(planId: string): PricingPlan | null {
  const upperPlanId = planId.toUpperCase() as PlanId
  return PRICING_PLANS[upperPlanId] || null
}

