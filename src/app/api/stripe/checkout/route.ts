import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/api'
import { getPlanByStripePriceId } from '@/config/pricing'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (using API route client)
    const supabase = createClient(request)
    
    // Try to get user - this will refresh the session if needed
    let { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // If getUser fails, try getSession as fallback
    if (userError || !user) {
      console.warn('[Checkout] getUser failed, trying getSession:', userError?.message)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (session?.user) {
        user = session.user
        userError = null
        console.log('[Checkout] Recovered user from session')
      }
    }

    // Debug logging
    const allCookies = request.cookies.getAll()
    console.log('[Checkout] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
      cookieNames: allCookies.map(c => c.name),
      cookieCount: allCookies.length,
      hasAuthToken: allCookies.some(c => c.name.includes('auth-token')),
      hasCodeVerifier: allCookies.some(c => c.name.includes('code-verifier'))
    })

    if (userError || !user) {
      console.error('[Checkout] Unauthorized:', {
        error: userError?.message || 'No user found',
        cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
        cookieCount: allCookies.length
      })
      return NextResponse.json(
        { error: 'Your session has expired. Please refresh the page and try again, or sign out and sign in again.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { priceId } = body

    // Log checkout start
    console.log('[Checkout] Starting checkout for price:', priceId)

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Validate priceId against PRICING_PLANS config
    const plan = getPlanByStripePriceId(priceId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid price ID. This plan is not configured.' },
        { status: 400 }
      )
    }

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'This plan is not yet available. Please contact support.' },
        { status: 400 }
      )
    }

    // Get user's team_id for metadata
    let teamId: string | null = null
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (teamMember?.team_id) {
      teamId = teamMember.team_id
      console.log('[Checkout] Found team_id:', teamId)
    } else {
      console.warn('[Checkout] No team found for user:', user.id)
    }

    // Check if user already has a subscription (might be a trial)
    let customerId: string | null = null
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      console.log('[Checkout] Using existing customer:', customerId)
    } else {
      // Create Stripe customer
      const stripe = getStripe()
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
          teamId: teamId || 'none',
        },
      })
      customerId = customer.id
      console.log('[Checkout] Created new customer:', customerId)

      // Update existing subscription with customer ID (preserves trial status and other fields)
      // OR insert new subscription if none exists
      if (existingSubscription) {
        // User has a trial subscription - just add the customer ID
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('[Checkout] Error saving customer ID to trial subscription:', updateError)
          throw new Error('Failed to save Stripe customer ID.')
        }

        console.log('[Checkout] Added customer ID to existing trial subscription')
      } else {
        // No subscription exists - create one (shouldn't happen with trial flow, but handle it)
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'incomplete',
            is_trial: false,
          })

        if (insertError) {
          console.error('[Checkout] Error inserting subscription:', insertError)
          throw new Error('Failed to save Stripe customer ID.')
        }

        console.log('[Checkout] Created new subscription record')
      }
    }

    // Create checkout session with 14-day trial
    const stripe = getStripe()
    // Use NEXT_PUBLIC_SITE_URL for Vercel, fallback to request origin for localhost
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    console.log('[Checkout] Creating Stripe checkout session...', {
      priceId,
      planName: plan.name,
      customerId,
      teamId,
      userEmail: user.email,
    })

    let session
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId || undefined,
        customer_email: !customerId ? user.email || undefined : undefined, // Only set if no customer ID
        mode: 'subscription',
        payment_method_types: ['card'],
        payment_method_collection: 'always', // Always collect payment method during trial
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/finish-setup`, // Return to finish-setup if canceled
        metadata: {
          type: 'subscription', // CRITICAL: Required for webhook to activate subscription
          userId: user.id,
          teamId: teamId || 'none',
          planId: plan.id,
          planName: plan.name,
        },
        subscription_data: {
          trial_period_days: 14, // 14-day trial period
          metadata: {
            userId: user.id,
            teamId: teamId || 'none',
            planId: plan.id,
            planName: plan.name,
          },
        },
      })

      console.log('[Checkout] Stripe session created successfully:', {
        sessionId: session.id,
        url: session.url,
        status: session.status,
      })
    } catch (stripeError: any) {
      console.error('[Checkout] Stripe Error:', stripeError)
      return NextResponse.json(
        { error: stripeError.message || 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('[Checkout] Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
