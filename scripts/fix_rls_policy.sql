-- Fix RLS Policy for emi_transactions table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all for testing" ON "public"."emi_transactions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."emi_transactions";
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."emi_transactions";
DROP POLICY IF EXISTS "Enable update for all users" ON "public"."emi_transactions";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."emi_transactions";

-- Create comprehensive policies for all operations
-- SELECT policy
CREATE POLICY "Enable read access for all users"
ON "public"."emi_transactions"
FOR SELECT
TO public
USING (true);

-- INSERT policy
CREATE POLICY "Enable insert for all users"
ON "public"."emi_transactions"
FOR INSERT
TO public
WITH CHECK (true);

-- UPDATE policy
CREATE POLICY "Enable update for all users"
ON "public"."emi_transactions"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- DELETE policy
CREATE POLICY "Enable delete for all users"
ON "public"."emi_transactions"
FOR DELETE
TO public
USING (true);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'emi_transactions';

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'emi_transactions';
