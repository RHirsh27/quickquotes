-- ============================================================================
-- MIGRATION: Add Public Access Policy for Invoices
-- ============================================================================
-- This migration adds a policy to allow public access to invoices by ID
-- Required for the public payment portal at /pay/[invoiceId]
-- ============================================================================

-- Allow public SELECT access to invoices (for payment page)
-- This allows anyone to view invoice details by ID for payment purposes
DROP POLICY IF EXISTS "Public can view invoices by ID" ON public.invoices;
CREATE POLICY "Public can view invoices by ID"
  ON public.invoices FOR SELECT
  USING (true);

-- Note: This policy allows public read access to all invoices.
-- This is intentional for the payment portal, but you may want to restrict
-- it further if needed (e.g., only allow access to unpaid invoices).
