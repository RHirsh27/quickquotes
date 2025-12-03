# 🎯 14-Day Trial Period - Deployment Guide

**Status**: ✅ Implementation Complete - Ready to Deploy
**Date**: December 2, 2025
**Feature**: Automatic 14-day trial for all new signups

---

## 📊 What Changed

### New User Flow
```
BEFORE: Signup → Email Confirm → /finish-setup (REQUIRED) → Stripe → Dashboard

NOW:    Signup → Email Confirm → Dashboard (14-day trial) → Upgrade Anytime → Paid Subscription
```

### Key Features Implemented
1. ✅ **Automatic Trial Creation** - All new signups get 14 days of full access
2. ✅ **Trial Banner** - Shows days remaining at top of dashboard
3. ✅ **Trial Tracking** - Database tracks trial status and expiration
4. ✅ **Paywall Enforcement** - Dashboard blocks access after trial expires
5. ✅ **Upgrade Flow** - Users can upgrade anytime during or after trial
6. ✅ **Trial → Paid Conversion** - Webhook automatically converts trial to paid

---

## 🗂️ Files Changed

### **New Files Created:**
1. `supabase-migration-add-trial.sql` - Adds trial tracking columns
2. `supabase-migration-trial-auto-create.sql` - Auto-creates trials on signup
3. `src/lib/trial.ts` - Trial management functions
4. `src/components/layout/TrialBanner.tsx` - Trial countdown banner
5. `TRIAL_DEPLOYMENT_GUIDE.md` - This file

### **Files Modified:**
1. `src/lib/types.ts` - Added trial fields to Subscription interface
2. `src/app/(dashboard)/layout.tsx` - Updated to allow trial access
3. `src/app/api/stripe/webhook/route.ts` - Converts trial to paid on payment
4. `src/app/finish-setup/page.tsx` - Updated messaging for trial users

---

## 🚀 Deployment Steps

### Step 1: Run Database Migrations (5 minutes)

Go to Supabase SQL Editor and run these **2 new migration files**:

**Migration 1: Add Trial Tracking**
```bash
# File: supabase-migration-add-trial.sql
# Purpose: Adds trial_ends_at and is_trial columns
```

**Migration 2: Auto-Create Trials**
```bash
# File: supabase-migration-trial-auto-create.sql
# Purpose: Updates trigger to create trials automatically
```

**Steps:**
1. Go to https://app.supabase.com/project/cmjhtwyhchzquepzamuk/sql
2. Open and run `supabase-migration-add-trial.sql`
3. Verify success (should see columns added)
4. Open and run `supabase-migration-trial-auto-create.sql`
5. Verify success (should see function updated)

**Verification:**
```sql
-- Check that columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('trial_ends_at', 'is_trial');

-- Should return 2 rows
```

---

### Step 2: Deploy Code Changes (10 minutes)

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "feat: Add 14-day trial period for new signups"
git push origin main
```

Vercel will automatically deploy.

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/dashboard/quotd
2. Click "Redeploy"
3. Wait for build to complete

---

### Step 3: Test Trial Flow (15 minutes)

#### Test 1: New Signup Gets Trial
1. Sign out of your account
2. Go to https://www.quotd.app
3. Click "Get Started"
4. Fill out signup form (use a new email)
5. Verify email
6. **Expected:** Immediately redirected to dashboard
7. **Expected:** See blue trial banner at top: "14 days left in your trial"
8. **Expected:** Can access all dashboard features

#### Test 2: Trial Banner Shows Correct Days
1. While logged in as trial user
2. Check banner shows "14 days left"
3. Navigate to different pages
4. **Expected:** Banner persists across all dashboard pages

#### Test 3: Upgrade During Trial
1. Click "Upgrade Now" button in trial banner
2. **Expected:** Redirects to /finish-setup
3. **Expected:** See message "You're already in your 14-day trial"
4. Select a plan (use test card: `4242 4242 4242 4242`)
5. Complete Stripe checkout
6. **Expected:** Redirected to dashboard
7. **Expected:** Trial banner disappears
8. **Expected:** Subscription is now "active" (not trial)

#### Test 4: Trial Expiration (Simulated)
```sql
-- In Supabase SQL Editor, manually expire a trial:
UPDATE subscriptions
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'your-test-user-id';
```
1. Refresh dashboard
2. **Expected:** Redirected to /finish-setup
3. **Expected:** Cannot access dashboard
4. Upgrade to a plan
5. **Expected:** Can access dashboard again

---

## 📊 Database Schema Changes

### subscriptions Table - New Columns

| Column | Type | Description |
|--------|------|-------------|
| `trial_ends_at` | `TIMESTAMPTZ` | Trial expiration date (14 days from signup) |
| `is_trial` | `BOOLEAN` | true = trial, false = paid subscription |

### Helper Functions Added

```sql
is_trial_active(sub_id UUID) → BOOLEAN
-- Returns true if trial is active (not expired)

get_trial_days_remaining(sub_id UUID) → INTEGER
-- Returns number of days left in trial
```

---

## 🔍 Monitoring & Analytics

### Key Metrics to Track

**Trial Conversion Rate:**
```sql
-- Trial signups in last 30 days
SELECT COUNT(*) as trial_signups
FROM subscriptions
WHERE is_trial = true
AND created_at > NOW() - INTERVAL '30 days';

-- Converted to paid in last 30 days
SELECT COUNT(*) as conversions
FROM subscriptions
WHERE is_trial = false
AND created_at > NOW() - INTERVAL '30 days';

-- Conversion rate = conversions / trial_signups * 100
```

**Trial Expiration:**
```sql
-- Trials expiring in next 3 days
SELECT COUNT(*) as expiring_soon
FROM subscriptions
WHERE is_trial = true
AND trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '3 days';
```

**Active Trials:**
```sql
-- Currently active trials
SELECT COUNT(*) as active_trials
FROM subscriptions
WHERE is_trial = true
AND trial_ends_at > NOW();
```

---

## ⚠️ Important Notes

### What Happens to Existing Users?

**Existing paid users:**
- ✅ No impact - they already have `is_trial = false`
- ✅ Will not see trial banner
- ✅ Continue with normal subscription

**Existing users without subscriptions:**
- ⚠️ They will NOT automatically get a trial
- ⚠️ They were created before trial system was implemented
- ⚠️ They must go through /finish-setup to subscribe

**New users (after deployment):**
- ✅ Automatically get 14-day trial
- ✅ Immediate dashboard access
- ✅ Can upgrade anytime

### Trial Period Configuration

**Default:** 14 days
**Location:** `src/lib/trial.ts` line 8
```typescript
const TRIAL_DAYS = 14
```

To change trial length:
1. Edit `TRIAL_DAYS` in `src/lib/trial.ts`
2. Update migration SQL: `NOW() + INTERVAL '14 days'`
3. Redeploy

---

## 🐛 Troubleshooting

### Issue: New users don't get trial automatically
**Fix:** Check that `supabase-migration-trial-auto-create.sql` ran successfully
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: Trial banner doesn't show
**Fix:** Check trial status:
```sql
SELECT id, user_id, is_trial, trial_ends_at, status
FROM subscriptions
WHERE user_id = 'your-user-id';
```

### Issue: User can't access dashboard during trial
**Fix:** Check trial expiration:
```sql
-- Should return rows if trial is active
SELECT * FROM subscriptions
WHERE user_id = 'your-user-id'
AND is_trial = true
AND trial_ends_at > NOW();
```

### Issue: Trial doesn't convert to paid after payment
**Fix:** Check webhook logs in Stripe Dashboard
- Verify `checkout.session.completed` event is firing
- Check Vercel logs for webhook errors
- Ensure `STRIPE_WEBHOOK_SECRET` is correct

---

## 📈 Expected Outcomes

### Before Trial Period
- **Conversion:** ~20-30% (users had to pay immediately)
- **Signups:** Lower (payment friction)
- **User Experience:** More hesitation to try

### After Trial Period
- **Conversion:** Expected 40-50% (industry standard)
- **Signups:** Expected 2-3x increase (no payment friction)
- **User Experience:** Better (try before buy)

### Timeline to Results
- **Week 1:** Monitor signup rate increase
- **Week 2:** First trials start expiring - track conversions
- **Week 3-4:** Stable conversion rate established

---

## ✅ Post-Deployment Checklist

- [ ] Both SQL migrations ran successfully
- [ ] Code deployed to production (Vercel)
- [ ] Test signup creates trial automatically
- [ ] Trial banner displays correctly
- [ ] Upgrade flow works (trial → paid)
- [ ] Trial expiration blocks dashboard access
- [ ] Stripe webhook converts trial to paid
- [ ] Analytics tracking trial conversions
- [ ] Monitor error logs for first 48 hours

---

## 🎉 Success Criteria

**Trial system is working correctly if:**
1. ✅ New signups can access dashboard immediately
2. ✅ Trial banner shows days remaining
3. ✅ Users can upgrade anytime
4. ✅ Dashboard blocks access after trial expires
5. ✅ Payment converts trial to paid subscription
6. ✅ No errors in Vercel or Supabase logs

---

## 📞 Support

**If issues occur:**
1. Check Vercel deployment logs
2. Check Supabase SQL logs
3. Check Stripe webhook delivery logs
4. Review this guide's troubleshooting section

**Rollback Plan (if needed):**
```sql
-- Remove trial columns (ONLY IF CRITICAL ISSUE)
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS trial_ends_at,
DROP COLUMN IF EXISTS is_trial;

-- Revert handle_new_user function to previous version
-- (Re-run supabase-migration-teams.sql)
```

---

**Ready to deploy? Follow steps 1-3 above! 🚀**
