-- ============================================================================
-- MIGRATION: Add Stripe Connect ID to Users Table
-- ============================================================================
-- This migration adds stripe_connect_id column to track Stripe Connect accounts
-- for tradespeople to receive payouts
-- ============================================================================

-- Step 1: Add stripe_connect_id column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_id ON public.users (stripe_connect_id) WHERE stripe_connect_id IS NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.users.stripe_connect_id IS 'Stripe Connect Account ID (e.g., acct_1234567890) for receiving payouts';

