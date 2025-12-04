-- Migration: Add Stripe Connect fields to teams table
-- Purpose: Store Stripe Connect account information for payment processing
-- Date: 2025-12-03

-- Add Stripe Connect columns to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_account_status text DEFAULT 'pending';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_stripe_account_id ON public.teams(stripe_account_id);

-- Add comment for documentation
COMMENT ON COLUMN public.teams.stripe_account_id IS 'Stripe Connect Express account ID for receiving payments';
COMMENT ON COLUMN public.teams.stripe_account_status IS 'Status of Stripe Connect account: pending, active, restricted';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Stripe Connect fields added to teams table';
  RAISE NOTICE '✅ Teams can now connect Stripe to accept payments';
END $$;
