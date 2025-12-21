# EMI Transactions with Loan ID Integration

## Summary
Updated the EMI transactions CRUD operations to include `loan_id` for proper association with loan details from the `loan-details-store`.

## Changes Made

### 1. **Updated Type Definitions** (`src/types/index.ts`)
- Added `loan_id: string` to `CreateEmiTransactionRequest` interface
- This ensures all new transactions are associated with a specific loan

### 2. **Created EMI Transactions Store** (`src/store/emi-transactions-store.ts`)
- New Zustand store for managing EMI transactions
- **Key Features:**
  - `fetchTransactionsByLoanId(loanId: string)`: Fetches all transactions for a specific loan
  - `transactions`: Array of EMI transactions
  - Loading and error states
  - `clearTransactions()`: Clears the transactions array

### 3. **Updated AmortizationTable Component** (`src/components/AmortizationTable.tsx`)

#### Added Imports:
- `useEffect` from React
- `useLoanDetailsStore` to access current loan
- `useEmiTransactionsStore` to manage transactions

#### Key Changes:
1. **Loan ID Validation**: 
   - Before saving a transaction, checks if `currentLoan?.id` exists
   - Shows warning toast if user tries to add transactions without saving loan details first

2. **Include loan_id in Transactions**:
   ```typescript
   const transactionData: CreateEmiTransactionRequest = {
       loan_id: currentLoan.id, // ✅ Now includes loan_id
       emi_date: point.date.toISOString().split('T')[0],
       month_number: month,
       transaction_type: transactionType,
       amount_paid: amount,
       principal_component: principalComponent,
       interest_component: interestComponent,
   };
   ```

3. **Auto-fetch Transactions on Loan Load**:
   ```typescript
   useEffect(() => {
       if (currentLoan?.id) {
           fetchTransactionsByLoanId(currentLoan.id);
       }
   }, [currentLoan?.id, fetchTransactionsByLoanId]);
   ```

4. **Auto-populate Table from Database**:
   ```typescript
   useEffect(() => {
       if (transactions.length > 0) {
           transactions.forEach((transaction) => {
               if (transaction.transaction_type === 'emi') {
                   updatePaidEmi(transaction.month_number, transaction.amount_paid);
               } else if (transaction.transaction_type === 'part_payment') {
                   updateEmiHack(transaction.month_number, transaction.amount_paid);
               }
           });
       }
   }, [transactions, updatePaidEmi, updateEmiHack]);
   ```

5. **Refresh After Save**:
   - After successfully saving a transaction, automatically fetches updated transactions
   - Ensures UI stays in sync with database

## API Integration

### Fetching Transactions
The API endpoint should support fetching by loan_id:
```
GET /api/emi-transactions?loan_id={loanId}
```

### Creating/Updating Transactions
```
POST /api/emi-transactions
Body: {
  loan_id: string,
  emi_date: string,
  month_number: number,
  transaction_type: 'emi' | 'part_payment',
  amount_paid: number,
  principal_component: number,
  interest_component: number
}
```

## User Flow

1. **User saves loan details** → `currentLoan.id` is set
2. **AmortizationTable automatically fetches** all existing transactions for that loan
3. **Table is populated** with previously saved Paid EMI and EMI Hacks values
4. **User enters new transaction** → Saved with `loan_id`
5. **Transactions refresh** → Table updates with latest data

## Benefits

✅ **Proper Data Association**: Each transaction is linked to a specific loan  
✅ **Multi-loan Support**: Foundation for supporting multiple loans in the future  
✅ **Data Persistence**: Transactions are saved and loaded from database  
✅ **Automatic Sync**: UI automatically updates when loan changes  
✅ **User-friendly**: Clear warning if user tries to add transactions without a loan  

## Database Schema Requirement

Ensure the `emi_transactions` table has:
- `loan_id` column (UUID, references `loan_details.id`)
- Composite unique constraint on `(loan_id, month_number, transaction_type)`
- Index on `loan_id` for fast queries

## Testing Checklist

- [ ] Save loan details first
- [ ] Add Paid EMI transaction → Verify it's saved with loan_id
- [ ] Add EMI Hack transaction → Verify it's saved with loan_id
- [ ] Reload page → Verify transactions are fetched and populated
- [ ] Switch to different loan → Verify correct transactions are loaded
- [ ] Try adding transaction without loan → Verify warning is shown
