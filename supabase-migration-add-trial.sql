-- Migration: Add Trial Period Tracking
-- Purpose: Track 14-day trial period for new users
-- Author: Production Readiness Update
-- Date: 2025-12-02

-- Step 1: Add trial tracking columns to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

-- Step 2: Create index for fast trial lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at
ON public.subscriptions(trial_ends_at)
WHERE is_trial = true;

-- Step 3: Create helper function to check if trial is active
CREATE OR REPLACE FUNCTION public.is_trial_active(sub_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = sub_id
    AND is_trial = true
    AND trial_ends_at > NOW()
  );
END;
$$;

-- Step 4: Create helper function to get days remaining in trial
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(sub_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER
  INTO days_remaining
  FROM public.subscriptions
  WHERE id = sub_id AND is_trial = true;

  RETURN COALESCE(days_remaining, 0);
END;
$$;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.subscriptions.trial_ends_at IS '14-day trial period end date. Users have full access until this date.';
COMMENT ON COLUMN public.subscriptions.is_trial IS 'True if user is in trial period, false if paid subscription.';

-- Step 6: Update existing subscriptions to mark as paid (not trial)
-- Only update rows where is_trial is NULL or false
UPDATE public.subscriptions
SET is_trial = false
WHERE is_trial IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Trial period migration completed successfully!';
  RAISE NOTICE 'New columns added: trial_ends_at, is_trial';
  RAISE NOTICE 'Helper functions created: is_trial_active(), get_trial_days_remaining()';
END $$;
