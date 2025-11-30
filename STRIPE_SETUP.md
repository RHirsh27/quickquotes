# Stripe Subscriptions Setup Guide

This guide explains how to set up Stripe subscriptions for QuickQuotes.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (from Stripe Dashboard)

## Setup Steps

### 1. Install Dependencies

Dependencies have been installed:
- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe SDK

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (get these from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... # Server-side secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Client-side publishable key

# Optional: Webhook secret (for webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important:**
- Use test keys (`sk_test_` and `pk_test_`) for development
- Use live keys (`sk_live_` and `pk_live_`) for production
- Never commit secret keys to git
- Add `.env.local` to `.gitignore`

### 3. Database Migration

Run the subscription table migration:

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase-migration-subscriptions.sql`
3. Click **Run** to execute

This will create:
- `subscriptions` table with RLS policies
- Indexes for performance
- Triggers for automatic `updated_at` updates
- Unique constraint to prevent duplicate active subscriptions

### 4. Create Stripe Products and Prices

In your Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create products for your pricing tiers:
   - **Free Plan**: $0/month (or create as a one-time product)
   - **Pro Plan**: $19/month (recurring)
3. Copy the **Price ID** (starts with `price_`) - you'll need this in your code

Example Price IDs:
- Free: `price_free` (or handle as no subscription)
- Pro: `price_1234567890abcdef` (your actual Stripe Price ID)

### 5. Stripe Client Configuration

The Stripe client is configured in `src/lib/stripe.ts`:

- **Server-side**: Use `stripe` export for API routes and server actions
- **Client-side**: Use `@stripe/stripe-js` and `getStripePublishableKey()`

Example server-side usage:
```typescript
import { stripe } from '@/lib/stripe'

// Create a customer
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { userId: user.id }
})
```

Example client-side usage:
```typescript
import { loadStripe } from '@stripe/stripe-js'
import { getStripePublishableKey } from '@/lib/stripe'

const stripe = await loadStripe(getStripePublishableKey())
```

## Subscription Status Values

The `status` field in the subscriptions table can be:

- `active` - Subscription is active and paid
- `trialing` - In trial period
- `past_due` - Payment failed, retrying
- `canceled` - Subscription was canceled
- `incomplete` - Payment incomplete
- `incomplete_expired` - Payment incomplete and expired
- `unpaid` - Payment failed and retries exhausted
- `paused` - Subscription is paused (if supported)

## Next Steps

1. **Create Checkout Session API Route**: Handle subscription creation
2. **Create Webhook Handler**: Sync subscription status from Stripe
3. **Update Frontend**: Add subscription management UI
4. **Add Middleware**: Check subscription status for premium features

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

See more test cards: https://stripe.com/docs/testing

## Security Notes

- Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Never expose `STRIPE_SECRET_KEY` to the client
- Use RLS policies to ensure users can only access their own subscriptions
- Validate subscription status before granting access to premium features

