-- Update EMI Transactions Table with Composite Unique Constraint
-- This allows separate rows for Paid EMI and EMI Hacks in the same month

-- Drop the old table
DROP TABLE IF EXISTS emi_transactions CASCADE;

-- Create the table with composite unique constraint
CREATE TABLE emi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID,
    emi_date DATE NOT NULL,
    month_number INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('emi', 'part_payment')),
    amount_paid NUMERIC(15, 2) NOT NULL CHECK (amount_paid >= 0),
    principal_component NUMERIC(15, 2) NOT NULL CHECK (principal_component >= 0),
    interest_component NUMERIC(15, 2) NOT NULL CHECK (interest_component >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint: one 'emi' and one 'part_payment' per month
    UNIQUE(month_number, transaction_type)
);

-- Create indexes for faster queries
CREATE INDEX idx_emi_transactions_loan_id ON emi_transactions(loan_id);
CREATE INDEX idx_emi_transactions_emi_date ON emi_transactions(emi_date);
CREATE INDEX idx_emi_transactions_month_number ON emi_transactions(month_number);
CREATE INDEX idx_emi_transactions_type ON emi_transactions(transaction_type);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_emi_transactions_updated_at ON emi_transactions;
CREATE TRIGGER update_emi_transactions_updated_at 
    BEFORE UPDATE ON emi_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE emi_transactions IS 'Stores all EMI payment transactions and part payments. Allows one emi and one part_payment per month.';
COMMENT ON COLUMN emi_transactions.loan_id IS 'Reference to loan (for future multi-loan support)';
COMMENT ON COLUMN emi_transactions.emi_date IS 'Date when the EMI was paid';
COMMENT ON COLUMN emi_transactions.month_number IS 'Month number in the loan schedule (1-based)';
COMMENT ON COLUMN emi_transactions.transaction_type IS 'Type of transaction: emi (Paid EMI) or part_payment (EMI Hacks)';
COMMENT ON COLUMN emi_transactions.amount_paid IS 'Total amount paid in this transaction';
COMMENT ON COLUMN emi_transactions.principal_component IS 'Amount that went towards principal';
COMMENT ON COLUMN emi_transactions.interest_component IS 'Amount that went towards interest';

-- Enable RLS (Row Level Security)
ALTER TABLE emi_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for testing - update for production)
CREATE POLICY "Enable all for testing" 
ON "public"."emi_transactions"
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

-- Verify the table was created
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'emi_transactions'
ORDER BY ordinal_position;

-- Show the unique constraint
SELECT
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'emi_transactions'
    AND tc.constraint_type = 'UNIQUE';
