# .env.example Template

Since `.env.example` is gitignored, here's the template to create it manually.

Create a file named `.env.example` in your project root with the following content:

```env
# ============================================================================
# QuickQuotes Environment Variables
# ============================================================================
# Copy this file to .env.local and fill in your actual values
# NEVER commit .env.local to git
# ============================================================================

# ----------------------------------------------------------------------------
# Supabase Configuration
# ----------------------------------------------------------------------------
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# ----------------------------------------------------------------------------
# Stripe Configuration
# ----------------------------------------------------------------------------
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Stripe Price IDs
# Create products in Stripe Dashboard and copy the Price IDs here
NEXT_PUBLIC_STRIPE_PRICE_SOLO="price_..."
NEXT_PUBLIC_STRIPE_PRICE_TEAM="price_..."
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS="price_..."

# Stripe Webhook Secret
# Get this from: https://dashboard.stripe.com/webhooks
# After creating webhook endpoint, copy the "Signing secret"
STRIPE_WEBHOOK_SECRET="whsec_..."

# ----------------------------------------------------------------------------
# Application Configuration
# ----------------------------------------------------------------------------
# Your production domain (e.g., https://quickquotes.vercel.app)
# For local development, use: http://localhost:3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Quick Setup

1. Copy the content above
2. Create `.env.example` in your project root
3. Paste the content
4. Commit to git (this file is safe to commit - it has no secrets)

## For New Developers

When setting up the project:
1. Copy `.env.example` to `.env.local`
2. Fill in your actual values
3. Never commit `.env.local` (it's in `.gitignore`)

