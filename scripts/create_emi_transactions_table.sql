-- Create EMI Transactions Table
-- This table stores all EMI payment records and part payments

CREATE TABLE IF NOT EXISTS emi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID, -- For future multi-loan support, can be NULL for now
    emi_date DATE NOT NULL,
    month_number INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('emi', 'part_payment')),
    amount_paid NUMERIC(15, 2) NOT NULL CHECK (amount_paid >= 0),
    principal_component NUMERIC(15, 2) NOT NULL CHECK (principal_component >= 0),
    interest_component NUMERIC(15, 2) NOT NULL CHECK (interest_component >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_emi_transactions_loan_id ON emi_transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_emi_transactions_emi_date ON emi_transactions(emi_date);
CREATE INDEX IF NOT EXISTS idx_emi_transactions_month_number ON emi_transactions(month_number);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emi_transactions_updated_at 
    BEFORE UPDATE ON emi_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE emi_transactions IS 'Stores all EMI payment transactions and part payments';
COMMENT ON COLUMN emi_transactions.loan_id IS 'Reference to loan (for future multi-loan support)';
COMMENT ON COLUMN emi_transactions.emi_date IS 'Date when the EMI was paid';
COMMENT ON COLUMN emi_transactions.month_number IS 'Month number in the loan schedule (1-based)';
COMMENT ON COLUMN emi_transactions.transaction_type IS 'Type of transaction: emi or part_payment';
COMMENT ON COLUMN emi_transactions.amount_paid IS 'Total amount paid in this transaction';
COMMENT ON COLUMN emi_transactions.principal_component IS 'Amount that went towards principal';
COMMENT ON COLUMN emi_transactions.interest_component IS 'Amount that went towards interest';
