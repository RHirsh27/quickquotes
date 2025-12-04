# Stripe Connect Integration Guide

This document explains the complete Stripe Connect integration in Quotd, including onboarding, product creation, and storefront functionality.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Connected Account Creation](#connected-account-creation)
5. [Account Onboarding](#account-onboarding)
6. [Product Management](#product-management)
7. [Storefront](#storefront)
8. [Checkout & Payments](#checkout--payments)
9. [Webhooks](#webhooks)
10. [Testing](#testing)

---

## Overview

This Stripe Connect integration enables teams to:

1. **Connect** their Stripe account to accept payments
2. **Create products** on their connected account
3. **Sell products** through a public storefront
4. **Receive payments** directly to their Stripe account (minus 1% platform fee)

### Key Features

- **Controller-based accounts** (API version 2025-11-17.clover)
- **Direct Charges** with application fees (1% platform fee)
- **Full dashboard access** for connected accounts
- **Hosted Checkout** for secure payment processing
- **Real-time status** updates via webhooks

---

## Architecture

### Account Structure

```
Platform Account (Quotd)
  └─> Connected Accounts (Teams)
        ├─> Products
        ├─> Prices
        └─> Payments
```

### Data Flow

```
1. Team onboards → Stripe Connect Account created
2. Team creates products → Products created on connected account
3. Customer visits storefront → Products fetched from connected account
4. Customer purchases → Checkout session created on connected account
5. Payment completes → Money goes to connected account (minus 1% fee)
```

---

## Setup & Configuration

### Environment Variables

**Required Variables:**

```bash
# Stripe API Keys (LIVE)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs
NEXT_PUBLIC_APP_URL=https://www.quotd.app
NEXT_PUBLIC_SITE_URL=https://www.quotd.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Migration

Run this migration to add Stripe Connect fields to the teams table:

```sql
-- Add Stripe Connect columns to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_account_status text DEFAULT 'pending';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_stripe_account_id
ON public.teams(stripe_account_id);

-- Add comments for documentation
COMMENT ON COLUMN public.teams.stripe_account_id
IS 'Stripe Connect account ID for receiving payments';

COMMENT ON COLUMN public.teams.stripe_account_status
IS 'Status of Stripe Connect account: pending, active, restricted';
```

### Stripe Dashboard Configuration

1. **Enable Stripe Connect:**
   - Go to https://dashboard.stripe.com/settings/connect
   - Enable Express accounts

2. **Add OAuth Redirect URIs:**
   ```
   https://www.quotd.app/settings/payments?connect=success
   https://www.quotd.app/settings/payments?connect=refresh
   ```

3. **Configure Webhooks:**
   - URL: `https://www.quotd.app/api/stripe/webhook`
   - Events: `account.updated`, `checkout.session.completed`

---

## Connected Account Creation

### Creating Accounts with Controller Properties

**File:** `src/app/actions/stripe-connect.ts`

```typescript
// IMPORTANT: Use controller properties instead of deprecated "type" property
const account = await stripe.accounts.create({
  controller: {
    // Platform controls fee collection - connected account pays Stripe fees
    fees: {
      payer: 'account' as const
    },
    // Stripe handles payment disputes and losses (not platform)
    losses: {
      payments: 'stripe' as const
    },
    // Connected account gets full access to Stripe dashboard
    stripe_dashboard: {
      type: 'full' as const
    }
  },
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'individual', // Default, user can change in onboarding
})
```

### Controller Properties Explained

| Property | Value | Purpose |
|----------|-------|---------|
| `controller.fees.payer` | `'account'` | Connected account pays Stripe fees |
| `controller.losses.payments` | `'stripe'` | Stripe handles disputes/chargebacks |
| `controller.stripe_dashboard.type` | `'full'` | Full dashboard access for account |

**⚠️ IMPORTANT:** Never use top-level `type: 'express'` or `type: 'standard'`. Always use controller properties.

---

## Account Onboarding

### Onboarding Flow

1. User clicks "Connect Stripe Account" in Settings → Payments
2. Server creates Connect account (if doesn't exist)
3. Server generates Account Link
4. User redirected to Stripe onboarding
5. User completes business info, bank details
6. User redirected back to app
7. Webhook updates account status

### Onboarding Code

**File:** `src/app/actions/stripe-connect.ts`

```typescript
export async function createConnectOnboardingLink(accountId: string) {
  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/settings/payments?connect=refresh`,
    return_url: `${baseUrl}/settings/payments?connect=success`,
    type: 'account_onboarding',
  })

  return { url: accountLink.url }
}
```

### Checking Account Status

**Get status directly from Stripe API:**

```typescript
export async function getConnectAccountStatus(accountId: string) {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(accountId)

  return {
    charges_enabled: account.charges_enabled || false,
    details_submitted: account.details_submitted || false,
    payouts_enabled: account.payouts_enabled || false,
    email: account.email,
    country: account.country,
  }
}
```

### Account Status States

| Status | Meaning |
|--------|---------|
| `pending` | Account created but onboarding not complete |
| `active` | `charges_enabled` && `details_submitted` |
| `restricted` | Account has requirements or is disabled |

---

## Product Management

### Creating Products on Connected Accounts

**File:** `src/app/actions/stripe-connect.ts`

```typescript
export async function createConnectProduct(data: {
  name: string
  description: string
  priceInCents: number
  currency?: string
}) {
  const stripe = getStripe()

  // Validate inputs
  if (!data.name || data.priceInCents <= 0) {
    return { error: 'Invalid product data' }
  }

  // Create product on connected account using Stripe-Account header
  const product = await stripe.products.create({
    name: data.name,
    description: data.description || undefined,
    default_price_data: {
      unit_amount: data.priceInCents,
      currency: data.currency || 'usd',
    },
  }, {
    // IMPORTANT: Use stripeAccount to set Stripe-Account header
    // This creates the product on the connected account, not the platform
    stripeAccount: team.stripe_account_id,
  })

  return {
    productId: product.id,
    priceId: product.default_price as string,
    name: product.name,
  }
}
```

### Listing Products

```typescript
const products = await stripe.products.list({
  limit: 100,
  active: true,
  expand: ['data.default_price'],
}, {
  stripeAccount: accountId, // Fetch from connected account
})
```

### Products UI

**Page:** `/settings/products`

**File:** `src/app/(dashboard)/settings/products/page.tsx`

Features:
- Create new products with name, description, price
- View all products for connected account
- Prices automatically converted from dollars to cents
- Real-time product list updates

---

## Storefront

### Public Storefront URL

```
https://www.quotd.app/storefront/[accountId]
```

**⚠️ Production Note:** In production, replace `[accountId]` with a custom identifier (team slug, subdomain, etc.) and look up the Stripe account ID from your database.

### Fetching Products for Storefront

**API:** `GET /api/storefront/[accountId]/products`

**File:** `src/app/api/storefront/[accountId]/products/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params

  // Fetch products from connected account
  const stripe = getStripe()
  const products = await stripe.products.list({
    limit: 100,
    active: true,
    expand: ['data.default_price'],
  }, {
    // Use stripeAccount to query the connected account's products
    stripeAccount: accountId,
  })

  return NextResponse.json({
    products: products.data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceId: p.default_price?.id,
      price: p.default_price?.unit_amount || 0,
      currency: p.default_price?.currency || 'usd',
    }))
  })
}
```

### Storefront UI

**Page:** `/storefront/[accountId]`

**File:** `src/app/storefront/[accountId]/page.tsx`

Features:
- Grid layout of products
- Product images (or placeholder)
- Product name, description, price
- "Buy Now" button for each product
- Responsive design

---

## Checkout & Payments

### Creating Checkout Sessions with Application Fees

**API:** `POST /api/storefront/[accountId]/checkout`

**File:** `src/app/api/storefront/[accountId]/checkout/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params
  const { priceId, quantity = 1 } = await request.json()

  // Fetch price to calculate application fee
  const stripe = getStripe()
  const price = await stripe.prices.retrieve(priceId, {
    stripeAccount: accountId,
  })

  // Calculate application fee (1% of total)
  const totalAmount = price.unit_amount * quantity
  const applicationFeeAmount = Math.round(totalAmount * 0.01) // 1% fee

  // Create checkout session with Direct Charge
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    mode: 'payment',

    // Application fee for platform monetization
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      metadata: {
        type: 'storefront_purchase',
        connected_account: accountId,
      },
    },

    success_url: `${baseUrl}/storefront/${accountId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/storefront/${accountId}`,

    metadata: {
      type: 'storefront_purchase',
      connected_account: accountId,
    },
  }, {
    // CRITICAL: Create checkout on the connected account
    stripeAccount: accountId,
  })

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  })
}
```

### Application Fee Breakdown

Example: $100 purchase

```
Total Amount:        $100.00
Platform Fee (1%):     $1.00
To Connected Account: $99.00
Stripe Fees:          ~$3.20 (paid by connected account)
Net to Seller:        ~$95.80
```

### Direct Charges vs Destination Charges

This integration uses **Direct Charges**:

| Feature | Direct Charge (Used) | Destination Charge |
|---------|---------------------|-------------------|
| Payment goes to | Connected account | Platform account |
| Application fee | Taken from payment | Added to transfer |
| Dispute liability | Connected account | Platform |
| Stripe fees paid by | Connected account | Connected account |
| Dashboard visibility | Connected account | Platform |

Documentation: https://docs.stripe.com/connect/direct-charges

---

## Webhooks

### Account Status Updates

**Event:** `account.updated`

**File:** `src/app/api/stripe/webhook/route.ts`

```typescript
case 'account.updated': {
  const account = event.data.object as Stripe.Account

  // Find team by stripe_account_id
  const { data: teamData } = await supabase
    .from('teams')
    .select('id')
    .eq('stripe_account_id', account.id)
    .single()

  if (!teamData) break

  // Determine account status
  let accountStatus = 'pending'
  if (account.charges_enabled && account.details_submitted) {
    accountStatus = 'active'
  } else if (account.requirements?.disabled_reason) {
    accountStatus = 'restricted'
  }

  // Update team's Connect account status
  await supabase
    .from('teams')
    .update({ stripe_account_status: accountStatus })
    .eq('stripe_account_id', account.id)

  console.log(`[Webhook] Updated Connect account status: ${accountStatus}`)
  break
}
```

### Payment Confirmation

**Event:** `checkout.session.completed`

Handle storefront purchases separately from SaaS subscriptions:

```typescript
const session = event.data.object as Stripe.Checkout.Session

if (session.metadata?.type === 'storefront_purchase') {
  // Handle storefront purchase
  // - Send confirmation email
  // - Update inventory
  // - Fulfill order
} else if (session.metadata?.type === 'subscription') {
  // Handle SaaS subscription
  // - Activate user account
  // - Update subscription record
}
```

---

## Testing

### Test Flow Checklist

1. **✅ Account Creation**
   - [ ] Create Connect account
   - [ ] Verify account saved to database
   - [ ] Check account status is 'pending'

2. **✅ Onboarding**
   - [ ] Click "Connect Stripe Account"
   - [ ] Complete Stripe onboarding
   - [ ] Verify redirect to success page
   - [ ] Check status updates to 'active'

3. **✅ Product Creation**
   - [ ] Navigate to `/settings/products`
   - [ ] Create product with name, description, price
   - [ ] Verify product appears in list
   - [ ] Check product exists in Stripe dashboard

4. **✅ Storefront**
   - [ ] Visit `/storefront/[accountId]`
   - [ ] Verify products display correctly
   - [ ] Check prices format correctly

5. **✅ Checkout**
   - [ ] Click "Buy Now" on a product
   - [ ] Complete Stripe Checkout (use test card: 4242 4242 4242 4242)
   - [ ] Verify redirect to success page
   - [ ] Check payment in Stripe dashboard

6. **✅ Application Fee**
   - [ ] Check Stripe dashboard → Connected Accounts → Account
   - [ ] Verify 1% application fee was deducted
   - [ ] Confirm 99% went to connected account

### Test Mode vs Live Mode

```bash
# Test Mode Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Live Mode Keys (Production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**⚠️ WARNING:** This app currently uses **LIVE KEYS**. All transactions are real.

### Test Cards

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined card |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

More: https://stripe.com/docs/testing

---

## API Reference

### Server Actions

**File:** `src/app/actions/stripe-connect.ts`

| Function | Purpose | Returns |
|----------|---------|---------|
| `createConnectAccount()` | Create Connect account for team | `{ accountId, exists }` |
| `createConnectOnboardingLink(accountId)` | Generate onboarding URL | `{ url }` |
| `getConnectAccountStatus(accountId)` | Fetch account status from Stripe | `{ charges_enabled, payouts_enabled, ... }` |
| `createConnectLoginLink(accountId)` | Access Express dashboard | `{ url }` |
| `getTeamConnectAccount()` | Get team's account ID | `{ accountId, status }` |
| `createConnectProduct(data)` | Create product on connected account | `{ productId, priceId, name }` |
| `listConnectProducts()` | List connected account products | `{ products: [...] }` |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/storefront/[accountId]/products` | GET | Fetch products for storefront |
| `/api/storefront/[accountId]/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |

---

## Security Considerations

### 1. Account ID in URL

**Current:** `/storefront/acct_123abc`

**Production:** `/storefront/acme-corp`

```typescript
// Look up Stripe account from custom identifier
const team = await db.teams.findOne({ slug: 'acme-corp' })
const stripeAccountId = team.stripe_account_id
```

### 2. Webhook Signature Verification

Always verify webhook signatures:

```typescript
const signature = headersList.get('stripe-signature')
const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
```

### 3. Price Validation

Always fetch price from Stripe before creating checkout:

```typescript
// Don't trust price from client
const price = await stripe.prices.retrieve(priceId, {
  stripeAccount: accountId
})

// Use Stripe's price for checkout
const applicationFeeAmount = Math.round(price.unit_amount * quantity * 0.01)
```

### 4. Owner-Only Access

Only team owners can create Connect accounts and products:

```typescript
if (teamMember.role !== 'owner') {
  return { error: 'Only team owners can connect Stripe' }
}
```

---

## Common Issues & Solutions

### Issue: "No Stripe Connect account found"

**Cause:** Team hasn't completed onboarding

**Solution:** Complete onboarding in Settings → Payments

### Issue: "Account not ready to accept payments"

**Cause:** `charges_enabled` is false

**Solution:** Complete all onboarding requirements in Stripe dashboard

### Issue: "Invalid Stripe account"

**Cause:** Account ID incorrect or doesn't exist

**Solution:** Verify account ID in database matches Stripe

### Issue: "Application fee exceeds payment amount"

**Cause:** Fee calculation error

**Solution:** Ensure fee is calculated from total amount:
```typescript
const applicationFeeAmount = Math.round(totalAmount * 0.01)
```

---

## Resources

- [Stripe Connect Documentation](https://docs.stripe.com/connect)
- [Direct Charges Guide](https://docs.stripe.com/connect/direct-charges)
- [Account Links API](https://docs.stripe.com/api/account_links)
- [Testing Connect](https://docs.stripe.com/connect/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

## Support

For questions or issues:

1. Check Stripe logs: https://dashboard.stripe.com/logs
2. Check webhook delivery: https://dashboard.stripe.com/webhooks
3. Review server logs in Vercel
4. Test in Stripe test mode first

---

**Last Updated:** 2025-12-03

**API Version:** 2025-11-17.clover
