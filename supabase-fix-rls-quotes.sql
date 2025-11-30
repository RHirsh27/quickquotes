-- Run this in Supabase SQL Editor to ensure you can see your own data
-- This fixes the "Missing Quote" issue where quotes are saved but not visible

-- Fix quotes table SELECT policy
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
CREATE POLICY "Users can view own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = user_id);

-- Ensure the same for customers
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

-- Also ensure quote_line_items are visible
DROP POLICY IF EXISTS "Users can view own line items" ON public.quote_line_items;
CREATE POLICY "Users can view own line items" ON public.quote_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_line_items.quote_id
            AND quotes.user_id = auth.uid()
        )
    );

