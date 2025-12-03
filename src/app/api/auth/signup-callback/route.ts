import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient, createAdminClient } from '@/lib/supabase/api'
import { randomBytes } from 'crypto'

/**
 * GET /api/auth/signup-callback?session_id=xxx
 * Handles post-payment account creation after successful Stripe Checkout
 *
 * Flow:
 * 1. User completes Stripe Checkout
 * 2. Stripe redirects here with session_id
 * 3. We fetch Stripe session to get customer email
 * 4. Create Supabase account with that email
 * 5. Create team and subscription records via DB trigger
 * 6. Send welcome email
 * 7. Redirect to dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  console.log('[Signup Callback] Processing signup for session:', sessionId)

  if (!sessionId) {
    console.error('[Signup Callback] No session_id provided')
    return NextResponse.redirect(new URL('/?error=invalid_callback', request.url))
  }

  try {
    // Fetch Stripe session with expanded data
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'subscription.items.data.price.product'],
    })

    console.log('[Signup Callback] Retrieved Stripe session:', {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: session.customer_details?.email,
      status: session.status,
      paymentStatus: session.payment_status,
    })

    // Verify payment was successful
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.error('[Signup Callback] Payment not completed:', session.payment_status)
      return NextResponse.redirect(new URL('/?error=payment_failed', request.url))
    }

    // Get customer email from Stripe
    const customerEmail = session.customer_details?.email
    if (!customerEmail) {
      console.error('[Signup Callback] No customer email in session')
      return NextResponse.redirect(new URL('/?error=missing_email', request.url))
    }

    // Get subscription details
    const subscription = session.subscription as any
    if (!subscription) {
      console.error('[Signup Callback] No subscription in session')
      return NextResponse.redirect(new URL('/?error=missing_subscription', request.url))
    }

    // Generate a temporary password (user will reset via email)
    const tempPassword = randomBytes(32).toString('hex')

    // Create Supabase account
    // NOTE: This will trigger handle_new_user() which creates:
    // - User profile in public.users
    // - Team in public.teams
    // - Team membership in public.team_members
    // - Default service presets
    // - Trial subscription record (we'll update it with Stripe data)
    const supabaseAdmin = createAdminClient()
    const supabase = createClient(request)

    console.log('[Signup Callback] Creating Supabase account for:', customerEmail)

    const { data: signUpData, error: signUpError} = await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm since they paid
      user_metadata: {
        full_name: session.customer_details?.name || '',
        company_name: session.customer_details?.name || 'My Company',
        phone: session.customer_details?.phone || '',
        stripe_customer_id: session.customer as string,
        signup_source: 'stripe_checkout',
      },
    })

    if (signUpError || !signUpData.user) {
      console.error('[Signup Callback] Error creating Supabase account:', signUpError)

      // Check if user already exists
      if (signUpError?.message?.includes('already registered')) {
        console.log('[Signup Callback] User already exists, updating subscription')

        // Get existing user
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email === customerEmail)

        if (!existingUser) {
          console.error('[Signup Callback] Could not find existing user')
          return NextResponse.redirect(new URL('/?error=account_creation_failed', request.url))
        }

        // Update subscription for existing user
        await updateSubscriptionRecord(supabase, existingUser.id, session, subscription)

        // Sign in the user and redirect
        return await signInAndRedirect(request, customerEmail, existingUser.id)
      }

      return NextResponse.redirect(new URL('/?error=account_creation_failed', request.url))
    }

    const userId = signUpData.user.id
    console.log('[Signup Callback] Supabase account created:', userId)

    // Update the trial subscription record with Stripe data
    // The DB trigger created a basic trial record, now we add Stripe IDs and plan info
    await updateSubscriptionRecord(supabase, userId, session, subscription)

    // Send welcome email with password reset link
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(customerEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/update-password`,
      })

      if (resetError) {
        console.error('[Signup Callback] Error sending welcome email:', resetError)
        // Don't fail the whole flow, user can request reset later
      } else {
        console.log('[Signup Callback] Welcome email sent to:', customerEmail)
      }
    } catch (emailError) {
      console.error('[Signup Callback] Exception sending welcome email:', emailError)
    }

    // Sign in the user and redirect to dashboard
    return await signInAndRedirect(request, customerEmail, userId)

  } catch (error: any) {
    console.error('[Signup Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/?error=signup_failed&message=' + encodeURIComponent(error.message), request.url))
  }
}

/**
 * Update subscription record with Stripe data
 */
async function updateSubscriptionRecord(
  supabase: any,
  userId: string,
  session: any,
  subscription: any
) {
  const planId = subscription.items?.data?.[0]?.price?.id
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  console.log('[Signup Callback] Updating subscription record:', {
    userId,
    customerId: session.customer,
    subscriptionId: subscription.id,
    status: subscription.status,
    planId,
  })

  const { error: updateError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_id: planId,
      current_period_end: currentPeriodEnd,
      is_trial: subscription.status === 'trialing',
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    }, {
      onConflict: 'user_id',
    })

  if (updateError) {
    console.error('[Signup Callback] Error updating subscription:', updateError)
    throw new Error('Failed to update subscription record')
  }

  console.log('[Signup Callback] Subscription record updated successfully')
}

/**
 * Sign in the user and redirect to dashboard with success message
 */
async function signInAndRedirect(request: NextRequest, email: string, userId: string) {
  const supabaseAdmin = createAdminClient()

  // Generate a one-time login link
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  console.log('[Signup Callback] Generating sign-in link for:', email)

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${baseUrl}/dashboard?welcome=true`,
    },
  })

  if (error || !data.properties?.hashed_token) {
    console.error('[Signup Callback] Error generating sign-in link:', error)
    // Fallback: redirect to login with message
    return NextResponse.redirect(new URL('/login?message=account_created', request.url))
  }

  // Create the verify URL manually
  const verifyUrl = `${baseUrl}/api/auth/verify?token_hash=${data.properties.hashed_token}&type=magiclink&next=/dashboard?welcome=true`

  console.log('[Signup Callback] Redirecting to:', verifyUrl)

  return NextResponse.redirect(verifyUrl)
}
