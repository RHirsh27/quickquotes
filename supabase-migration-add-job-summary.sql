-- ============================================================================
-- MIGRATION: Add Job Summary Field to Quotes and Invoices
-- ============================================================================
-- This migration adds a `job_summary` text field to both quotes and invoices
-- to allow users to document the scope of work for each quote/invoice
-- ============================================================================

-- Step 1: Add job_summary column to quotes table
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS job_summary TEXT;

-- Step 2: Add job_summary column to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS job_summary TEXT;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.quotes.job_summary IS 'Scope of work / job summary description for the quote';
COMMENT ON COLUMN public.invoices.job_summary IS 'Scope of work / job summary description for the invoice';

