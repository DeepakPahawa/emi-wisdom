-- Create loan_details table
CREATE TABLE IF NOT EXISTS loan_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number VARCHAR(100) NOT NULL UNIQUE,
    principal_amount DECIMAL(15, 2) NOT NULL CHECK (principal_amount > 0),
    original_interest_rate DECIMAL(5, 2) NOT NULL CHECK (original_interest_rate >= 0 AND original_interest_rate <= 100),
    current_interest_rate DECIMAL(5, 2) NOT NULL CHECK (current_interest_rate >= 0 AND current_interest_rate <= 100),
    emi_start_date DATE NOT NULL,
    loan_tenure_months INTEGER NOT NULL CHECK (loan_tenure_months > 0),
    bank_name VARCHAR(255) NOT NULL,
    loan_label VARCHAR(50) NOT NULL CHECK (loan_label IN ('HomeLoan', 'PersonalLoan', 'CarLoan', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on loan_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_loan_details_loan_number ON loan_details(loan_number);

-- Create index on loan_label for filtering
CREATE INDEX IF NOT EXISTS idx_loan_details_loan_label ON loan_details(loan_label);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_loan_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loan_details_updated_at
    BEFORE UPDATE ON loan_details
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_details_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE loan_details ENABLE ROW LEVEL SECURITY;

-- Create policies
-- WARNING: This policy allows all operations without authentication.
-- For production, implement proper authentication and update this policy.
CREATE POLICY "Allow all operations for everyone" ON loan_details
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Policy to allow read access for anonymous users (remove if not needed)
-- CREATE POLICY "Allow read access for anonymous users" ON loan_details
--     FOR SELECT
--     USING (true);

-- Add comments to document the table
COMMENT ON TABLE loan_details IS 'Stores loan information including principal, interest rates, and loan metadata';
COMMENT ON COLUMN loan_details.id IS 'Unique identifier for the loan';
COMMENT ON COLUMN loan_details.loan_number IS 'Unique loan account number';
COMMENT ON COLUMN loan_details.principal_amount IS 'Original principal amount of the loan';
COMMENT ON COLUMN loan_details.original_interest_rate IS 'Original interest rate percentage';
COMMENT ON COLUMN loan_details.current_interest_rate IS 'Current interest rate percentage';
COMMENT ON COLUMN loan_details.emi_start_date IS 'Date when EMI payments started';
COMMENT ON COLUMN loan_details.loan_tenure_months IS 'Total loan tenure in months';
COMMENT ON COLUMN loan_details.bank_name IS 'Name of the lending bank or institution';
COMMENT ON COLUMN loan_details.loan_label IS 'Type of loan: HomeLoan, PersonalLoan, CarLoan, or Other';