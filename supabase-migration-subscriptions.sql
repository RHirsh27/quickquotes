-- ============================================================================
-- MIGRATION: Add Stripe Subscriptions Table
-- ============================================================================
-- This migration creates a subscriptions table to track Stripe subscription data
-- ============================================================================

-- Step 1: Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', etc.
  plan_id TEXT, -- Stripe Price ID (e.g., 'price_1234567890')
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Step 3: Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: We don't allow users to delete subscriptions directly
-- Subscriptions should be canceled through Stripe, which will update the status

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

-- Step 7: Add unique constraint to prevent duplicate active subscriptions per user
-- A user should only have one active subscription at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON public.subscriptions(user_id) 
WHERE status IN ('active', 'trialing');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Notes:
-- 1. Users can have multiple subscriptions (for history), but only one active/trialing
-- 2. Status values should match Stripe subscription statuses:
--    - 'active': Subscription is active
--    - 'canceled': Subscription was canceled
--    - 'past_due': Payment failed
--    - 'trialing': In trial period
--    - 'incomplete': Payment incomplete
--    - 'incomplete_expired': Payment incomplete and expired
--    - 'unpaid': Payment failed and retries exhausted
-- 3. The plan_id stores the Stripe Price ID (e.g., 'price_1234567890')
-- 4. Use webhooks to keep subscription status in sync with Stripe
-- ============================================================================

