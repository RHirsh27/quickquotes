import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/api'
import { getPlanByStripePriceId } from '@/config/pricing'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (using API route client)
    const supabase = createClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Debug logging
    console.log('[Checkout] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    if (userError || !user) {
      console.error('[Checkout] Unauthorized:', userError?.message || 'No user found')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign out and sign in again' },
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

    // Check if user already has a Stripe customer ID
    let customerId: string | null = null
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
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

      // Store customer ID in database
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'incomplete',
        }, {
          onConflict: 'user_id', // Conflict on user_id to update existing row
          ignoreDuplicates: false // Ensure update happens
        })

      if (upsertError) {
        console.error('[Checkout] Error upserting subscription with customer ID:', upsertError)
        throw new Error('Failed to save Stripe customer ID.')
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
        success_url: `${baseUrl}/dashboard?payment=success`,
        cancel_url: `${baseUrl}/finish-setup`, // Return to finish-setup if canceled
        metadata: {
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
