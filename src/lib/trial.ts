/**
 * Trial Period Management
 * Handles 14-day trial creation and validation
 */

import { createClient } from '@/lib/supabase/server'

const TRIAL_DAYS = 14

/**
 * Create a trial subscription for a new user
 * Gives them 14 days of full access
 */
export async function createTrialSubscription(userId: string) {
  const supabase = await createClient()

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status: 'trialing',
      is_trial: true,
      trial_ends_at: trialEndsAt.toISOString(),
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('[Trial] Error creating trial subscription:', error)
    throw error
  }

  console.log(`[Trial] Created 14-day trial for user ${userId}, expires: ${trialEndsAt.toISOString()}`)
  return data
}

/**
 * Check if user has an active trial or paid subscription
 * Returns status info for UI display
 */
export async function getSubscriptionStatus(userId: string) {
  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !subscription) {
    return {
      hasAccess: false,
      isTrial: false,
      isPaid: false,
      trialDaysRemaining: 0,
      trialEndsAt: null,
      status: null,
    }
  }

  // Check if trial is active
  if (subscription.is_trial && subscription.trial_ends_at) {
    const trialEndDate = new Date(subscription.trial_ends_at)
    const now = new Date()
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining > 0) {
      // Trial is still active
      return {
        hasAccess: true,
        isTrial: true,
        isPaid: false,
        trialDaysRemaining: daysRemaining,
        trialEndsAt: subscription.trial_ends_at,
        status: subscription.status,
      }
    } else {
      // Trial has expired
      return {
        hasAccess: false,
        isTrial: true,
        isPaid: false,
        trialDaysRemaining: 0,
        trialEndsAt: subscription.trial_ends_at,
        status: 'expired',
      }
    }
  }

  // Check if paid subscription is active
  const isPaidActive = ['active', 'trialing'].includes(subscription.status || '')

  return {
    hasAccess: isPaidActive,
    isTrial: false,
    isPaid: isPaidActive,
    trialDaysRemaining: 0,
    trialEndsAt: null,
    status: subscription.status,
  }
}

/**
 * Convert trial to paid subscription
 * Called after successful Stripe checkout
 */
export async function convertTrialToPaid(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan_id: planId,
      status: 'active',
      is_trial: false,
      trial_ends_at: null,
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('[Trial] Error converting trial to paid:', error)
    throw error
  }

  console.log(`[Trial] Converted trial to paid subscription for user ${userId}`)
  return data
}
