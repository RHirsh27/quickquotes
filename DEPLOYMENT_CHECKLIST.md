# 🚀 Quotd Production Deployment Checklist

**Last Updated**: December 2, 2025
**Production URL**: https://www.quotd.app

This checklist covers all remaining tasks to deploy Quotd to production on Vercel.

---

## ✅ COMPLETED

### Configuration
- [x] Stripe Price IDs configured in `src/config/pricing.ts`
- [x] `.env.local` file updated with all 4 Stripe Price IDs
- [x] Supabase project created (https://cmjhtwyhchzquepzamuk.supabase.co)
- [x] Stripe account configured with live keys
- [x] Webhook secret obtained
- [x] Production domain acquired (www.quotd.app)

---

## 🔴 CRITICAL - Must Complete Before Launch

### 1. Vercel Environment Variables (15 minutes)
**Priority**: BLOCKING
**Location**: Vercel Dashboard → Settings → Environment Variables

Set these environment variables in Vercel:

```bash
# Supabase (ALREADY HAVE THESE)
NEXT_PUBLIC_SUPABASE_URL=https://cmjhtwyhchzquepzamuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key-from-.env.local]

# Stripe (ALREADY HAVE THESE)
STRIPE_SECRET_KEY=[your-live-key-from-.env.local]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-live-key-from-.env.local]
STRIPE_WEBHOOK_SECRET=[your-webhook-secret-from-.env.local]

# Stripe Price IDs (CRITICAL - SET THESE)
NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_1SZBBcCCOgkFoQDA9XbZzVpz
NEXT_PUBLIC_STRIPE_PRICE_CREW=price_1SZBCVCCOgkFoQDA1I8d7xnu
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_1SZBDTCCOgkFoQDA0seUDd2R
NEXT_PUBLIC_STRIPE_EXTRA_SEAT_PRICE_ID=price_1SZhk5CCOgkFoQDAw4bb166l

# App URL
NEXT_PUBLIC_APP_URL=https://www.quotd.app

# Email (if using Resend)
RESEND_API_KEY=[get-from-resend.com]

# Optional
ADMIN_EMAIL=[your-admin-email]
```

**Steps**:
- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Settings → Environment Variables
- [ ] Add each variable above
- [ ] Set environment to: Production, Preview, Development (all)
- [ ] Save changes

---

### 2. Supabase Database Migrations (20 minutes)
**Priority**: BLOCKING
**Status**: ⚠️ Unknown - Need to verify if already run

**Steps**:
- [ ] Go to https://app.supabase.com/project/cmjhtwyhchzquepzamuk/sql
- [ ] Run these SQL files **in order**:

```
1. supabase-setup.sql                           (base schema + RLS)
2. supabase-upgrade-address.sql                 (address fields)
3. supabase-migration-teams.sql                 (teams + multi-tenancy)
4. supabase-migration-subscriptions.sql         (billing tables)
5. supabase-migration-invoices.sql              (invoice system)
6. supabase-migration-invoices-public-access.sql (public payment page)
7. supabase-migration-invoices-quote-conversion.sql (quote → invoice)
8. supabase-migration-stripe-connect.sql        (Stripe Connect)
9. supabase-migration-stripe-connect-payouts.sql
10. supabase-function-find-user-by-email.sql    (RPC functions)
11. supabase-migration-add-job-summary.sql
12. supabase-migration-add-amount-paid.sql
13. supabase-migration-teams-general-settings.sql
14. supabase-fix-rls-policies.sql
15. supabase-fix-rls-quotes.sql
16. supabase-fix-team-members-rls-recursion.sql
```

**Verification**:
- [ ] All tables exist: `users`, `customers`, `quotes`, `quote_line_items`, `service_presets`, `teams`, `team_members`, `subscriptions`, `invoices`, `invoice_items`
- [ ] RLS enabled on all tables (check with: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';`)
- [ ] Test authentication works (try signing up a test user)

---

### 3. Stripe Webhook Registration (10 minutes)
**Priority**: BLOCKING
**Status**: ⚠️ Need to verify if production webhook exists

**Steps**:
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Check if production webhook exists for `https://www.quotd.app/api/stripe/webhook`
- [ ] If not, click "Add endpoint"
- [ ] Endpoint URL: `https://www.quotd.app/api/stripe/webhook`
- [ ] Events to send:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `account.updated`
- [ ] Copy webhook signing secret
- [ ] Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

**Verification**:
- [ ] Test webhook by creating a test subscription
- [ ] Check Stripe Dashboard → Webhooks → [Your webhook] → Recent deliveries
- [ ] Should see successful 200 responses

---

### 4. Supabase Authentication URLs (5 minutes)
**Priority**: BLOCKING
**Location**: Supabase Dashboard → Authentication → URL Configuration

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

### 5. Fix npm Vulnerabilities (2 minutes)
**Priority**: HIGH (dev dependencies only, but should fix)

**Steps**:
- [ ] Run: `npm audit fix`
- [ ] Run: `npm audit` (verify 0 vulnerabilities)
- [ ] Commit changes if package-lock.json updated

**Expected Fix**: 3 high-severity vulnerabilities in `glob` (via eslint-config-next)

---

### 6. Deploy to Vercel (10 minutes)
**Priority**: BLOCKING
**Status**: Ready once above tasks complete

**Steps**:
- [ ] Ensure GitHub repo is up to date with latest changes
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Import Project" or connect existing project
- [ ] Select your GitHub repository
- [ ] Framework: Next.js (auto-detected)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (2-3 minutes)

**Verification**:
- [ ] Deployment succeeds without errors
- [ ] Check build logs for any warnings
- [ ] Verify environment variables are loaded (check logs)

---

### 7. Custom Domain Configuration (5 minutes)
**Priority**: BLOCKING
**Status**: Need to configure DNS

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

## 🟡 RECOMMENDED - Complete Within 24 Hours of Launch

### 8. Error Monitoring Setup (15 minutes)
**Priority**: MEDIUM
**Status**: Not configured

Install Sentry for production error tracking:

**Steps**:
- [ ] Run: `npx @sentry/wizard@latest -i nextjs`
- [ ] Create Sentry account (or use existing)
- [ ] Follow wizard prompts
- [ ] Test error reporting (trigger a test error)
- [ ] Verify errors appear in Sentry Dashboard

**Why**: Critical for debugging production issues without access to server logs.

---

### 9. Production Testing (30 minutes)
**Priority**: MEDIUM
**Status**: Pending deployment

Test these critical user flows in production:

**Authentication**:
- [ ] Sign up with new account
- [ ] Verify email confirmation works
- [ ] Log in with confirmed account
- [ ] Test password reset flow
- [ ] Test logout

**Subscription Flow**:
- [ ] Visit /finish-setup (should show plans)
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

**Team Features** (if applicable):
- [ ] Invite team member (from Settings → Team)
- [ ] Verify invitation email sent
- [ ] Accept invitation
- [ ] Verify RBAC (member can't access owner features)

**Invoice/Payment**:
- [ ] Convert quote to invoice
- [ ] Visit public payment page (/pay/[id])
- [ ] Complete payment with test card
- [ ] Verify invoice marked as "paid"
- [ ] Check payment received email sent

---

### 10. Monitoring Setup (10 minutes)
**Priority**: MEDIUM
**Status**: Not configured

**Vercel Analytics** (Free):
- [ ] Go to Vercel Dashboard → Analytics
- [ ] Enable Analytics
- [ ] Track key metrics (page views, conversion rate)

**Stripe Dashboard Monitoring**:
- [ ] Set up email alerts for failed payments
- [ ] Monitor webhook delivery health
- [ ] Track MRR (Monthly Recurring Revenue)

---

## 🟢 OPTIONAL - Post-Launch Improvements

### 11. Enhanced Security (1-2 hours)
- [ ] Add Content Security Policy (CSP) headers to next.config.mjs
- [ ] Implement server-side rate limiting for API routes
- [ ] Add CAPTCHA for signup/login (hCaptcha or reCAPTCHA)
- [ ] Review and tighten RLS policies

### 12. Performance Optimization (2-3 hours)
- [ ] Add React Query caching for repeated queries
- [ ] Implement image optimization with next/image
- [ ] Add loading skeletons for better UX
- [ ] Enable Vercel Edge Functions for critical routes

### 13. Testing Infrastructure (4-6 hours)
- [ ] Set up Vitest for unit tests
- [ ] Add Playwright for E2E tests
- [ ] Write tests for critical flows (auth, checkout, quote creation)
- [ ] Set up CI/CD with GitHub Actions

### 14. Email Deliverability (30 minutes)
- [ ] Verify custom domain in Resend
- [ ] Set up SPF, DKIM, DMARC records
- [ ] Test email deliverability (Mail-Tester.com)
- [ ] Customize email templates with branding

---

## 📊 Pre-Launch Checklist Summary

**Total Time**: ~2 hours (critical tasks only)

| Task | Priority | Time | Status |
|------|----------|------|--------|
| 1. Vercel Environment Variables | 🔴 Critical | 15 min | ⬜ Pending |
| 2. Supabase Migrations | 🔴 Critical | 20 min | ⬜ Unknown |
| 3. Stripe Webhook | 🔴 Critical | 10 min | ⬜ Unknown |
| 4. Supabase Auth URLs | 🔴 Critical | 5 min | ⬜ Pending |
| 5. Fix npm Vulnerabilities | 🟡 High | 2 min | ⬜ Pending |
| 6. Deploy to Vercel | 🔴 Critical | 10 min | ⬜ Pending |
| 7. Custom Domain | 🔴 Critical | 5 min + DNS wait | ⬜ Pending |
| 8. Error Monitoring | 🟡 Medium | 15 min | ⬜ Pending |
| 9. Production Testing | 🟡 Medium | 30 min | ⬜ Pending |
| 10. Monitoring Setup | 🟡 Medium | 10 min | ⬜ Pending |

---

## 🎯 Launch Day Plan

**Morning** (2 hours):
1. Complete tasks 1-5 (Vercel setup, migrations, npm audit)
2. Deploy to Vercel (task 6)
3. Configure custom domain (task 7)
4. Wait for DNS propagation

**Afternoon** (1 hour):
1. Verify domain is live
2. Run production testing (task 9)
3. Set up error monitoring (task 8)
4. Monitor Stripe webhooks

**Evening** (30 minutes):
1. Final smoke tests
2. Monitor error logs
3. Check webhook delivery status
4. Announce launch!

---

## 🆘 Troubleshooting

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

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Your Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Your Pre-Launch Checklist**: `PRE_LAUNCH_CHECKLIST.md`

---

## ✅ Post-Launch

Once live, monitor these for the first 48 hours:
- [ ] Vercel deployment logs (check for errors)
- [ ] Sentry error tracking (if installed)
- [ ] Stripe webhook delivery (should be 100% success rate)
- [ ] User signups (test accounts converting to paid)
- [ ] Email deliverability (check spam folder)

**Congratulations on launching Quotd! 🎉**
