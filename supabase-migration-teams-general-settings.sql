-- ============================================================================
-- MIGRATION: Add General Settings Columns to Teams Table
-- ============================================================================
-- This migration adds columns to the teams table for business configuration
-- ============================================================================

-- Add columns for general settings
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_phone TEXT,
  ADD COLUMN IF NOT EXISTS company_email TEXT,
  ADD COLUMN IF NOT EXISTS company_website TEXT,
  ADD COLUMN IF NOT EXISTS default_quote_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.teams.default_tax_rate IS 'Default tax rate percentage for quotes (e.g., 8.5 for 8.5%)';
COMMENT ON COLUMN public.teams.company_address IS 'Company headquarters address';
COMMENT ON COLUMN public.teams.company_phone IS 'Company phone number';
COMMENT ON COLUMN public.teams.company_email IS 'Company email address';
COMMENT ON COLUMN public.teams.company_website IS 'Company website URL';
COMMENT ON COLUMN public.teams.default_quote_notes IS 'Default terms & conditions text for quotes';

