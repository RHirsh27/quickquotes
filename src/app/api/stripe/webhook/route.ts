import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Activate user's SaaS subscription in the subscriptions table
 */
async function activateSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('[Webhook] No userId in checkout session metadata')
    throw new Error('No userId in checkout session metadata')
  }

  if (!session.subscription) {
    console.error('[Webhook] No subscription ID in checkout session')
    throw new Error('No subscription ID in checkout session')
  }

  // Get subscription details from Stripe
  const stripe = getStripe()
  const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
    { expand: ['items.data.price.product'] }
  ) as Stripe.Subscription

  // Update or create subscription record
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status as string,
      plan_id: subscription.items.data[0]?.price.id || null,
      current_period_end: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })

  if (upsertError) {
    console.error('[Webhook] Error upserting subscription:', upsertError)
    throw upsertError
  }

  console.log(`[Webhook] Subscription activated for user ${userId}`)
}

/**
 * Update invoice status to 'paid' in the invoices table
 */
async function updateInvoicePayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  // Get invoice ID from metadata (set in create-payment route)
  const invoiceId = session.metadata?.invoiceId

  if (!invoiceId) {
    console.error('[Webhook] No invoiceId in checkout session metadata')
    throw new Error('No invoiceId in checkout session metadata')
  }

  // Update invoice status to 'paid' and set paid_at timestamp
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ 
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('id', invoiceId)

  if (updateError) {
    console.error('[Webhook] Error updating invoice status:', updateError)
    throw updateError
  }

  console.log(`[Webhook] Invoice ${invoiceId} marked as paid`)
}

export async function POST(req: NextRequest) {
  // Get the raw body as text (required for webhook signature verification)
  const rawBody = await req.text()
  
  // Get the signature from the stripe-signature header
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] No Stripe signature found in headers')
    return NextResponse.json({ error: 'No Stripe signature' }, { status: 400 })
  }

  // Verify the webhook signature
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadataType = session.metadata?.type

        if (metadataType === 'subscription') {
          // Activate the user's SaaS plan in the subscriptions table
          await activateSubscription(supabase, session)
        } else if (metadataType === 'invoice_payment') {
          // This is a "Connect" payment - update the invoices table status to 'paid'
          await updateInvoicePayment(supabase, session)
        } else {
          console.warn(`[Webhook] Unhandled metadata.type: ${metadataType} in checkout.session.completed`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        // If no userId in metadata, try to get it from existing subscription record
        if (!userId) {
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!existingSub) {
            console.error('[Webhook] No userId found for subscription update')
            break
          }
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as string,
            plan_id: subscription.items.data[0]?.price.id || null,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
          throw updateError
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('[Webhook] Error canceling subscription:', updateError)
          throw updateError
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        
        // Find user by stripe_connect_id (more reliable than metadata)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_connect_id', account.id)
          .single()

        if (userError || !userData) {
          console.error('[Webhook] No user found for Stripe Connect account:', account.id)
          break
        }

        // Update payouts_enabled status based on account.payouts_enabled
        const { error: updateError } = await supabase
          .from('users')
          .update({
            payouts_enabled: account.payouts_enabled || false,
          })
          .eq('stripe_connect_id', account.id)

        if (updateError) {
          console.error('[Webhook] Error updating payouts_enabled:', updateError)
          throw updateError
        }

        console.log(`[Webhook] Updated payouts_enabled for account ${account.id}: ${account.payouts_enabled}`)
        break
      }

      default:
        console.warn(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[Webhook] Error handling webhook event:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
