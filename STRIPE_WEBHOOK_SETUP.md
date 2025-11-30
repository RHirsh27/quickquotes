# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks for QuickQuotes.

## Webhook Configuration

### 1. Get Your Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Development**: `http://localhost:3000/api/stripe/webhook` (use Stripe CLI)
   - **Production**: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 2. Local Development with Stripe CLI

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret (different from production). Use this in your `.env.local` for local testing.

### 3. Test Webhooks

Use Stripe CLI to trigger test events:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted
```

### 4. Webhook Events Handled

The webhook handler processes these events:

#### `checkout.session.completed`
- Triggered when a customer completes checkout
- Creates or updates subscription record in database
- Maps `stripe_customer_id` to `user_id` via metadata

#### `customer.subscription.updated`
- Triggered when subscription status changes (e.g., payment succeeds/fails)
- Updates subscription status, plan_id, and current_period_end

#### `customer.subscription.deleted`
- Triggered when subscription is canceled
- Updates subscription status to 'canceled'

## Security

- **Webhook signature verification**: All webhooks are verified using the signing secret
- **Metadata mapping**: User ID is passed in checkout metadata to ensure correct mapping
- **Error handling**: Failed webhooks are logged but don't crash the server

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check server logs for signature verification errors
4. Ensure webhook endpoint is publicly accessible (for production)

### User ID not found
- Ensure `userId` is passed in checkout session metadata
- Check that metadata is preserved in subscription metadata
- Verify user exists in database before processing webhook

### Subscription not updating
- Check database connection
- Verify RLS policies allow updates
- Check server logs for database errors

