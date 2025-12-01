# 🚀 Launch Quick Start Guide

**Time Estimate:** 4-8 hours | **Priority:** Complete in order listed

---

## ⚡ CRITICAL PATH (Do These First)

### 1. Environment Variables (30 minutes)
**Vercel Dashboard → Settings → Environment Variables**

Set these **production** values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_live_... (NOT sk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (NOT pk_test_)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migrations (1 hour)
**Supabase Dashboard → SQL Editor**

Run these SQL scripts **in order**:
1. `supabase-setup.sql` - Creates all tables, RLS, triggers
2. `supabase-upgrade-address.sql` - Adds address fields
3. `supabase-migration-teams.sql` - Teams & multi-tenancy
4. `supabase-migration-subscriptions.sql` - Subscriptions table
5. `supabase-migration-invoices.sql` - Invoices table (for Connect payments)
6. `supabase-function-find-user-by-email.sql` - Team invite function

**Verify:** Go to Table Editor, check all tables exist with RLS enabled.

### 3. Supabase Auth Configuration (30 minutes)
**Supabase Dashboard → Authentication → URL Configuration**

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:** Add all of these:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/reset-password`
  - `https://your-domain.com/dashboard`
  - `http://localhost:3000/auth/callback` (for dev)

### 4. Stripe Setup (1-2 hours)
**Stripe Dashboard**

1. **Create Products:**
   - Solo Professional - $29/month
   - Small Team - $79/month  
   - Business Unlimited - $149/month

2. **Copy Price IDs** (start with `price_`)

3. **Update Code:**
   - Edit `src/config/pricing.ts`
   - Replace empty `stripePriceId` strings with real Price IDs
   - Set environment variables in Vercel

4. **Configure Webhook:**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook secret to Vercel env vars

### 5. Email Configuration (30 minutes)
**Supabase Dashboard → Project Settings → Auth → SMTP**

- **Option A:** Use Supabase Email (3/hour limit on free tier)
- **Option B:** **RECOMMENDED** - Set up Custom SMTP
  - Gmail, SendGrid, or similar
  - Test email delivery

---

## ✅ TESTING CHECKLIST (2-3 hours)

### Must Test Before Launch:
- [ ] Sign up → Email confirmation → Login
- [ ] Password reset flow (check email arrives)
- [ ] Dashboard loads (no 500 errors)
- [ ] Create quote → Save → View → PDF
- [ ] Team management (invite member)
- [ ] Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Mobile responsive (test on phone)

### Critical Issues to Verify Fixed:
- [ ] Dashboard 500 error resolved
- [ ] Password reset emails arrive
- [ ] All database queries work
- [ ] RLS policies allow proper access

---

## 🔍 VERIFICATION STEPS

### Check These Work:
1. **Create test account** → Verify email arrives
2. **Login** → Dashboard shows stats
3. **Create quote** → Saves successfully
4. **Generate PDF** → Downloads correctly
5. **Team invite** → Email sent, member added
6. **Stripe checkout** → Subscription created

### Check Logs:
- **Vercel:** Functions → Logs (look for errors)
- **Supabase:** Logs → Auth Logs (check for issues)
- **Browser Console:** Check for client-side errors

---

## 🚨 COMMON ISSUES & FIXES

### Issue: Dashboard 500 Error
**Fix:** Check Vercel Function Logs for `[Dashboard]` errors
- Verify `get_user_primary_team` RPC function exists
- Check RLS policies on `quotes` and `customers` tables

### Issue: Password Reset Email Not Arriving
**Fix:** 
- Add redirect URL to Supabase
- Check spam folder
- Set up custom SMTP (recommended)

### Issue: Stripe Checkout Fails
**Fix:**
- Verify Price IDs in `src/config/pricing.ts`
- Check Stripe keys are `sk_live_` and `pk_live_` (not test)
- Verify webhook URL is correct

### Issue: Team Invite Fails
**Fix:**
- Verify `find_user_by_email` RPC function exists
- Check subscription limits in database
- Verify RLS policies on `team_members` table

---

## 📋 FINAL PRE-LAUNCH CHECKLIST

### Code & Configuration
- [ ] All environment variables set in Vercel
- [ ] All SQL migrations run successfully
- [ ] Stripe Price IDs updated in code
- [ ] Supabase redirect URLs configured
- [ ] Custom domain configured in Vercel

### Testing
- [ ] All core features tested
- [ ] No 500 errors in logs
- [ ] Mobile testing completed
- [ ] Email delivery working

### Security
- [ ] No secrets in code
- [ ] RLS policies tested
- [ ] Input validation working
- [ ] Rate limiting active

### Documentation
- [ ] README updated
- [ ] Environment variables documented
- [ ] Support contact info added

---

## 🎯 LAUNCH DAY

1. [ ] Complete all Critical Path items
2. [ ] Run final smoke test
3. [ ] Monitor error logs for 1 hour
4. [ ] Have rollback plan ready
5. [ ] **LAUNCH!** 🚀

---

**Need Help?** Check `PRE_LAUNCH_CHECKLIST.md` for detailed instructions.

