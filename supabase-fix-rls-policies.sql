-- Fix RLS Policies for Quotes and Customers
-- Run this in Supabase SQL Editor to ensure you can see your own data

-- Fix quotes SELECT policy
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Users can view own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = user_id);

-- Fix customers SELECT policy
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;

CREATE POLICY "Users can view own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

