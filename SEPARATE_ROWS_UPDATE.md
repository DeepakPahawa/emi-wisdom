# 🔄 Separate Rows for Paid EMI and EMI Hacks

## What Changed?

The system now allows **two separate rows** for the same month:
1. One row for **Paid EMI** (transaction_type = 'emi')
2. One row for **EMI Hacks** (transaction_type = 'part_payment')

## Database Schema Update

### New Unique Constraint
```sql
UNIQUE(month_number, transaction_type)
```

This means:
- ✅ You can have ONE 'emi' transaction per month
- ✅ You can have ONE 'part_payment' transaction per month
- ✅ You can have BOTH in the same month
- ❌ You cannot have TWO 'emi' transactions in the same month
- ❌ You cannot have TWO 'part_payment' transactions in the same month

## How It Works Now

### Scenario: Month 1 - Both Paid EMI and EMI Hack

**Step 1: Enter Paid EMI**
```
Click "Paid EMI" for Month 1
Enter: ₹50,000
Press Enter
```

**Database Row 1:**
```json
{
  "id": "uuid-1",
  "month_number": 1,
  "transaction_type": "emi",
  "amount_paid": 50000,
  "principal_component": 35000,
  "interest_component": 15000
}
```

**Step 2: Enter EMI Hack**
```
Click "EMI Hacks" for Month 1
Enter: ₹10,000
Press Enter
```

**Database Row 2:**
```json
{
  "id": "uuid-2",
  "month_number": 1,
  "transaction_type": "part_payment",
  "amount_paid": 10000,
  "principal_component": 10000,
  "interest_component": 0
}
```

**Result:** Two separate rows for Month 1! ✅

## API Logic

### Upsert Check
```typescript
// Check for existing transaction with BOTH month_number AND transaction_type
const existingTransaction = await supabase
    .from('emi_transactions')
    .select('id')
    .eq('month_number', body.month_number)
    .eq('transaction_type', body.transaction_type)  // ← Key change!
    .maybeSingle();
```

### Behavior

| Action | Existing Record | Result |
|--------|----------------|--------|
| Enter Paid EMI Month 1 | None | **Create** new 'emi' row |
| Edit Paid EMI Month 1 | 'emi' exists | **Update** existing 'emi' row |
| Enter EMI Hack Month 1 | 'emi' exists | **Create** new 'part_payment' row |
| Edit EMI Hack Month 1 | Both exist | **Update** existing 'part_payment' row |

## Real-World Example

### Month 1: Regular EMI + Year-End Bonus

**Regular EMI Payment (Paid EMI):**
- Amount: ₹50,000
- Principal: ₹35,000
- Interest: ₹15,000
- Type: 'emi'

**Bonus Payment (EMI Hack):**
- Amount: ₹100,000
- Principal: ₹100,000
- Interest: ₹0
- Type: 'part_payment'

**Total for Month 1:**
- Total Paid: ₹150,000
- Total Principal: ₹135,000
- Total Interest: ₹15,000

**Database:** 2 rows for Month 1 ✅

## Benefits

### ✅ Complete Tracking
- Track regular EMI payments separately
- Track extra payments separately
- See both in the same month

### ✅ Accurate Analysis
- Know exactly how much was regular EMI
- Know exactly how much was extra payment
- Calculate total impact easily

### ✅ Flexible Editing
- Edit Paid EMI without affecting EMI Hack
- Edit EMI Hack without affecting Paid EMI
- Independent updates for each type

### ✅ Clear History
- See payment patterns over time
- Identify months with extra payments
- Track total principal reduction

## Database Structure

### Example: 3 Months of Data

```
| id   | month | type         | amount | principal | interest |
|------|-------|--------------|--------|-----------|----------|
| uuid1| 1     | emi          | 50000  | 35000     | 15000    |
| uuid2| 1     | part_payment | 10000  | 10000     | 0        |
| uuid3| 2     | emi          | 50000  | 35200     | 14800    |
| uuid4| 3     | emi          | 50000  | 35400     | 14600    |
| uuid5| 3     | part_payment | 50000  | 50000     | 0        |
```

**Analysis:**
- Month 1: Regular EMI + Extra ₹10,000
- Month 2: Regular EMI only
- Month 3: Regular EMI + Extra ₹50,000

## Setup Instructions

### Step 1: Update Database

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Drop the old table
DROP TABLE IF EXISTS emi_transactions CASCADE;

-- Create with composite unique constraint
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
    
    -- Composite unique constraint
    UNIQUE(month_number, transaction_type)
);

-- Create indexes
CREATE INDEX idx_emi_transactions_loan_id ON emi_transactions(loan_id);
CREATE INDEX idx_emi_transactions_emi_date ON emi_transactions(emi_date);
CREATE INDEX idx_emi_transactions_month_number ON emi_transactions(month_number);
CREATE INDEX idx_emi_transactions_type ON emi_transactions(transaction_type);

-- Create trigger
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

-- Enable RLS and create policy
ALTER TABLE emi_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for testing" 
ON "public"."emi_transactions"
FOR ALL TO public 
USING (true) 
WITH CHECK (true);
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

## Testing

### Test 1: Create Both Types for Month 1
```
1. Click "Paid EMI" for Month 1
2. Enter: 50000
3. Check Supabase: 1 row with type='emi' ✓

4. Click "EMI Hacks" for Month 1
5. Enter: 10000
6. Check Supabase: 2 rows for Month 1 ✓
   - Row 1: type='emi', amount=50000
   - Row 2: type='part_payment', amount=10000
```

### Test 2: Edit Paid EMI
```
1. Click "Paid EMI" for Month 1 (already has value)
2. Change to: 52000
3. Check Supabase: 
   - Row 1: type='emi', amount=52000 (updated) ✓
   - Row 2: type='part_payment', amount=10000 (unchanged) ✓
```

### Test 3: Edit EMI Hack
```
1. Click "EMI Hacks" for Month 1 (already has value)
2. Change to: 15000
3. Check Supabase:
   - Row 1: type='emi', amount=52000 (unchanged) ✓
   - Row 2: type='part_payment', amount=15000 (updated) ✓
```

## Query Examples

### Get All Transactions for Month 1
```sql
SELECT * FROM emi_transactions
WHERE month_number = 1
ORDER BY transaction_type;
```

### Get Total Paid for Month 1
```sql
SELECT 
    month_number,
    SUM(amount_paid) as total_paid,
    SUM(principal_component) as total_principal,
    SUM(interest_component) as total_interest
FROM emi_transactions
WHERE month_number = 1
GROUP BY month_number;
```

### Get All EMI Hacks
```sql
SELECT * FROM emi_transactions
WHERE transaction_type = 'part_payment'
ORDER BY month_number;
```

### Get Monthly Summary
```sql
SELECT 
    month_number,
    MAX(CASE WHEN transaction_type = 'emi' THEN amount_paid END) as emi_paid,
    MAX(CASE WHEN transaction_type = 'part_payment' THEN amount_paid END) as extra_paid,
    SUM(amount_paid) as total_paid,
    SUM(principal_component) as total_principal
FROM emi_transactions
GROUP BY month_number
ORDER BY month_number;
```

## Important Notes

### ⚠️ Unique Constraint Enforcement

The database will **prevent**:
- Two 'emi' transactions for the same month
- Two 'part_payment' transactions for the same month

The database will **allow**:
- One 'emi' and one 'part_payment' for the same month
- Multiple months with both types

### 💡 Best Practices

1. **Regular Payments**: Always use "Paid EMI" column
2. **Extra Payments**: Always use "EMI Hacks" column
3. **Editing**: Click the same column to update that specific transaction
4. **Viewing**: Check Supabase to see both rows for a month

## Build Status

✅ **Build Successful**
```
✓ Compiled successfully
✓ TypeScript passed
✓ No errors
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Rows per month** | 1 | Up to 2 |
| **Unique key** | `month_number` | `(month_number, transaction_type)` |
| **Paid EMI + EMI Hack** | Last edit wins | Both saved separately |
| **Editing** | Overwrites | Updates correct row |
| **Analysis** | Limited | Complete tracking |

---

**Version**: 1.4  
**Date**: December 21, 2025  
**Status**: ✅ Implemented
