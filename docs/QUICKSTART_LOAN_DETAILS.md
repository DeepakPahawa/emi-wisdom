# Quick Start Guide - Loan Details Feature

## Step 1: Create the Database Table

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents from `scripts/create_loan_details_table.sql`
4. Paste and click **Run**

✅ Your `loan_details` table is now created!

## Step 2: Use the Enhanced UI

### New Fields in Loan Configuration

The Loan Configuration card now includes these new fields at the top:

```
┌─────────────────────────────────────────┐
│  LOAN CONFIGURATION                     │
├─────────────────────────────────────────┤
│                                         │
│  Bank Name                              │
│  [e.g., HDFC Bank, SBI, ICICI______]   │
│                                         │
│  Loan Type                              │
│  [Home Loan ▼]                          │
│   - Home Loan                           │
│   - Personal Loan                       │
│   - Car Loan                            │
│   - Other                               │
│                                         │
│  Loan Number                            │
│  [e.g., HL123456789_____________]       │
│                                         │
│  Principal Amount                       │
│  [5000000_______________________]       │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │
│  ₹ 1L                        ₹ 2Cr+     │
│                                         │
│  Interest Rate (%)                      │
│  [8.5________________________]          │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │
│  1%                             20%     │
│                                         │
│  EMI Start Date                         │
│  [📅 01/01/2024_____________]          │
│                                         │
│  Loan Tenure                            │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │
│  1 Yr                          30 Yrs   │
│                              20 Years   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │          Apply                    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Step 3: Create Your First Loan

1. **Fill in the required fields**:
   - Bank Name: `HDFC Bank`
   - Loan Type: Select `Home Loan`
   - Loan Number: `HL123456789`
   - Principal Amount: `5000000`
   - Interest Rate: `8.5`
   - EMI Start Date: Select your date
   - Loan Tenure: `20 Years`

2. **Click the "Apply" button**

3. **See success notification**:
   ```
   ✓ Created!
   Loan details created successfully
   ```

## Step 4: Update Loan Details

1. **Modify any field** (e.g., change interest rate to `8.25`)
2. **Click "Apply"** again
3. **See update notification**:
   ```
   ✓ Updated!
   Loan details updated successfully
   ```

## Step 5: Auto-Load on Refresh

1. **Refresh the page** (F5)
2. **All fields automatically populate** with your saved loan details
3. No need to re-enter information!

## Validation Rules

The form validates:
- ✅ Bank Name is required
- ✅ Loan Number is required
- ✅ Principal Amount must be > 0
- ✅ Interest Rate must be between 0-100%

If validation fails, you'll see an error toast:
```
❌ Validation Error
Please enter bank name
```

## API Endpoints

The feature uses these endpoints:

- **POST** `/api/loan-details` - Create or update loan
- **GET** `/api/loan-details` - Fetch loan details
- **DELETE** `/api/loan-details?id=xxx` - Delete loan

## Example API Usage

### Create/Update Loan
```javascript
const response = await fetch('/api/loan-details', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loan_number: 'HL123456789',
    principal_amount: 5000000,
    original_interest_rate: 8.5,
    current_interest_rate: 8.5,
    emi_start_date: '2024-01-01',
    loan_tenure_months: 240,
    bank_name: 'HDFC Bank',
    loan_label: 'HomeLoan'
  })
});
```

### Fetch Loans
```javascript
const response = await fetch('/api/loan-details');
const result = await response.json();
console.log(result.data); // Array of loan details
```

## Troubleshooting

### Issue: "Failed to save loan details"
**Solution**: Make sure you've run the SQL script in Supabase to create the table

### Issue: Fields not auto-loading
**Solution**: Check browser console for errors. Ensure Supabase credentials are correct in `.env.local`

### Issue: "Validation Error" on Apply
**Solution**: Ensure all required fields are filled:
- Bank Name (not empty)
- Loan Number (not empty)
- Principal Amount (> 0)
- Interest Rate (0-100%)

## What's Next?

You can now:
1. ✅ Store loan details in database
2. ✅ Auto-load loan details on page refresh
3. ✅ Update loan details anytime
4. ✅ Track different loan types (Home, Personal, Car, Other)

Future enhancements could include:
- Managing multiple loans
- Switching between different loans
- Linking loans to EMI transactions
- Viewing loan history
