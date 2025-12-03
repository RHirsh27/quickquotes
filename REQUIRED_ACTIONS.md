# 🔴 Required Actions & Configuration Checklist

**Last Updated**: December 2024

This document lists all actions you must complete before launching Quotd to production.

---

## 🔴 CRITICAL - Must Complete Before Launch

### 1. Environment Variables in Vercel (15 minutes)
**Status**: ⚠️ **MUST CONFIGURE**

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://cmjhtwyhchzquepzamuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_[your-live-key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# Stripe Price IDs (Required - Already configured in code, but verify)
NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_1SZBBcCCOgkFoQDA9XbZzVpz
NEXT_PUBLIC_STRIPE_PRICE_CREW=price_1SZBCVCCOgkFoQDA1I8d7xnu
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_1SZBDTCCOgkFoQDA0seUDd2R
NEXT_PUBLIC_STRIPE_EXTRA_SEAT_PRICE_ID=price_1SZhk5CCOgkFoQDAw4bb166l

# App URL (Required)
NEXT_PUBLIC_APP_URL=https://www.quotd.app

# Email (Optional but Recommended)
RESEND_API_KEY=[get-from-resend.com]
ADMIN_EMAIL=[your-admin-email]
```

**Action**: 
- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Settings → Environment Variables
- [ ] Add each variable above
- [ ] Set environment to: **Production, Preview, Development** (all)
- [ ] Save changes

---

### 2. Database Migrations (20 minutes)
**Status**: ⚠️ **MUST VERIFY & RUN**

Run these SQL scripts in **Supabase Dashboard → SQL Editor** in order:

**Required Migrations:**
1. [ ] `supabase-setup.sql` (base schema + RLS)
2. [ ] `supabase-upgrade-address.sql` (address fields)
3. [ ] `supabase-migration-teams.sql` (teams + multi-tenancy)
4. [ ] `supabase-migration-subscriptions.sql` (billing tables)
5. [ ] `supabase-migration-invoices.sql` (invoice system)
6. [ ] `supabase-migration-invoices-public-access.sql` (public payment page)
7. [ ] `supabase-migration-invoices-quote-conversion.sql` (quote → invoice)
8. [ ] `supabase-migration-stripe-connect.sql` (Stripe Connect)
9. [ ] `supabase-migration-stripe-connect-payouts.sql` (payouts enabled flag)
10. [ ] `supabase-migration-add-job-summary.sql` (job summary field)
11. [ ] `supabase-migration-add-amount-paid.sql` (amount paid field)
12. [ ] `supabase-migration-teams-general-settings.sql` (team settings)
13. [ ] `supabase-migration-trial-auto-create.sql` (trial subscription auto-create)
14. [ ] `supabase-migration-legal-settings.sql` (warranty/disclosure text)

**Verification**:
- [ ] All tables exist: `users`, `customers`, `quotes`, `quote_line_items`, `service_presets`, `teams`, `team_members`, `subscriptions`, `invoices`, `invoice_items`
- [ ] RLS enabled on all tables
- [ ] Test authentication works (try signing up a test user)

---

### 3. Stripe Webhook Configuration (10 minutes)
**Status**: ⚠️ **MUST CONFIGURE**

**Steps**:
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Check if production webhook exists for `https://www.quotd.app/api/stripe/webhook`
- [ ] If not, click "Add endpoint"
- [ ] Endpoint URL: `https://www.quotd.app/api/stripe/webhook`
- [ ] Events to send:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `account.updated` (for Stripe Connect)
- [ ] Copy webhook signing secret
- [ ] Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

**Verification**:
- [ ] Test webhook by creating a test subscription
- [ ] Check Stripe Dashboard → Webhooks → [Your webhook] → Recent deliveries
- [ ] Should see successful 200 responses

---

### 4. Supabase Authentication URLs (5 minutes)
**Status**: ⚠️ **MUST CONFIGURE**

**Steps**:
- [ ] Go to https://app.supabase.com/project/cmjhtwyhchzquepzamuk/auth/url-configuration
- [ ] Set **Site URL**: `https://www.quotd.app`
- [ ] Add **Redirect URLs**:
  - [ ] `https://www.quotd.app/auth/callback`
  - [ ] `https://www.quotd.app/reset-password`
  - [ ] `https://www.quotd.app/dashboard`
  - [ ] `http://localhost:3000/auth/callback` (for local dev)
  - [ ] `http://localhost:3000/reset-password` (for local dev)
- [ ] Save configuration

---

### 5. Email Configuration (15 minutes)
**Status**: ⚠️ **RECOMMENDED FOR PRODUCTION**

**Option A: Use Supabase Email (Limited)**
- [ ] Supabase free tier: 3 emails/hour
- [ ] Good for testing, not production

**Option B: Custom SMTP (Recommended)**
- [ ] Go to Supabase Dashboard → Project Settings → Auth → SMTP Settings
- [ ] Configure SMTP provider (Gmail, SendGrid, Mailgun, etc.)
- [ ] Test email delivery

**Option C: Resend (Recommended)**
- [ ] Sign up at https://resend.com
- [ ] Get API key
- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [ ] Verify domain in Resend (optional but recommended)
- [ ] Update `DEFAULT_FROM_EMAIL` in `src/lib/resend.ts` if using custom domain

**Action**:
- [ ] Choose email provider
- [ ] Configure SMTP or Resend
- [ ] Test email delivery (signup, password reset)
- [ ] Verify emails arrive (check spam folder)

---

### 6. Custom Domain & DNS (10 minutes + DNS wait)
**Status**: ⚠️ **MUST CONFIGURE**

**Steps**:
- [ ] In Vercel Dashboard → Settings → Domains
- [ ] Add domain: `www.quotd.app`
- [ ] Add domain: `quotd.app` (redirect to www)
- [ ] Copy DNS records provided by Vercel
- [ ] Go to your domain registrar (GoDaddy, Namecheap, etc.)
- [ ] Update DNS records:
  - [ ] A record: `@` → Vercel IP (provided)
  - [ ] CNAME record: `www` → `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Verify SSL certificate is active (automatic via Vercel)

**Verification**:
- [ ] Visit https://www.quotd.app (should load)
- [ ] Check SSL (should show green padlock)
- [ ] Visit http://quotd.app (should redirect to https://www.quotd.app)

---

## 🟡 IMPORTANT - Complete Within 24 Hours

### 7. Update Email Addresses (5 minutes)
**Status**: ⚠️ **UPDATE HARDCODED VALUES**

**Files to Update**:

1. **`src/lib/resend.ts`** (Line 13):
   ```typescript
   export const DEFAULT_FROM_EMAIL = 'noreply@quotd.app' // ⚠️ Update to your verified domain
   ```

2. **`src/app/api/feedback/route.ts`** (Line 4):
   ```typescript
   const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quotd.app' // ⚠️ Set ADMIN_EMAIL env var or update default
   ```

**Action**:
- [ ] Update `DEFAULT_FROM_EMAIL` to your verified Resend domain
- [ ] Set `ADMIN_EMAIL` environment variable in Vercel
- [ ] Or update default in `src/app/api/feedback/route.ts`

---

### 8. Run npm Audit (2 minutes)
**Status**: ⚠️ **RECOMMENDED**

**Steps**:
- [ ] Run: `npm audit fix`
- [ ] Run: `npm audit` (verify 0 vulnerabilities)
- [ ] Commit changes if `package-lock.json` updated

**Expected**: May fix 3 high-severity vulnerabilities in `glob` (via eslint-config-next)

---

### 9. Production Testing (30 minutes)
**Status**: ⚠️ **MUST TEST BEFORE LAUNCH**

**Test These Critical Flows**:

**Authentication**:
- [ ] Sign up with new account
- [ ] Verify email confirmation works
- [ ] Log in with confirmed account
- [ ] Test password reset flow
- [ ] Test logout

**Subscription Flow**:
- [ ] Visit `/finish-setup` (should show plans)
- [ ] Select SOLO plan ($29/month)
- [ ] Complete Stripe checkout with test card: `4242 4242 4242 4242`
- [ ] Verify redirect to dashboard
- [ ] Check subscription status in Stripe Dashboard
- [ ] Verify subscription row created in Supabase

**Core Features**:
- [ ] Create a customer
- [ ] Create a quote for customer
- [ ] Add line items to quote
- [ ] Generate PDF (download works)
- [ ] Edit quote
- [ ] Delete quote (confirmation dialog works)
- [ ] View quotes list

**Team Features**:
- [ ] Invite team member (from Settings → Team)
- [ ] Verify invitation email sent
- [ ] Accept invitation
- [ ] Verify RBAC (member can't access owner features)

**Invoice/Payment**:
- [ ] Convert quote to invoice
- [ ] Visit public payment page (`/pay/[id]`)
- [ ] Complete payment with test card
- [ ] Verify invoice marked as "paid"
- [ ] Check payment received email sent

---

## 🟢 OPTIONAL - Post-Launch Improvements

### 10. Error Monitoring Setup (15 minutes)
**Status**: ⬜ Optional but Recommended

Install Sentry for production error tracking:

**Steps**:
- [ ] Run: `npx @sentry/wizard@latest -i nextjs`
- [ ] Create Sentry account (or use existing)
- [ ] Follow wizard prompts
- [ ] Test error reporting (trigger a test error)
- [ ] Verify errors appear in Sentry Dashboard

**Why**: Critical for debugging production issues without access to server logs.

---

### 11. Analytics Setup (10 minutes)
**Status**: ⬜ Optional

**Vercel Analytics** (Free):
- [ ] Go to Vercel Dashboard → Analytics
- [ ] Enable Analytics
- [ ] Track key metrics (page views, conversion rate)

**Stripe Dashboard Monitoring**:
- [ ] Set up email alerts for failed payments
- [ ] Monitor webhook delivery health
- [ ] Track MRR (Monthly Recurring Revenue)

---

## 📋 Quick Reference

### Supabase Dashboard
- URL: https://app.supabase.com/project/cmjhtwyhchzquepzamuk
- Key Sections:
  - Authentication → URL Configuration
  - SQL Editor (for migrations)
  - Table Editor (to verify tables)
  - Logs → Auth Logs (for debugging)

### Stripe Dashboard
- URL: https://dashboard.stripe.com
- Key Sections:
  - Products (verify pricing plans)
  - Developers → Webhooks (configure webhook)
  - API Keys (get secret keys)

### Vercel Dashboard
- URL: https://vercel.com/dashboard
- Key Sections:
  - Settings → Environment Variables
  - Functions → Logs (for error debugging)
  - Domains (configure custom domain)

---

## 🚨 Common Issues & Fixes

### Issue: Deployment fails with "Environment variable missing"
**Fix**: Verify all required env vars are set in Vercel Dashboard

### Issue: Stripe checkout redirects to localhost
**Fix**: Update `NEXT_PUBLIC_APP_URL` in Vercel to `https://www.quotd.app`

### Issue: Authentication fails / users can't sign up
**Fix**: Check Supabase Auth URL configuration matches production domain

### Issue: Webhook returns 401 or signature verification fails
**Fix**: Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches production webhook secret

### Issue: Database queries fail / RLS errors
**Fix**: Verify all migrations ran successfully in Supabase SQL Editor

### Issue: DNS not resolving after 1 hour
**Fix**: Check DNS records with `nslookup www.quotd.app` or use DNS checker tool

### Issue: Email confirmation emails not sending
**Fix**: 
1. Check Supabase Dashboard → Auth → Email Templates
2. Verify SMTP/Resend is configured
3. Check spam folder
4. See `SUPABASE_EMAIL_SETUP.md` for detailed guide

---

## ✅ Pre-Launch Final Checklist

**Critical (Must Complete)**:
- [ ] All environment variables set in Vercel
- [ ] All database migrations run
- [ ] Supabase auth URLs configured
- [ ] Stripe products/prices created and configured
- [ ] Stripe webhook configured and tested
- [ ] Custom domain configured and DNS propagated
- [ ] Email provider configured (SMTP or Resend)
- [ ] Test signup/login flow end-to-end
- [ ] Test password reset flow
- [ ] Test quote creation and PDF generation
- [ ] Test team management
- [ ] Test Stripe checkout flow
- [ ] No 500 errors on dashboard
- [ ] All RLS policies working
- [ ] Production build succeeds

**Important (Should Complete)**:
- [ ] Error tracking set up (Sentry)
- [ ] All core features tested
- [ ] Mobile testing completed
- [ ] Security review completed
- [ ] npm audit passed

**Nice to Have**:
- [ ] Analytics set up
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Support system set up

---

## 📊 Estimated Time to Complete

**Critical Tasks**: ~2 hours
- Environment Variables: 15 min
- Database Migrations: 20 min
- Stripe Webhook: 10 min
- Supabase Auth URLs: 5 min
- Email Configuration: 15 min
- Custom Domain: 10 min + DNS wait
- Production Testing: 30 min

**Total**: ~2-3 hours (excluding DNS propagation wait time)

---

## 🎯 Launch Day Plan

**Morning** (2 hours):
1. Complete tasks 1-5 (Vercel setup, migrations, npm audit)
2. Deploy to Vercel
3. Configure custom domain
4. Wait for DNS propagation

**Afternoon** (1 hour):
1. Verify domain is live
2. Run production testing (task 9)
3. Set up error monitoring (task 10)
4. Monitor Stripe webhooks

**Evening** (30 minutes):
1. Final smoke tests
2. Monitor error logs
3. Check webhook delivery status
4. Announce launch! 🚀

---

**Good luck with your launch!** 🎉

