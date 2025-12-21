-- Temporarily disable RLS for emi_transactions table (DEVELOPMENT ONLY)
-- WARNING: This removes security. Only use for local development/testing.
-- Run this in Supabase SQL Editor

-- Disable RLS
ALTER TABLE emi_transactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'emi_transactions';
