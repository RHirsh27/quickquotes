import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('No userId in checkout session metadata')
          break
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
            current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
          }, {
            onConflict: 'user_id', // Conflict on user_id to update existing row
            ignoreDuplicates: false // Ensure update happens
          })

        if (upsertError) {
          console.error('Error upserting subscription in webhook:', upsertError)
          throw upsertError
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
            console.error('No userId found for subscription update')
            break
          }
        }

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as string,
            plan_id: subscription.items.data[0]?.price.id || null,
            current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled', // Explicitly set to canceled
            current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      default:
        console.warn(`Unhandled event type: ${event.type}`)
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error handling webhook event:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
