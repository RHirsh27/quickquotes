-- ============================================================================
-- MIGRATION: Add amount_paid column to invoices table
-- ============================================================================
-- This migration adds the amount_paid column if it doesn't exist
-- Required for tracking partial payments on invoices
-- ============================================================================

-- Add amount_paid column if it doesn't exist
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.amount_paid IS 'Amount paid so far (in dollars for quote-converted invoices)';

