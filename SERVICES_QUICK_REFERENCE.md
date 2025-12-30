# Services Layer - Quick Reference Guide

## 🚀 Quick Start

### Import Services
```typescript
import { loanDetailsService, emiTransactionsService } from '@/services';
```

## 📋 LoanDetailsService API

### Fetch All Loans
```typescript
const loans = await loanDetailsService.fetchLoanDetails();
// Returns: LoanDetailsDB[]
```

### Fetch Loan by Number
```typescript
const loan = await loanDetailsService.fetchLoanByNumber('LOAN001');
// Returns: LoanDetailsDB | null
```

### Fetch Loan by ID
```typescript
const loan = await loanDetailsService.fetchLoanById('uuid-123');
// Returns: LoanDetailsDB | null
```

### Save Loan (Create or Update)
```typescript
const result = await loanDetailsService.saveLoanDetails({
  loan_number: 'LOAN001',
  principal_amount: 5000000,
  original_interest_rate: 9.0,
  current_interest_rate: 9.0,
  emi_start_date: '2024-01-01',
  loan_tenure_months: 240,
  bank_name: 'HDFC Bank',
  loan_label: 'HomeLoan',
});
// Returns: { data: LoanDetailsDB, isUpdate: boolean }
```

### Delete Loan
```typescript
await loanDetailsService.deleteLoanDetails('uuid-123');
// Returns: void
```

## 📋 EmiTransactionsService API

### Fetch Transactions by Loan ID
```typescript
const transactions = await emiTransactionsService.fetchTransactionsByLoanId('loan-123');
// Returns: EmiTransaction[]
```

### Fetch Transactions by Month
```typescript
const transactions = await emiTransactionsService.fetchTransactionsByMonth(6);
// Returns: EmiTransaction[]
```

### Save Single Transaction
```typescript
const result = await emiTransactionsService.saveTransaction({
  loan_id: 'loan-123',
  emi_date: '2024-01-01',
  month_number: 1,
  transaction_type: 'emi', // or 'part_payment'
  amount_paid: 50000,
  principal_component: 30000,
  interest_component: 20000,
});
// Returns: { data: EmiTransaction, isUpdate: boolean }
```

### Batch Save Transactions
```typescript
const result = await emiTransactionsService.batchSaveTransactions([
  {
    loan_id: 'loan-123',
    emi_date: '2024-01-01',
    month_number: 1,
    transaction_type: 'emi',
    amount_paid: 50000,
    principal_component: 30000,
    interest_component: 20000,
  },
  {
    loan_id: 'loan-123',
    emi_date: '2024-02-01',
    month_number: 2,
    transaction_type: 'emi',
    amount_paid: 50000,
    principal_component: 30500,
    interest_component: 19500,
  },
  // ... more transactions
]);
// Returns: { count: number, inserted: number, updated: number }
```

### Update Transaction
```typescript
const transaction = await emiTransactionsService.updateTransaction('txn-id-123', {
  amount_paid: 55000,
  principal_component: 35000,
  interest_component: 20000,
});
// Returns: EmiTransaction
```

### Delete Single Transaction
```typescript
await emiTransactionsService.deleteTransaction('txn-id-123');
// Returns: void
```

### Delete Transactions from Month Onwards
```typescript
const deletedCount = await emiTransactionsService.deleteTransactionsFromMonth(
  'loan-123',
  'emi', // or 'part_payment'
  6 // from month 6 onwards
);
// Returns: number (count of deleted transactions)
```

## 🎯 Common Patterns

### Pattern 1: Fetch and Display
```typescript
try {
  const loans = await loanDetailsService.fetchLoanDetails();
  setLoans(loans);
} catch (error) {
  console.error('Error fetching loans:', error);
  toast({
    title: "Error",
    description: error instanceof Error ? error.message : 'Failed to fetch loans',
    variant: "destructive",
  });
}
```

### Pattern 2: Save with Loading State
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    const result = await loanDetailsService.saveLoanDetails(loanData);
    toast({
      title: result.isUpdate ? "Updated" : "Created",
      description: "Loan details saved successfully",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : 'Failed to save',
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
};
```

### Pattern 3: Delete with Confirmation
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this loan?')) {
    return;
  }
  
  try {
    await loanDetailsService.deleteLoanDetails(id);
    toast({
      title: "Deleted",
      description: "Loan deleted successfully",
    });
    // Refresh list
    fetchLoans();
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : 'Failed to delete',
      variant: "destructive",
    });
  }
};
```

### Pattern 4: Batch Operations
```typescript
const handleBatchSync = async (transactions: CreateEmiTransactionRequest[]) => {
  try {
    const result = await emiTransactionsService.batchSaveTransactions(transactions);
    toast({
      title: "Synced",
      description: `${result.count} transactions synced (${result.inserted} new, ${result.updated} updated)`,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : 'Failed to sync',
      variant: "destructive",
    });
  }
};
```

## 🔍 Error Handling

All services throw errors that should be caught:

```typescript
try {
  const result = await loanDetailsService.saveLoanDetails(data);
  // Success
} catch (error) {
  // Error handling
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }
}
```

## 📝 Type Definitions

### LoanDetailsDB
```typescript
interface LoanDetailsDB {
  id?: string;
  user_id?: string;
  loan_number: string;
  principal_amount: number;
  original_interest_rate: number;
  current_interest_rate: number;
  emi_start_date: string;
  loan_tenure_months: number;
  bank_name: string;
  loan_label: 'HomeLoan' | 'PersonalLoan' | 'CarLoan' | 'Other';
  created_at?: string;
  updated_at?: string;
}
```

### EmiTransaction
```typescript
interface EmiTransaction {
  id?: string;
  loan_id: string;
  emi_date: string;
  month_number: number;
  transaction_type: 'emi' | 'part_payment';
  amount_paid: number;
  principal_component: number;
  interest_component: number;
  created_at?: string;
  updated_at?: string;
}
```

## ⚡ Performance Tips

1. **Use batch operations** when saving multiple transactions
2. **Fetch only what you need** - use specific query methods
3. **Handle errors gracefully** - always wrap in try-catch
4. **Show loading states** - improve UX during API calls
5. **Cache when possible** - store results in state/store

## 🔗 Related Files

- **Services**: `src/services/`
- **Types**: `src/types/index.ts`
- **Stores**: `src/store/`
- **API Routes**: `src/app/api/`
- **Documentation**: `src/services/README.md`

## 📚 Further Reading

- [Full Documentation](./src/services/README.md)
- [Architecture Diagram](./ARCHITECTURE.md)
- [Implementation Summary](./SERVICES_IMPLEMENTATION.md)
