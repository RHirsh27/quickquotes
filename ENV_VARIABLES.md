# Environment Variables Reference

This document lists all required and optional environment variables for QuickQuotes.

## Required Variables

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_... for production
NEXT_PUBLIC_STRIPE_PRICE_SOLO=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Application
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com # Production
```

## Optional Variables

### Error Tracking (Sentry)
```env
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token
```

## Setup Instructions

1. Copy the required variables above
2. Create a `.env.local` file in the project root
3. Fill in your actual values (never commit this file)
4. For production, set these in Vercel Dashboard → Settings → Environment Variables

## Validation

The app validates all required environment variables on startup. If any are missing, you'll see a clear error message.

See `src/lib/env.ts` for the validation logic.

