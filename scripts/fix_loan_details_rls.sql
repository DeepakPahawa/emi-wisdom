-- Fix Row Level Security for loan_details table
-- This script allows operations without authentication for development

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON loan_details;

-- Create a permissive policy that allows all operations
-- WARNING: This is for development only. In production, implement proper authentication.
CREATE POLICY "Allow all operations for everyone" ON loan_details
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE loan_details ENABLE ROW LEVEL SECURITY;
