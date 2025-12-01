-- ============================================================================
-- MIGRATION: Create Invoices Table
-- ============================================================================
-- This migration creates an invoices table to track Stripe invoice payments
-- Used for handling "Connect" payments via Stripe webhooks
-- ============================================================================

-- Step 1: Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE, -- Stripe Invoice ID (e.g., 'in_1234567890')
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'void', 'uncollectible'
  amount INTEGER, -- Amount in cents (e.g., 1000 = $10.00)
  currency TEXT DEFAULT 'usd',
  description TEXT,
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE -- When the invoice was marked as paid
);

-- Step 2: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON public.invoices (stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices (created_at DESC);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for invoices table
-- Users can view their own invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own invoices (e.g., when an invoice is created in Stripe)
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own invoices (e.g., when webhook updates status)
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

-- Prevent users from deleting their own invoices directly (should be handled by Stripe webhooks)
DROP POLICY IF EXISTS "Users cannot delete own invoices" ON public.invoices;
CREATE POLICY "Users cannot delete own invoices"
  ON public.invoices FOR DELETE
  USING (FALSE);

-- Step 5: Function to update `updated_at` column automatically
-- (Reuse existing function if it already exists, otherwise create it)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Step 6: Function to automatically set paid_at when status changes to 'paid'
CREATE OR REPLACE FUNCTION public.set_invoice_paid_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.paid_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_paid_at_trigger ON public.invoices;
CREATE TRIGGER set_invoice_paid_at_trigger
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_paid_at();

-- Step 7: Add comment to table for documentation
COMMENT ON TABLE public.invoices IS 'Stores Stripe invoice records for tracking payment status';
COMMENT ON COLUMN public.invoices.stripe_invoice_id IS 'Unique Stripe Invoice ID (e.g., in_1234567890)';
COMMENT ON COLUMN public.invoices.status IS 'Invoice status: pending, paid, failed, void, uncollectible';
COMMENT ON COLUMN public.invoices.amount IS 'Invoice amount in cents (e.g., 1000 = $10.00)';

