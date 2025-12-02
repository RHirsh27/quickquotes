# Quotd - Production Deployment Guide

This guide will walk you through deploying Quotd to production.

## Prerequisites

- [ ] Supabase account and project created
- [ ] Stripe account (with products configured)
- [ ] Resend account for transactional emails
- [ ] Vercel account (recommended) or other Next.js hosting
- [ ] Domain name (optional but recommended)

---

## Step 1: Supabase Setup

### 1.1 Create Database Schema

1. Go to your Supabase project: https://app.supabase.com/project/_/sql
2. Run all SQL migration files in this order:
   - `supabase-setup.sql`
   - `supabase-migration-teams.sql`
   - `supabase-migration-subscriptions.sql`
   - `supabase-migration-invoices.sql`
   - `supabase-migration-stripe-connect.sql`
   - All other migration files

### 1.2 Verify Database Setup

Check that these tables exist:
- `users`
- `customers`
- `quotes`
- `quote_line_items`
- `service_presets`
- `subscriptions`
- `invoices`
- `invoice_items`
- `teams`
- `team_members`

### 1.3 Get Supabase Credentials

1. Go to Project Settings > API
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (starts with eyJ)

---

## Step 2: Stripe Setup

### 2.1 Create Products

Go to https://dashboard.stripe.com/products and create 4 recurring products:

**Product 1: Solo Plan**
- Name: "Solo Plan"
- Price: $29.00 USD
- Billing: Recurring monthly
- Copy the **Price ID** (starts with `price_`)

**Product 2: Crew Plan**
- Name: "Crew Plan"
- Price: $99.00 USD
- Billing: Recurring monthly
- Copy the **Price ID**

**Product 3: Team Plan**
- Name: "Team Plan"
- Price: $199.00 USD
- Billing: Recurring monthly
- Copy the **Price ID**

**Product 4: Extra Seat**
- Name: "Extra Seat"
- Price: $25.00 USD
- Billing: Recurring monthly
- Copy the **Price ID**

### 2.2 Get Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy these values:
   - **Publishable Key**: `pk_live_...` (for production)
   - **Secret Key**: `sk_live_...` (for production)

⚠️ **Important**: Use test keys (`pk_test_` and `sk_test_`) for development!

### 2.3 Set Up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

---

## Step 3: Resend Setup

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy the key (starts with `re_`)
4. (Optional) Add and verify your custom domain for better email deliverability

---

## Step 4: Configure Environment Variables

### 4.1 Update Local Configuration (Development)

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all values in `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Stripe (use TEST keys for development)
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_...
   NEXT_PUBLIC_STRIPE_PRICE_CREW=price_...
   NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Email
   RESEND_API_KEY=re_...
   ADMIN_EMAIL=your-email@example.com
   ```

### 4.2 Update Code Configuration

1. Open `src/config/pricing.ts`
2. Replace empty `stripePriceId` values with your Stripe Price IDs:
   ```typescript
   SOLO: {
     stripePriceId: "price_1234567890...",  // Your Solo Plan Price ID
     // ...
   },
   CREW: {
     stripePriceId: "price_0987654321...",  // Your Crew Plan Price ID
     // ...
   },
   TEAM: {
     stripePriceId: "price_abcdefghij...",  // Your Team Plan Price ID
     // ...
   }
   ```
3. Set `EXTRA_SEAT_PRICE_ID` to your Extra Seat Price ID

---

## Step 5: Test Locally

### 5.1 Install Dependencies
```bash
npm install
```

### 5.2 Run Development Server
```bash
npm run dev
```

### 5.3 Test Critical Flows

- [ ] Sign up new account
- [ ] Log in
- [ ] Create a quote
- [ ] View pricing page (should show all plans)
- [ ] Attempt checkout (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify subscription activates after payment
- [ ] Test Stripe Connect onboarding
- [ ] Create and send invoice
- [ ] Test invoice payment

### 5.4 Test Webhook Locally (Optional)

Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Step 6: Deploy to Vercel

### 6.1 Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 6.2 Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Set Framework Preset: **Next.js**
4. Add environment variables (see Step 6.3)
5. Click "Deploy"

### 6.3 Configure Production Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ⚠️ Use LIVE keys for production!
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Same Price IDs as development (prices are same in test and live mode)
NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_...
NEXT_PUBLIC_STRIPE_PRICE_CREW=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...

# Production webhook secret (different from test)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your production domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Resend (same key for all environments)
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@yourdomain.com
```

### 6.4 Update Stripe Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Update webhook endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
3. Make sure it's using your production webhook secret

---

## Step 7: Post-Deployment Verification

### 7.1 Verify Deployment

1. Visit your production URL
2. Check that all pages load correctly
3. Verify no console errors

### 7.2 Test Critical User Flows

- [ ] Sign up for new account
- [ ] Log in with existing account
- [ ] View pricing page
- [ ] Complete real checkout (use real card or Stripe test mode)
- [ ] Verify email receipts are sent
- [ ] Test quote creation and PDF generation
- [ ] Test invoice payment flow

### 7.3 Verify Webhooks

1. Complete a test subscription purchase
2. Go to Stripe Dashboard > Developers > Webhooks
3. Check webhook logs - should show successful deliveries
4. Verify subscription appears in database

### 7.4 Monitor Errors

- Check Vercel deployment logs
- Monitor Stripe webhook delivery status
- Check email delivery in Resend dashboard

---

## Step 8: Optional Enhancements

### 8.1 Set Up Custom Domain

1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### 8.2 Enable Analytics

**Vercel Analytics** (Recommended - easiest):
```bash
npm install @vercel/analytics
```

Add to `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 8.3 Set Up Error Monitoring

**Sentry** (Recommended):
```bash
npx @sentry/wizard@latest -i nextjs
```

Follow the wizard prompts to configure.

### 8.4 Configure Email Domain

1. In Resend Dashboard, add your custom domain
2. Add DNS records (MX, TXT, CNAME)
3. Verify domain
4. Update `DEFAULT_FROM_EMAIL` in `src/lib/resend.ts`

---

## Troubleshooting

### Environment Variable Issues

**Error**: "Missing required environment variables"
- **Solution**: Verify all required env vars are set in Vercel Dashboard
- **Check**: Run `npm run build` locally to test
- **Verify**: Variables match exactly between .env.local and Vercel

### Webhook Failures

**Error**: Stripe webhooks return 400/500
- **Solution**: Check webhook secret matches in Stripe Dashboard and env vars
- **Check**: Webhook URL is correct (https://yourdomain.com/api/stripe/webhook)
- **Verify**: Endpoint is publicly accessible

### Subscription Not Activating

**Error**: User pays but subscription doesn't activate
- **Solution**: Check webhook logs in Stripe Dashboard
- **Check**: `checkout.session.completed` event is enabled
- **Verify**: Database has subscriptions table with proper structure

### Email Not Sending

**Error**: Emails fail to send
- **Solution**: Verify Resend API key is correct
- **Check**: Domain is verified in Resend (if using custom domain)
- **Verify**: Resend sending limit not exceeded

### Build Failures

**Error**: Vercel build fails
- **Solution**: Test build locally first: `npm run build`
- **Check**: All dependencies are in package.json
- **Verify**: No TypeScript errors

---

## Security Checklist

Before going live, verify:

- [ ] Using Stripe **live** keys (not test keys)
- [ ] Stripe webhook secret is production secret
- [ ] All environment variables are set
- [ ] RLS policies enabled on all Supabase tables
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Security headers configured (done via next.config.mjs)
- [ ] No sensitive data in client-side code
- [ ] `.env.local` and `.env` are in `.gitignore`
- [ ] Stripe Price IDs match between code and env vars

---

## Monitoring Checklist

Set up monitoring for:

- [ ] Vercel deployment logs
- [ ] Stripe webhook delivery status
- [ ] Resend email delivery
- [ ] Supabase database performance
- [ ] Error tracking (Sentry recommended)
- [ ] Uptime monitoring (optional)

---

## Support

If you encounter issues:

1. Check Vercel logs: https://vercel.com/dashboard
2. Check Stripe webhook logs: https://dashboard.stripe.com/webhooks
3. Check Supabase logs: https://app.supabase.com/project/_/logs
4. Check Resend logs: https://resend.com/logs

---

## Next Steps After Launch

1. **Monitor for 24 hours**: Watch for errors, webhook failures, email issues
2. **Test with real users**: Have beta testers try the full flow
3. **Set up analytics**: Track conversion rates and user behavior
4. **Add error monitoring**: Implement Sentry for production error tracking
5. **Create documentation**: Write user guides and FAQs
6. **Plan marketing**: Prepare launch announcement and marketing materials

---

**Congratulations on your production deployment! 🚀**

For questions or issues, refer to the documentation:
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
- Vercel: https://vercel.com/docs
