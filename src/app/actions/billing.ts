'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { getPlanByStripePriceId, type PlanId } from '@/config/pricing'

export interface BillingPortalResult {
  success: boolean
  url?: string
  message?: string
}

export interface SubscriptionInfo {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid' | 'paused' | null
  planId: PlanId | null
  planName: string
  isTrial: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  teamMemberCount: number
  teamMemberLimit: number
}

/**
 * Get the current user's subscription information
 */
export async function getSubscriptionInfo(): Promise<{ success: boolean; data?: SubscriptionInfo; message?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to view subscription information.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Get subscription data
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get team member count
    const { count: memberCount, error: memberError } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', primaryTeamId)

    if (memberError) {
      console.error('Error fetching team member count:', memberError)
    }

    // Default values if no subscription
    if (subError || !subscription) {
      return {
        success: true,
        data: {
          status: null,
          planId: null,
          planName: 'Free',
          isTrial: false,
          trialEndsAt: null,
          currentPeriodEnd: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          teamMemberCount: memberCount || 1,
          teamMemberLimit: 1,
        }
      }
    }

    // Get plan details from pricing config
    const plan = subscription.plan_id ? getPlanByStripePriceId(subscription.plan_id) : null
    
    return {
      success: true,
      data: {
        status: subscription.status as SubscriptionInfo['status'],
        planId: plan?.id || null,
        planName: plan?.name || 'Unknown',
        isTrial: subscription.is_trial || false,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodEnd: subscription.current_period_end,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        teamMemberCount: memberCount || 1,
        teamMemberLimit: plan?.userLimit || 1,
      }
    }
  } catch (error: any) {
    console.error('Error getting subscription info:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Create a Stripe billing portal session
 * Returns URL to redirect user to Stripe's hosted portal
 * Stripe will handle upgrades/downgrades/cancellations
 */
export async function createBillingPortalSession(): Promise<BillingPortalResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to access billing settings.'
      }
    }

    // Get user's subscription to find Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return {
        success: false,
        message: 'No active subscription found. Please subscribe to a plan first.'
      }
    }

    // Create Stripe billing portal session
    const stripe = getStripe()
    
    // Use NEXT_PUBLIC_SITE_URL for the return URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/settings/billing`,
    })

    return {
      success: true,
      url: session.url,
    }
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return {
      success: false,
      message: error.message || 'Failed to open billing portal. Please try again.'
    }
  }
}

/**
 * Create a checkout session to upgrade to a new plan
 */
export async function createUpgradeSession(priceId: string): Promise<BillingPortalResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to upgrade your plan.'
      }
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    // If no Stripe customer yet (still on trial without entering payment), 
    // redirect to checkout
    if (!subscription?.stripe_customer_id || !subscription?.stripe_subscription_id) {
      const stripe = getStripe()
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      // Get user's team_id for metadata
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const plan = getPlanByStripePriceId(priceId)
      
      // Create or get customer
      let customerId = subscription?.stripe_customer_id
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
            teamId: teamMember?.team_id || 'none',
          },
        })
        customerId = customer.id

        // Update subscription record with customer ID
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id)
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        payment_method_collection: 'always',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/settings/billing?success=true`,
        cancel_url: `${baseUrl}/settings/billing?canceled=true`,
        metadata: {
          type: 'subscription',
          userId: user.id,
          teamId: teamMember?.team_id || 'none',
          planId: plan?.id || 'unknown',
          planName: plan?.name || 'Unknown',
        },
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            userId: user.id,
            teamId: teamMember?.team_id || 'none',
            planId: plan?.id || 'unknown',
            planName: plan?.name || 'Unknown',
          },
        },
      })

      return {
        success: true,
        url: session.url || undefined,
      }
    }

    // If user has an active subscription, use billing portal for upgrade/downgrade
    // The billing portal handles proration automatically
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/settings/billing`,
    })

    return {
      success: true,
      url: session.url,
    }
  } catch (error: any) {
    console.error('Error creating upgrade session:', error)
    return {
      success: false,
      message: error.message || 'Failed to start upgrade process. Please try again.'
    }
  }
}
