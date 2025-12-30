# Services Layer Architecture

This document explains the services layer architecture that separates API calls from components and stores.

## Architecture Overview

```
Component/Store → Service → API Route → Supabase
```

### Flow:
1. **Components** (e.g., `LoanConfiguration.tsx`, `AmortizationTable.tsx`) interact with **Stores** or call **Services** directly
2. **Stores** (e.g., `loan-details-store.ts`, `emi-transactions-store.ts`) use **Services** for data operations
3. **Services** (e.g., `LoanDetailsService.ts`, `EmiTransactionsService.ts`) handle all HTTP requests to **API Routes**
4. **API Routes** (e.g., `/api/loan-details/route.ts`, `/api/emi-transactions/route.ts`) interact with **Supabase**

## Directory Structure

```
src/
├── components/           # UI Components
│   ├── LoanConfiguration.tsx
│   ├── AmortizationTable.tsx
│   └── ...
├── services/            # Service Layer (NEW)
│   ├── index.ts                    # Central export point
│   ├── LoanDetailsService.ts       # Loan details API calls
│   ├── EmiTransactionsService.ts   # EMI transactions API calls
│   └── LocalStorageService.ts      # Local storage operations
├── store/               # Zustand State Management
│   ├── loan-details-store.ts
│   ├── emi-transactions-store.ts
│   └── emi-store.ts
└── app/
    └── api/             # Next.js API Routes
        ├── loan-details/
        │   └── route.ts
        └── emi-transactions/
            └── route.ts
```

## Services

### 1. LoanDetailsService

**Location:** `src/services/LoanDetailsService.ts`

**Purpose:** Handles all API calls related to loan details (CRUD operations)

**Methods:**
- `fetchLoanDetails()` - Get all loan details for authenticated user
- `fetchLoanByNumber(loanNumber)` - Get specific loan by loan number
- `fetchLoanById(id)` - Get specific loan by ID
- `saveLoanDetails(loanData)` - Create or update loan details
- `deleteLoanDetails(id)` - Delete loan details by ID

**Usage Example:**
```typescript
import { loanDetailsService } from '@/services';

// Fetch all loans
const loans = await loanDetailsService.fetchLoanDetails();

// Save loan
const result = await loanDetailsService.saveLoanDetails({
  loan_number: 'LOAN001',
  principal_amount: 5000000,
  // ... other fields
});
```

### 2. EmiTransactionsService

**Location:** `src/services/EmiTransactionsService.ts`

**Purpose:** Handles all API calls related to EMI transactions

**Methods:**
- `fetchTransactionsByLoanId(loanId)` - Get all transactions for a loan
- `fetchTransactionsByMonth(monthNumber)` - Get transactions by month
- `saveTransaction(transaction)` - Create or update a single transaction
- `batchSaveTransactions(transactions)` - Batch create/update multiple transactions
- `updateTransaction(id, updateData)` - Update a transaction by ID
- `deleteTransaction(id)` - Delete a single transaction
- `deleteTransactionsFromMonth(loanId, transactionType, fromMonth)` - Delete transactions from a specific month onwards

**Usage Example:**
```typescript
import { emiTransactionsService } from '@/services';

// Fetch transactions for a loan
const transactions = await emiTransactionsService.fetchTransactionsByLoanId('loan-123');

// Save a single transaction
const result = await emiTransactionsService.saveTransaction({
  loan_id: 'loan-123',
  emi_date: '2024-01-01',
  month_number: 1,
  transaction_type: 'emi',
  amount_paid: 50000,
  principal_component: 30000,
  interest_component: 20000,
});

// Batch save transactions
const batchResult = await emiTransactionsService.batchSaveTransactions([
  { /* transaction 1 */ },
  { /* transaction 2 */ },
  // ...
]);

// Delete transactions from month 6 onwards
const deletedCount = await emiTransactionsService.deleteTransactionsFromMonth(
  'loan-123',
  'emi',
  6
);
```

### 3. LocalStorageService

**Location:** `src/services/LocalStorageService.ts`

**Purpose:** Handles offline data storage using IndexedDB with LocalStorage fallback

**Methods:**
- `getLoanDetails()` - Get all loan details from local storage
- `getLoanByNumber(loanNumber)` - Get specific loan by loan number
- `saveLoanDetails(loan)` - Save or update loan details
- `deleteLoanDetails(loanNumber)` - Delete loan details
- `getTransactionsByLoanId(loanId)` - Get all transactions for a loan
- `getTransaction(loanId, monthNumber, transactionType)` - Get specific transaction
- `saveTransaction(transaction)` - Save or update a transaction
- `deleteTransaction(id)` - Delete a transaction
- `deleteTransactionsFromMonth(loanId, transactionType, fromMonth)` - Delete transactions from a month onwards
- `hasLocalData()` - Check if there is any local data
- `clearAllData()` - Clear all local data

## Benefits of This Architecture

### 1. **Separation of Concerns**
- Components focus on UI and user interactions
- Stores manage application state
- Services handle API communication
- API routes handle server-side logic and database operations

### 2. **Reusability**
- Services can be used by multiple components and stores
- No code duplication for API calls

### 3. **Maintainability**
- API endpoints are centralized in service files
- Easy to update API calls in one place
- Clear separation makes debugging easier

### 4. **Type Safety**
- Services provide typed interfaces for API responses
- TypeScript ensures correct usage across the application

### 5. **Error Handling**
- Centralized error handling in services
- Consistent error messages and logging

### 6. **Testing**
- Services can be easily mocked for unit testing
- Components can be tested without making actual API calls

## Migration Guide

### Before (Direct API Calls in Components):
```typescript
// In component
const response = await fetch('/api/loan-details', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loanData),
});
const result = await response.json();
if (!response.ok) {
  throw new Error(result.error);
}
```

### After (Using Service Layer):
```typescript
// In component
import { loanDetailsService } from '@/services';

const result = await loanDetailsService.saveLoanDetails(loanData);
// Error handling is done inside the service
```

## Best Practices

1. **Always use services for API calls** - Never make direct `fetch` calls in components or stores
2. **Import from index** - Use `import { loanDetailsService } from '@/services'` instead of importing directly from service files
3. **Handle errors in components** - Services throw errors, components should catch and display them to users
4. **Use TypeScript types** - Services use types from `@/types` for type safety
5. **Keep services focused** - Each service should handle one domain (loans, transactions, etc.)

## API Routes

The services communicate with these API routes:

### `/api/loan-details`
- **GET** - Fetch loan details (with optional query params: `loan_number`, `id`)
- **POST** - Create or update loan details
- **DELETE** - Delete loan details (requires `id` query param)

### `/api/emi-transactions`
- **GET** - Fetch transactions (with optional query params: `loan_id`, `month_number`)
- **POST** - Create or update a single transaction
- **PATCH** - Batch create/update multiple transactions
- **PUT** - Update a transaction by ID
- **DELETE** - Delete transaction(s) (requires `id` OR `loan_id`, `transaction_type`, `from_month`)

## Error Handling

All services throw errors that should be caught by the calling code:

```typescript
try {
  const result = await loanDetailsService.saveLoanDetails(loanData);
  // Success handling
} catch (error) {
  console.error('Error saving loan:', error);
  // Error handling (e.g., show toast notification)
}
```

## Future Enhancements

1. **Request Caching** - Add caching layer to reduce API calls
2. **Retry Logic** - Implement automatic retry for failed requests
3. **Request Cancellation** - Add ability to cancel in-flight requests
4. **Optimistic Updates** - Update UI before API call completes
5. **Offline Queue** - Queue API calls when offline and sync when online

## Related Files

- **Types:** `src/types/index.ts` - TypeScript interfaces and types
- **Stores:** `src/store/` - Zustand state management
- **Components:** `src/components/` - React components
- **API Routes:** `src/app/api/` - Next.js API routes
