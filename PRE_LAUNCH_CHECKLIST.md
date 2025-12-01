# 🚀 Pre-Launch Action Plan for Quotd

## Critical Path to Launch

This document outlines all tasks you must complete before launching your application to production.

---

## 📋 PHASE 1: Environment Variables & Configuration (CRITICAL)

### 1.1 Supabase Environment Variables
- [ ] **Set in Vercel Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
  - ✅ Verify these are set in Vercel Dashboard → Settings → Environment Variables

### 1.2 Stripe Environment Variables
- [ ] **Set in Vercel Environment Variables:**
  - `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_live_` for production)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_live_`)
  - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (starts with `whsec_`)
  - `NEXT_PUBLIC_STRIPE_PRICE_SOLO` - Stripe Price ID for Solo plan
  - `NEXT_PUBLIC_STRIPE_PRICE_TEAM` - Stripe Price ID for Team plan
  - `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` - Stripe Price ID for Business plan
  - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-domain.com`)

### 1.3 Update Pricing Configuration
- [ ] **Edit `src/config/pricing.ts`:**
  - Replace empty `stripePriceId` strings with your actual Stripe Price IDs
  - Verify prices match your Stripe products

---

## 🗄️ PHASE 2: Database Setup (CRITICAL)

### 2.1 Run All Database Migrations
Execute these SQL scripts in **Supabase Dashboard → SQL Editor** in order:

- [ ] **1. Initial Setup:**
  - Run `supabase-setup.sql` (creates all tables, RLS policies, triggers)
  
- [ ] **2. Address Fields:**
  - Run `supabase-upgrade-address.sql` (adds address columns to users table)

- [ ] **3. Teams/Multi-tenancy:**
  - Run `supabase-migration-teams.sql` (creates teams, team_members, adds team_id)

- [ ] **4. Subscriptions:**
  - Run `supabase-migration-subscriptions.sql` (creates subscriptions table)

- [ ] **5. Invoices:**
  - Run `supabase-migration-invoices.sql` (creates invoices table for Connect payments)
  - Run `supabase-migration-invoices-public-access.sql` (allows public access for payment page)

- [ ] **6. Stripe Connect:**
  - Run `supabase-migration-stripe-connect.sql` (adds stripe_connect_id to users table)

- [ ] **7. Helper Functions:**
  - Run `supabase-function-find-user-by-email.sql` (RPC function for team invites)

### 2.2 Verify Database Structure
- [ ] Check that all tables exist:
  - `users`, `customers`, `quotes`, `quote_line_items`, `service_presets`
  - `teams`, `team_members`, `subscriptions`, `invoices`
- [ ] Verify `users` table has `stripe_connect_id` column
- [ ] Verify RLS (Row Level Security) is enabled on all tables
- [ ] Test that RLS policies are working (try querying as different users)

### 2.3 Test Database Functions
- [ ] Verify `get_user_primary_team()` RPC function exists and works
- [ ] Verify `find_user_by_email()` RPC function exists and works
- [ ] Test `handle_new_user` trigger creates user profile on signup

---

## 🔐 PHASE 3: Supabase Authentication Configuration (CRITICAL)

### 3.1 URL Configuration
- [ ] **Go to Supabase Dashboard → Authentication → URL Configuration**
- [ ] **Set Site URL:** Your production domain (e.g., `https://your-domain.com`)
- [ ] **Add Redirect URLs:**
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/reset-password`
  - `https://your-domain.com/dashboard`
  - `http://localhost:3000/auth/callback` (for local dev)
  - `http://localhost:3000/reset-password` (for local dev)

### 3.2 Email Configuration
- [ ] **Configure Email Provider:**
  - Option A: Use Supabase Email (limited to 3/hour on free tier)
  - Option B: **RECOMMENDED** - Set up Custom SMTP (Gmail, SendGrid, etc.)
    - Go to Project Settings → Auth → SMTP Settings
    - Configure your SMTP provider
    - Test email delivery

### 3.3 Email Templates
- [ ] Review and customize email templates:
  - Confirmation Email
  - Password Reset Email
  - Magic Link Email (if using)

### 3.4 Test Authentication Flow
- [ ] Test signup → email confirmation → login
- [ ] Test password reset flow
- [ ] Test login with existing account
- [ ] Verify email links redirect correctly

---

## 💳 PHASE 4: Stripe Setup (CRITICAL)

### 4.1 Create Stripe Products & Prices
- [ ] **Go to Stripe Dashboard → Products**
- [ ] **Create 3 Products:**
  1. **Solo Professional** - $29/month (recurring)
  2. **Small Team** - $79/month (recurring)
  3. **Business Unlimited** - $149/month (recurring)
- [ ] **Copy Price IDs** (start with `price_`)
- [ ] **Update `src/config/pricing.ts`** with actual Price IDs
- [ ] **Set environment variables** in Vercel with Price IDs

### 4.2 Configure Stripe Webhook
- [ ] **Go to Stripe Dashboard → Developers → Webhooks**
- [ ] **Add endpoint:** `https://your-domain.com/api/stripe/webhook`
- [ ] **Select events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] **Copy Webhook Signing Secret** (starts with `whsec_`)
- [ ] **Set `STRIPE_WEBHOOK_SECRET`** in Vercel environment variables
- [ ] **Test webhook** using Stripe CLI or Dashboard test mode

### 4.3 Test Stripe Integration
- [ ] Test checkout flow (use Stripe test cards)
- [ ] Verify subscription is created in database
- [ ] Test webhook receives events
- [ ] Verify subscription limits are enforced

---

## 🧪 PHASE 5: Testing (CRITICAL)

### 5.1 Core Functionality Testing
- [ ] **Authentication:**
  - [ ] Sign up new user
  - [ ] Email confirmation works
  - [ ] Login works
  - [ ] Password reset works
  - [ ] Logout works

- [ ] **Dashboard:**
  - [ ] Dashboard loads without 500 errors
  - [ ] Stats display correctly
  - [ ] Recent quotes show up

- [ ] **Quote Management:**
  - [ ] Create new quote
  - [ ] Add line items
  - [ ] Save quote
  - [ ] View quote details
  - [ ] Generate PDF
  - [ ] Delete quote
  - [ ] Share quote (email/SMS)

- [ ] **Customer Management:**
  - [ ] Create new customer
  - [ ] Search customers
  - [ ] View customer details

- [ ] **Team Management:**
  - [ ] View team members
  - [ ] Invite team member
  - [ ] Remove team member
  - [ ] Subscription limits enforced

### 5.2 Edge Cases & Error Handling
- [ ] Test with invalid email addresses
- [ ] Test with weak passwords
- [ ] Test rate limiting (try multiple rapid requests)
- [ ] Test with missing data
- [ ] Test error boundaries (intentionally break something)
- [ ] Test 404 page
- [ ] Test network failures

### 5.3 Browser & Device Testing
- [ ] Test on Chrome (desktop)
- [ ] Test on Firefox (desktop)
- [ ] Test on Safari (desktop)
- [ ] Test on mobile (iOS Safari)
- [ ] Test on mobile (Android Chrome)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test bottom navigation on mobile

---

## 🔒 PHASE 6: Security Hardening (CRITICAL)

### 6.1 Environment Variables Security
- [ ] **Verify NO secrets in code:**
  - [ ] No API keys in `package.json`
  - [ ] No secrets in `src/` files
  - [ ] All secrets in Vercel environment variables only
- [ ] **Review `.gitignore`:**
  - [ ] `.env.local` is ignored
  - [ ] `.env` is ignored
  - [ ] No sensitive files committed

### 6.2 Database Security
- [ ] **Verify RLS Policies:**
  - [ ] Users can only see their own data
  - [ ] Team members can only see team data
  - [ ] Test with different user accounts
- [ ] **Review SQL Functions:**
  - [ ] No SQL injection vulnerabilities
  - [ ] Functions use proper parameterization

### 6.3 API Security
- [ ] **Stripe Webhook:**
  - [ ] Webhook secret is set and validated
  - [ ] Webhook endpoint verifies signatures
- [ ] **Rate Limiting:**
  - [ ] Client-side rate limiting is working
  - [ ] Consider adding server-side rate limiting

### 6.4 Input Validation
- [ ] All user inputs are sanitized
- [ ] Email validation is working
- [ ] Phone validation is working
- [ ] Password strength requirements enforced

---

## 📊 PHASE 7: Monitoring & Error Tracking (IMPORTANT)

### 7.1 Error Tracking Setup
- [ ] **Set up error tracking service:**
  - Option A: Sentry (recommended)
  - Option B: LogRocket
  - Option C: Vercel Analytics
- [ ] **Configure error boundaries** to catch React errors
- [ ] **Set up alerts** for critical errors

### 7.2 Logging
- [ ] **Review console logs:**
  - [ ] Remove or minimize `console.log` in production
  - [ ] Keep `console.error` for debugging
  - [ ] Use structured logging if possible
- [ ] **Set up log aggregation** (Vercel Logs, Datadog, etc.)

### 7.3 Analytics
- [ ] **Set up analytics:**
  - [ ] Google Analytics or similar
  - [ ] Track key user actions
  - [ ] Monitor conversion funnel

---

## 🚀 PHASE 8: Deployment Configuration (CRITICAL)

### 8.1 Vercel Configuration
- [ ] **Verify build settings:**
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
- [ ] **Set production domain:**
  - [ ] Add custom domain in Vercel
  - [ ] Configure DNS records
  - [ ] Enable SSL/HTTPS

### 8.2 Environment Variables in Vercel
- [ ] **Verify all environment variables are set:**
  - [ ] Supabase variables
  - [ ] Stripe variables
  - [ ] App URL
- [ ] **Set for all environments:**
  - [ ] Production
  - [ ] Preview (optional)
  - [ ] Development (optional)

### 8.3 Build Verification
- [ ] **Run production build locally:**
  ```bash
  npm run build
  ```
- [ ] **Verify no build errors**
- [ ] **Test production build locally:**
  ```bash
  npm start
  ```

---

## 📝 PHASE 9: Documentation & Support (IMPORTANT)

### 9.1 User Documentation
- [ ] Create user guide/help docs
- [ ] Add FAQ page
- [ ] Create video tutorials (optional)

### 9.2 Internal Documentation
- [ ] Update README.md with setup instructions
- [ ] Document all environment variables
- [ ] Document database schema
- [ ] Document API endpoints

### 9.3 Support Setup
- [ ] Set up support email (e.g., support@quotd.com)
- [ ] Create support page/contact form
- [ ] Set up help desk (optional)

---

## 🎨 PHASE 10: Final Polish (NICE TO HAVE)

### 10.1 UI/UX Review
- [ ] Review all pages for consistency
- [ ] Check mobile responsiveness
- [ ] Verify all buttons/links work
- [ ] Test loading states
- [ ] Test error states
- [ ] Verify toast notifications work

### 10.2 Performance Optimization
- [ ] Run Lighthouse audit
- [ ] Optimize images (if any)
- [ ] Check bundle size
- [ ] Enable Vercel Analytics
- [ ] Test page load times

### 10.3 SEO (if marketing site)
- [ ] Add meta tags
- [ ] Add Open Graph tags
- [ ] Add structured data
- [ ] Submit sitemap to Google

---

## ✅ PRE-LAUNCH FINAL CHECKLIST

### Critical (Must Complete)
- [ ] All environment variables set in Vercel
- [ ] All database migrations run
- [ ] Supabase auth URLs configured
- [ ] Stripe products/prices created and configured
- [ ] Stripe webhook configured and tested
- [ ] Pricing config updated with real Price IDs
- [ ] Test signup/login flow end-to-end
- [ ] Test password reset flow
- [ ] Test quote creation and PDF generation
- [ ] Test team management
- [ ] Test Stripe checkout flow
- [ ] No 500 errors on dashboard
- [ ] All RLS policies working
- [ ] Production build succeeds

### Important (Should Complete)
- [ ] Error tracking set up
- [ ] Custom SMTP configured
- [ ] All core features tested
- [ ] Mobile testing completed
- [ ] Security review completed
- [ ] Documentation updated

### Nice to Have
- [ ] Analytics set up
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Support system set up

---

## 🚨 CRITICAL ISSUES TO FIX BEFORE LAUNCH

Based on current codebase, ensure these are resolved:

1. **Dashboard 500 Error:**
   - [ ] Check Vercel Function Logs for `[Dashboard]` errors
   - [ ] Verify `get_user_primary_team` RPC function exists
   - [ ] Test with a real user account

2. **Password Reset Emails:**
   - [ ] Configure redirect URLs in Supabase
   - [ ] Set up custom SMTP (recommended)
   - [ ] Test email delivery

3. **Stripe Integration:**
   - [ ] Create actual products/prices in Stripe
   - [ ] Update `src/config/pricing.ts` with real Price IDs
   - [ ] Test webhook in production

4. **Database Migrations:**
   - [ ] Run all SQL scripts in order
   - [ ] Verify all tables and RLS policies exist
   - [ ] Test with real data

---

## 📞 Quick Reference

### Supabase Dashboard
- URL: https://supabase.com/dashboard
- Key Sections:
  - Authentication → URL Configuration
  - SQL Editor (for migrations)
  - Table Editor (to verify tables)
  - Logs → Auth Logs (for debugging)

### Stripe Dashboard
- URL: https://dashboard.stripe.com
- Key Sections:
  - Products (create pricing plans)
  - Developers → Webhooks (configure webhook)
  - API Keys (get secret keys)

### Vercel Dashboard
- URL: https://vercel.com/dashboard
- Key Sections:
  - Settings → Environment Variables
  - Functions → Logs (for error debugging)
  - Domains (configure custom domain)

---

## 🎯 Launch Day Checklist

1. [ ] Complete all Critical items above
2. [ ] Final smoke test of all features
3. [ ] Monitor error logs for 24 hours
4. [ ] Have rollback plan ready
5. [ ] Announce launch! 🚀

---

**Estimated Time to Complete:** 4-8 hours (depending on Stripe/email setup complexity)

**Priority Order:**
1. Environment Variables (30 min)
2. Database Migrations (1 hour)
3. Supabase Configuration (30 min)
4. Stripe Setup (1-2 hours)
5. Testing (2-3 hours)
6. Security Review (1 hour)
7. Final Polish (1-2 hours)

