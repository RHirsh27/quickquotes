-- ============================================================================
-- MIGRATION: Add Quote-to-Invoice Conversion Support
-- ============================================================================
-- This migration adds columns to the invoices table to support converting
-- quotes to invoices, while maintaining compatibility with Stripe Connect invoices
-- ============================================================================

-- Step 1: Make stripe_invoice_id nullable (for quote-converted invoices)
-- Only alter if column exists and is NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'stripe_invoice_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.invoices ALTER COLUMN stripe_invoice_id DROP NOT NULL;
  END IF;
END $$;

-- Step 2: Add columns for quote-to-invoice conversion (if they don't exist)
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Step 2b: Add unique constraint to invoice_number (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_invoice_number_key'
  ) THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
  END IF;
END $$;

-- Step 2: Update status column to support new statuses (if needed)
-- Note: Existing status values are 'pending', 'paid', 'failed', 'void', 'uncollectible'
-- New statuses needed: 'unpaid' (for quote-converted invoices)
-- We'll use ALTER TYPE if it's an enum, or just ensure the column accepts text
-- Since it's TEXT, we can use any status value

-- Step 3: Create index for invoice_number lookups
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices (quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_team_id ON public.invoices (team_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices (customer_id);

-- Step 4: Update RLS policies to be team-based (same as quotes)
-- Drop old user-based policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users cannot delete own invoices" ON public.invoices;

-- Create team-based policies (same pattern as quotes)
CREATE POLICY "Team members can view team invoices"
  ON public.invoices FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Fallback for Stripe Connect invoices without team_id
  );

CREATE POLICY "Team members can insert team invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Fallback for Stripe Connect invoices
  );

CREATE POLICY "Team members can update team invoices"
  ON public.invoices FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Fallback for Stripe Connect invoices
  );

-- Still prevent direct deletion (should be handled by application logic)
DROP POLICY IF EXISTS "Users cannot delete own invoices" ON public.invoices;
CREATE POLICY "Users cannot delete invoices"
  ON public.invoices FOR DELETE
  USING (FALSE);

-- Step 5: Create invoice_items table for duplicating quote line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  taxable BOOLEAN DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for invoice_items (team-based)
CREATE POLICY "Team members can view team invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert team invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete team invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

-- Step 8: Create indexes for invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_position ON public.invoice_items (invoice_id, position);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN public.invoices.team_id IS 'Team that owns this invoice (for quote-converted invoices)';
COMMENT ON COLUMN public.invoices.customer_id IS 'Customer this invoice is for (for quote-converted invoices)';
COMMENT ON COLUMN public.invoices.quote_id IS 'Original quote this invoice was converted from (nullable)';
COMMENT ON COLUMN public.invoices.invoice_number IS 'Unique invoice number (e.g., INV-1001)';
COMMENT ON COLUMN public.invoices.total IS 'Total invoice amount';
COMMENT ON COLUMN public.invoices.amount_paid IS 'Amount paid so far';
COMMENT ON COLUMN public.invoices.due_date IS 'Due date for payment';
COMMENT ON COLUMN public.invoices.stripe_payment_intent_id IS 'Stripe Payment Intent ID for payment processing';
COMMENT ON TABLE public.invoice_items IS 'Line items for invoices (duplicated from quotes for historical accuracy)';

