-- ============================================================================
-- MIGRATION: Add Stripe Connect Payouts Support
-- ============================================================================
-- This migration adds columns to support Stripe Connect payouts
-- ============================================================================

-- Add stripe_connect_id column if it doesn't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Add payouts_enabled column
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_id ON public.users (stripe_connect_id);

-- Add comments for documentation
COMMENT ON COLUMN public.users.stripe_connect_id IS 'Stripe Connect Express Account ID';
COMMENT ON COLUMN public.users.payouts_enabled IS 'Whether payouts are enabled for this Stripe Connect account';

