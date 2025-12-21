# Loan Details Table Setup

## Overview
This script creates the `loan_details` table in Supabase to store loan information.

## Table Structure

| Column Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `loan_number` | VARCHAR(100) | Unique loan account number |
| `principal_amount` | DECIMAL(15,2) | Original principal amount (must be > 0) |
| `original_interest_rate` | DECIMAL(5,2) | Original interest rate % (0-100) |
| `current_interest_rate` | DECIMAL(5,2) | Current interest rate % (0-100) |
| `emi_start_date` | DATE | Date when EMI payments started |
| `loan_tenure_months` | INTEGER | Total loan tenure in months (must be > 0) |
| `bank_name` | VARCHAR(255) | Name of the lending bank/institution |
| `loan_label` | VARCHAR(50) | Type: 'HomeLoan', 'PersonalLoan', 'CarLoan', or 'Other' |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-updated modification timestamp |

## Features

✅ **Constraints & Validations:**
- Unique loan numbers
- Positive principal amounts
- Interest rates between 0-100%
- Valid loan labels (enum constraint)

✅ **Indexes:**
- Fast lookups by loan number
- Efficient filtering by loan label

✅ **Auto-updating Timestamps:**
- `updated_at` automatically updates on row modification

✅ **Row Level Security (RLS):**
- Enabled with policy for authenticated users
- Customize policies based on your auth requirements

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `create_loan_details_table.sql`
4. Paste and click **Run**

### Option 2: Supabase CLI
```bash
# Make sure you're logged in to Supabase CLI
supabase db push

# Or run the migration directly
supabase db execute --file scripts/create_loan_details_table.sql
```

## Example Usage

### Insert a Sample Loan
```sql
INSERT INTO loan_details (
    loan_number,
    principal_amount,
    original_interest_rate,
    current_interest_rate,
    emi_start_date,
    loan_tenure_months,
    bank_name,
    loan_label
) VALUES (
    'HL123456789',
    5000000.00,
    8.50,
    8.25,
    '2024-01-01',
    240,
    'HDFC Bank',
    'HomeLoan'
);
```

### Query Loans
```sql
-- Get all home loans
SELECT * FROM loan_details WHERE loan_label = 'HomeLoan';

-- Get loans by bank
SELECT * FROM loan_details WHERE bank_name = 'HDFC Bank';

-- Get loan by loan number
SELECT * FROM loan_details WHERE loan_number = 'HL123456789';
```

## TypeScript Integration

The corresponding TypeScript types have been added to `src/types/index.ts`:
- `LoanDetailsDB` - Full database record type
- `CreateLoanDetailsRequest` - Type for creating new loans
- `LoanLabel` - Type-safe loan label enum

## Next Steps

After creating the table, you can:
1. Create API routes to interact with the table
2. Build UI components for loan management
3. Link loans to EMI transactions using `loan_id`
