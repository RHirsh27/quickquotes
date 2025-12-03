-- ============================================================================
-- MIGRATION: Add Legal Settings Columns to Teams Table
-- ============================================================================
-- This migration adds columns for warranty and disclosure text to the teams table.
-- These fields allow owners to set standard legal text that appears on all quotes.
-- ============================================================================

-- Add columns for legal settings
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS default_warranty_text TEXT,
  ADD COLUMN IF NOT EXISTS default_disclosure_text TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.teams.default_warranty_text IS 'Standard warranty text that appears on all quote PDFs';
COMMENT ON COLUMN public.teams.default_disclosure_text IS 'Legal disclosures that appear on all quote PDFs';
