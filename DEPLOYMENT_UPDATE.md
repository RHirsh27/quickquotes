# 🚀 Deployment Update - Recent Changes

**Last Updated:** [Current Date]

## 📦 Recent Changes Summary

### Code Changes
- ✅ Updated landing page hero section (new copy)
- ✅ Created new PricingSection component
- ✅ Updated pricing configuration (STARTER/GROWTH/PRO model)
- ✅ Updated Privacy Policy and Terms of Service
- ✅ Added tooltip component (Radix UI)
- ✅ Updated card components

### New Dependencies
- ✅ `@radix-ui/react-tooltip` (already installed)

---

## 🔴 CRITICAL: Before Deploying

### 1. Update Stripe Price IDs (REQUIRED)

**File:** `src/config/pricing.ts`

You MUST replace the placeholder Price IDs with actual Stripe Price IDs:

```typescript
// Current (PLACEHOLDERS - WILL NOT WORK):
stripePriceId: "price_starter_id_placeholder"
stripePriceId: "price_growth_id_placeholder"
stripePriceId: "price_pro_id_placeholder"

// Need to replace with actual Stripe Price IDs from your Stripe Dashboard
```

**Steps:**
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create 3 products (if not already created):
   - **Starter Plan**: $29/month recurring
   - **Growth Plan**: $99/month recurring
   - **Pro Plan**: $199/month recurring
3. Copy each Price ID (starts with `price_`)
4. Update `src/config/pricing.ts`:
   - Replace `price_starter_id_placeholder` with actual Starter Price ID
   - Replace `price_growth_id_placeholder` with actual Growth Price ID
   - Replace `price_pro_id_placeholder` with actual Pro Price ID

**⚠️ Without this, checkout will fail!**

---

## ✅ Pre-Deployment Checklist

### Step 1: Commit & Push Changes
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Update landing page, pricing model, and legal pages"

# Push to GitHub
git push origin main
```

### Step 2: Verify Environment Variables (Vercel)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required Variables:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `STRIPE_SECRET_KEY` (production key)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production key)
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL` (your production URL)

**Optional (but recommended):**
- `RESEND_API_KEY` (for emails)
- `ADMIN_EMAIL` (for support)
- `GOOGLE_MAPS_API_KEY` (for travel time features)
- `CRON_SECRET` (for cron jobs)

### Step 3: Update Stripe Price IDs

**⚠️ CRITICAL:** Update `src/config/pricing.ts` with actual Stripe Price IDs before deploying.

### Step 4: Verify Database Migrations

If you haven't run all migrations yet, run these in Supabase SQL Editor:

**Required Migrations:**
- [ ] `supabase-setup.sql` (core tables)
- [ ] `supabase-migration-teams.sql` (multi-tenancy)
- [ ] `supabase-migration-subscriptions.sql` (subscriptions)
- [ ] `supabase-migration-smart-duration.sql` (duration estimates)
- [ ] `supabase-migration-add-coordinates.sql` (travel time)

**Optional Migrations:**
- `supabase-migration-dispatch-scheduling.sql` (scheduling features)
- `supabase-migration-fintech-risk-profiles.sql` (fintech features)

### Step 5: Test Locally (Recommended)

```bash
# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Test:
# 1. Landing page loads correctly
# 2. Pricing section displays properly
# 3. Signup flow works
# 4. Checkout redirects to Stripe (with test keys)
```

---

## 🚀 Deployment Steps

### Option 1: Automatic (GitHub → Vercel)

If Vercel is connected to your GitHub repo:

1. **Push changes to GitHub** (see Step 1 above)
2. **Vercel will automatically deploy**
3. **Monitor deployment** in Vercel Dashboard
4. **Check build logs** for any errors

### Option 2: Manual (Vercel CLI)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 🧪 Post-Deployment Testing

After deployment, test these critical paths:

### 1. Landing Page
- [ ] Visit homepage - hero section displays correctly
- [ ] Pricing section shows 3 tiers (Starter, Growth, Pro)
- [ ] "MOST POPULAR" badge appears on Growth tier
- [ ] Tooltip works on "Active Calendars" feature
- [ ] All buttons are clickable

### 2. Signup Flow
- [ ] Click "Start Free Trial" or "Get Started"
- [ ] Signup page loads
- [ ] Can create new account
- [ ] Redirects to `/finish-setup` after signup

### 3. Checkout Flow
- [ ] Select a pricing plan
- [ ] Redirects to Stripe Checkout
- [ ] Can complete test payment
- [ ] Redirects back to dashboard after payment

### 4. Legal Pages
- [ ] `/privacy` page loads and displays correctly
- [ ] `/terms` page loads and displays correctly
- [ ] Footer links work

---

## 🔧 Troubleshooting

### Build Errors

**If you see TypeScript errors:**
```bash
# Run type check
npm run build

# Fix any TypeScript errors before deploying
```

**If you see import errors:**
- Verify `@radix-ui/react-tooltip` is installed: `npm list @radix-ui/react-tooltip`
- If missing: `npm install @radix-ui/react-tooltip`

### Runtime Errors

**Checkout fails:**
- Verify Stripe Price IDs are updated (not placeholders)
- Check Stripe Dashboard for correct Price IDs
- Verify `STRIPE_SECRET_KEY` is set in Vercel

**Pricing section doesn't display:**
- Check browser console for errors
- Verify `PricingSection` component is imported correctly
- Check that tooltip component exists

---

## 📝 Quick Reference

### Files Changed
- `src/app/page.tsx` - Landing page hero & features
- `src/components/landing/PricingSection.tsx` - New pricing component
- `src/config/pricing.ts` - **⚠️ NEEDS STRIPE PRICE IDs**
- `src/app/(public)/privacy/page.tsx` - Privacy policy
- `src/app/(public)/terms/page.tsx` - Terms of service
- `src/components/ui/tooltip.tsx` - New tooltip component
- `src/components/ui/card.tsx` - Updated card components

### New Dependencies
- `@radix-ui/react-tooltip` ✅ (installed)

### Environment Variables Needed
- All existing variables (Supabase, Stripe, etc.)
- No new variables required for these changes

---

## ⚡ Quick Deploy Command

```bash
# 1. Update Stripe Price IDs in src/config/pricing.ts FIRST!

# 2. Commit and push
git add .
git commit -m "Deploy: Updated landing page and pricing model"
git push origin main

# 3. Vercel will auto-deploy (or use: vercel --prod)
```

---

## 🎯 Priority Actions

1. **🔴 HIGH:** Update Stripe Price IDs in `src/config/pricing.ts`
2. **🟡 MEDIUM:** Test checkout flow locally with test keys
3. **🟢 LOW:** Review legal pages content (Privacy/Terms)

---

**Ready to deploy?** Make sure Stripe Price IDs are updated first! 🚀

