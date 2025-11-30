-- ============================================================================
-- MIGRATION: Add Stripe Subscriptions Table
-- ============================================================================
-- This migration creates a subscriptions table to track Stripe subscription data
-- ============================================================================

-- Step 1: Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', etc.
  plan_id TEXT, -- Stripe Price ID (e.g., 'price_1234567890')
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for subscriptions table
-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (e.g., when a customer is created in Stripe)
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (e.g., when webhook updates status)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Prevent users from deleting their own subscriptions directly (should be handled by Stripe webhooks)
DROP POLICY IF EXISTS "Users cannot delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users cannot delete own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (FALSE);

-- Step 5: Add a unique constraint to prevent multiple active/trialing subscriptions per user
-- This requires a function and trigger because direct unique constraints don't handle partial conditions well
CREATE OR REPLACE FUNCTION public.check_active_subscription_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active', 'trialing') THEN
    IF EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = NEW.user_id
        AND status IN ('active', 'trialing')
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'A user can only have one active or trialing subscription.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_active_subscription_uniqueness ON public.subscriptions;
CREATE TRIGGER enforce_active_subscription_uniqueness
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.check_active_subscription_uniqueness();

-- Step 6: Function to update `updated_at` column automatically
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
