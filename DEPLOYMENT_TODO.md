# Deployment Todo List

Complete checklist for deploying Quotd to production.

## 📋 Pre-Deployment Checklist

### 1. Database Setup

- [ ] **Run Core Database Migration**
  - [ ] Execute `supabase-setup.sql` in Supabase SQL Editor
  - [ ] Verify all tables created: `users`, `customers`, `quotes`, `quote_line_items`, `service_presets`
  - [ ] Verify RLS policies enabled on all tables
  - [ ] Check Table Editor to confirm tables exist

- [ ] **Run Teams Migration**
  - [ ] Execute `supabase-migration-teams.sql`
  - [ ] Verify `teams` and `team_members` tables created
  - [ ] Verify existing users have teams created
  - [ ] Check that `team_id` columns added to existing tables

- [ ] **Run Subscriptions Migration**
  - [ ] Execute `supabase-migration-subscriptions.sql`
  - [ ] Verify `subscriptions` table created
  - [ ] Verify RLS policies enabled

- [ ] **Run Invoices Migration**
  - [ ] Execute `supabase-migration-invoices-quote-conversion.sql`
  - [ ] Execute `supabase-migration-invoices-public-access.sql`
  - [ ] Execute `supabase-migration-add-amount-paid.sql`
  - [ ] Verify `invoices` and `invoice_items` tables created

- [ ] **Run Stripe Connect Migration**
  - [ ] Execute `supabase-migration-stripe-connect-payouts.sql`
  - [ ] Verify `stripe_connect_id` and `payouts_enabled` columns added to `users`

- [ ] **Run General Settings Migration**
  - [ ] Execute `supabase-migration-teams-general-settings.sql`
  - [ ] Verify columns added to `teams` table

- [ ] **Run Fintech Risk Profiles Migration**
  - [ ] Execute `supabase-migration-fintech-risk-profiles.sql`
  - [ ] Verify `job_activity_logs`, `team_fintech_metrics` tables created
  - [ ] Verify `item_type` enum and columns added

- [ ] **Run Dispatch & Scheduling Migration**
  - [ ] Execute `supabase-migration-dispatch-scheduling.sql`
  - [ ] Verify `service_locations`, `jobs`, `appointments` tables created
  - [ ] Verify RLS policies enabled

- [ ] **Run Smart Duration Migration**
  - [ ] Execute `supabase-migration-smart-duration.sql`
  - [ ] Verify `default_duration_minutes` added to `service_presets`
  - [ ] Verify `service_preset_id` added to `quote_line_items`

- [ ] **Run Coordinates Migration**
  - [ ] Execute `supabase-migration-add-coordinates.sql`
  - [ ] Verify `latitude` and `longitude` columns added to `service_locations`

- [ ] **Verify Database Functions**
  - [ ] Check `get_user_primary_team()` function exists
  - [ ] Check `find_user_by_email()` function exists
  - [ ] Check all triggers are active

### 2. Environment Variables Setup

- [ ] **Supabase Configuration**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - Get from Supabase Dashboard → Settings → API
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Get from Supabase Dashboard → Settings → API
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API (keep secret!)

- [ ] **Application URL**
  - [ ] `NEXT_PUBLIC_APP_URL` - Set to production URL (e.g., `https://quotd.vercel.app`)
  - [ ] Verify URL is valid and accessible

- [ ] **Stripe Configuration**
  - [ ] `STRIPE_SECRET_KEY` - Get from Stripe Dashboard → Developers → API Keys
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Get from Stripe Dashboard
  - [ ] Verify keys are for production (not test mode)

- [ ] **Stripe Webhook**
  - [ ] Create webhook endpoint in Stripe Dashboard
  - [ ] URL: `https://your-domain.com/api/stripe/webhook`
  - [ ] Events to listen for:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `account.updated`
  - [ ] `STRIPE_WEBHOOK_SECRET` - Copy from webhook endpoint details

- [ ] **Resend Email (Optional)**
  - [ ] `RESEND_API_KEY` - Get from Resend Dashboard
  - [ ] `ADMIN_EMAIL` - Set to your admin email for feedback/support

- [ ] **Google Maps (Optional)**
  - [ ] `GOOGLE_MAPS_API_KEY` - Get from Google Cloud Console
  - [ ] Enable Distance Matrix API and Geocoding API
  - [ ] Restrict API key to your domain

- [ ] **Cron Jobs**
  - [ ] `CRON_SECRET` - Generate secure random string
  - [ ] Used for Vercel Cron job authentication

### 3. Supabase Configuration

- [ ] **Auth Settings**
  - [ ] Go to Authentication → URL Configuration
  - [ ] Set Site URL: `https://your-domain.com`
  - [ ] Add Redirect URLs:
    - `https://your-domain.com/dashboard`
    - `https://your-domain.com/auth/callback`
    - `http://localhost:3000/dashboard` (for local dev)
    - `http://localhost:3000/auth/callback` (for local dev)

- [ ] **Email Settings**
  - [ ] Go to Authentication → Email Templates
  - [ ] Verify email confirmation is enabled
  - [ ] Configure SMTP (if using custom email)
  - [ ] Test email delivery

- [ ] **RLS Policies**
  - [ ] Verify all tables have RLS enabled
  - [ ] Test policies with different user roles
  - [ ] Verify team-based access works correctly

### 4. Stripe Configuration

- [ ] **Products & Prices**
  - [ ] Create products in Stripe Dashboard:
    - Solo Plan (Price ID)
    - Crew Plan (Price ID)
    - Team Plan (Price ID)
    - Extra Seat (Price ID for Enterprise)
  - [ ] Update `src/config/pricing.ts` with actual Price IDs
  - [ ] Verify prices are in production mode

- [ ] **Webhook Endpoint**
  - [ ] Create webhook in Stripe Dashboard
  - [ ] Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
  - [ ] Select events (see Environment Variables section)
  - [ ] Copy webhook signing secret
  - [ ] Test webhook with Stripe CLI or test event

- [ ] **Stripe Connect (Optional)**
  - [ ] Enable Stripe Connect in Dashboard
  - [ ] Configure Express accounts
  - [ ] Set up payout schedules
  - [ ] Test Connect onboarding flow

### 5. Vercel Deployment

- [ ] **Connect Repository**
  - [ ] Push code to GitHub/GitLab/Bitbucket
  - [ ] Connect repository to Vercel
  - [ ] Select project root directory

- [ ] **Environment Variables**
  - [ ] Add all environment variables in Vercel Dashboard
  - [ ] Settings → Environment Variables
  - [ ] Add for Production, Preview, and Development
  - [ ] Verify all variables are set correctly

- [ ] **Build Settings**
  - [ ] Framework Preset: Next.js
  - [ ] Build Command: `next build` (default)
  - [ ] Output Directory: `.next` (default)
  - [ ] Install Command: `npm install` (default)

- [ ] **Deploy**
  - [ ] Trigger initial deployment
  - [ ] Monitor build logs for errors
  - [ ] Verify deployment succeeds
  - [ ] Check deployment URL is accessible

### 6. Post-Deployment Verification

- [ ] **Authentication**
  - [ ] Test signup flow
  - [ ] Verify email confirmation works
  - [ ] Test login
  - [ ] Test password reset
  - [ ] Verify redirect to `/finish-setup` after signup

- [ ] **Paywall**
  - [ ] Verify `/finish-setup` page loads
  - [ ] Test subscription checkout flow
  - [ ] Verify redirect to dashboard after payment
  - [ ] Test that dashboard is blocked without subscription

- [ ] **Core Features**
  - [ ] Create a customer
  - [ ] Create a quote
  - [ ] Generate PDF
  - [ ] Convert quote to invoice
  - [ ] Test payment link generation

- [ ] **Team Features**
  - [ ] Invite team member
  - [ ] Verify team member can access dashboard
  - [ ] Test role-based access (owner vs member)

- [ ] **Scheduling (If Enabled)**
  - [ ] Create a job
  - [ ] Schedule an appointment
  - [ ] Verify travel time warnings (if coordinates set)

- [ ] **Email (If Resend Configured)**
  - [ ] Test feedback form
  - [ ] Verify emails are received
  - [ ] Check spam folder

### 7. Domain & SSL

- [ ] **Custom Domain (Optional)**
  - [ ] Add custom domain in Vercel Dashboard
  - [ ] Configure DNS records
  - [ ] Wait for SSL certificate (automatic)
  - [ ] Verify HTTPS works

- [ ] **Update URLs**
  - [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
  - [ ] Update Supabase redirect URLs
  - [ ] Update Stripe webhook URL
  - [ ] Redeploy after URL changes

### 8. Monitoring & Analytics

- [ ] **Error Tracking**
  - [ ] Set up error monitoring (Sentry, LogRocket, etc.)
  - [ ] Configure error alerts
  - [ ] Test error reporting

- [ ] **Analytics (Optional)**
  - [ ] Set up Google Analytics or similar
  - [ ] Add tracking code to `src/app/layout.tsx`
  - [ ] Verify events are tracked

- [ ] **Logging**
  - [ ] Check Vercel function logs
  - [ ] Monitor API route errors
  - [ ] Set up log aggregation if needed

### 9. Security Checklist

- [ ] **Environment Variables**
  - [ ] Verify no secrets in code
  - [ ] All API keys in environment variables
  - [ ] Service role keys never exposed to client

- [ ] **RLS Policies**
  - [ ] Test that users can only access their team's data
  - [ ] Verify public routes (payment pages) have correct policies
  - [ ] Test unauthorized access attempts

- [ ] **API Security**
  - [ ] Verify webhook signature validation
  - [ ] Test rate limiting (if implemented)
  - [ ] Check CORS settings

- [ ] **Content Security**
  - [ ] Verify input sanitization
  - [ ] Test XSS prevention
  - [ ] Check SQL injection prevention (Supabase handles this)

### 10. Performance Optimization

- [ ] **Database**
  - [ ] Verify indexes are created
  - [ ] Check query performance
  - [ ] Monitor database connection pool

- [ ] **Images & Assets**
  - [ ] Optimize images (if any)
  - [ ] Verify CDN is working
  - [ ] Check bundle size

- [ ] **Caching**
  - [ ] Verify Next.js caching is working
  - [ ] Check API route caching
  - [ ] Monitor cache hit rates

### 11. Documentation

- [ ] **User Documentation**
  - [ ] Create user guide (if needed)
  - [ ] Document key features
  - [ ] Add help tooltips in app

- [ ] **Developer Documentation**
  - [ ] Update README.md
  - [ ] Document environment variables
  - [ ] Document deployment process

### 12. Backup & Recovery

- [ ] **Database Backups**
  - [ ] Verify Supabase automatic backups are enabled
  - [ ] Test backup restoration process
  - [ ] Document recovery procedures

- [ ] **Code Backups**
  - [ ] Verify Git repository is backed up
  - [ ] Document rollback procedure

### 13. Launch Day

- [ ] **Final Checks**
  - [ ] Run all tests
  - [ ] Check all critical paths
  - [ ] Verify payment processing
  - [ ] Test on multiple devices/browsers

- [ ] **Monitoring**
  - [ ] Monitor error rates
  - [ ] Watch for performance issues
  - [ ] Check user signups
  - [ ] Monitor payment processing

- [ ] **Support**
  - [ ] Have support email ready
  - [ ] Monitor user feedback
  - [ ] Be ready to fix critical issues

## 🚨 Critical Issues to Fix Before Launch

- [ ] All database migrations run successfully
- [ ] All environment variables set correctly
- [ ] Stripe webhook configured and tested
- [ ] Email confirmation working
- [ ] Paywall enforcing subscriptions
- [ ] RLS policies tested and working
- [ ] No console errors in production
- [ ] Payment processing works end-to-end

## 📝 Notes

- Test in staging environment first if possible
- Keep a rollback plan ready
- Monitor closely for first 24-48 hours
- Have support channels ready

## ✅ Quick Deployment Command Reference

```bash
# 1. Push code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Deploy to Vercel (if using CLI)
vercel --prod

# 3. Or deploy via Vercel Dashboard (recommended)
# - Go to Vercel Dashboard
# - Click "Deploy" or push to main branch
```

---

**Last Updated:** [Current Date]
**Status:** Ready for Deployment

