import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Only handle subscription checkout sessions
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.userId
          
          if (!userId) {
            console.error('No userId in checkout session metadata')
            break
          }
          
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ['items.data.price.product'] }
          )

          const supabase = await createClient()
          
          // Check if subscription record exists
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (existingSub) {
            // Update existing record
            await supabase
              .from('subscriptions')
              .update({
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                status: subscription.status as string,
                plan_id: subscription.items.data[0]?.price.id || null,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', existingSub.id)
          } else {
            // Create new record
            await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                status: subscription.status as string,
                plan_id: subscription.items.data[0]?.price.id || null,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        const supabase = await createClient()
        
        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as string,
            plan_id: subscription.items.data[0]?.price.id || null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        const supabase = await createClient()
        
        // Update subscription status to canceled
        // Use subscription_id as primary identifier (more reliable than metadata)
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

