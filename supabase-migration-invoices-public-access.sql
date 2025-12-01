-- ============================================================================
-- MIGRATION: Add Public Access Policy for Invoices
-- ============================================================================
-- This migration adds a policy to allow public access to invoices by ID
-- for the payment page (no authentication required)
-- ============================================================================

-- Allow public SELECT access to invoices (for payment page)
-- This allows anyone to view invoice details if they have the invoice ID
DROP POLICY IF EXISTS "Public can view invoices by ID" ON public.invoices;
CREATE POLICY "Public can view invoices by ID"
  ON public.invoices FOR SELECT
  USING (true); -- Allow all SELECT operations (invoice ID acts as the security token)

-- Note: This policy allows public read access to all invoices.
-- The security comes from the fact that invoice IDs are UUIDs (hard to guess).
-- If you need stricter security, you could:
-- 1. Add a separate "public_invoice_id" column that's different from the UUID
-- 2. Use a signed token in the URL instead
-- 3. Require email verification before showing invoice details

