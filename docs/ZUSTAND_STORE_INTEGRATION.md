# Zustand Store Integration for Loan Details

## Overview
A dedicated Zustand store has been created to manage loan details fetched from the Supabase database. This provides centralized state management with persistence and automatic synchronization.

## Store Location
**File**: `src/store/loan-details-store.ts`

## Store Structure

### State
```typescript
interface LoanDetailsStore {
    // Current active loan
    currentLoan: LoanDetailsDB | null;
    
    // All loans (for future multi-loan support)
    loans: LoanDetailsDB[];
    
    // Loading states
    isLoading: boolean;
    isSaving: boolean;
    
    // Error state
    error: string | null;
    
    // Actions...
}
```

### Actions

#### 1. **setCurrentLoan**
```typescript
setCurrentLoan: (loan: LoanDetailsDB | null) => void
```
- Manually set the current loan
- Useful for switching between loans

#### 2. **setLoans**
```typescript
setLoans: (loans: LoanDetailsDB[]) => void
```
- Set the entire loans array
- Used after fetching all loans

#### 3. **fetchLoanDetails**
```typescript
fetchLoanDetails: () => Promise<void>
```
- Fetches all loans from `/api/loan-details`
- Sets `currentLoan` to the most recent loan
- Updates `loans` array
- Handles loading and error states automatically

#### 4. **saveLoanDetails**
```typescript
saveLoanDetails: (loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
```
- Saves loan details to database via API
- Returns `true` on success, `false` on failure
- Automatically refreshes the loans list after save
- Updates `currentLoan` with saved data
- Handles loading and error states

#### 5. **clearCurrentLoan**
```typescript
clearCurrentLoan: () => void
```
- Clears the current loan
- Useful for resetting the form

## Persistence

The store uses Zustand's `persist` middleware to save data to localStorage:

```typescript
persist(
    (set, get) => ({ /* store implementation */ }),
    {
        name: 'loan-details-storage',
        partialize: (state) => ({
            currentLoan: state.currentLoan,
        }),
    }
)
```

**What's persisted**: Only `currentLoan` is saved to localStorage
**What's NOT persisted**: Loading states, errors, and the full loans array

## Integration in InputForm

### Before (Manual API Calls)
```typescript
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
    const fetchLoanDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/loan-details');
            // ... manual handling
        } catch (error) {
            // ... error handling
        } finally {
            setIsLoading(false);
        }
    };
    fetchLoanDetails();
}, []);
```

### After (Using Store)
```typescript
const { 
    currentLoan, 
    isLoading: storeLoading, 
    isSaving: storeSaving,
    fetchLoanDetails,
    saveLoanDetails 
} = useLoanDetailsStore();

// Fetch on mount
useEffect(() => {
    fetchLoanDetails();
}, [fetchLoanDetails]);

// Auto-populate form when currentLoan changes
useEffect(() => {
    if (currentLoan) {
        setBankName(currentLoan.bank_name);
        setLoanLabel(currentLoan.loan_label);
        // ... etc
    }
}, [currentLoan]);
```

## Benefits

### ✅ **Centralized State Management**
- Single source of truth for loan details
- Accessible from any component

### ✅ **Automatic Persistence**
- Current loan survives page refreshes
- Stored in localStorage automatically

### ✅ **Simplified API Calls**
- No need to manage fetch logic in components
- Consistent error handling across the app

### ✅ **Loading States**
- Built-in loading indicators
- No manual state management needed

### ✅ **Type Safety**
- Full TypeScript support
- Compile-time error checking

### ✅ **Future-Proof**
- Ready for multi-loan support
- Easy to extend with new features

## Usage Examples

### Fetch Loan Details
```typescript
const { fetchLoanDetails, currentLoan, isLoading } = useLoanDetailsStore();

useEffect(() => {
    fetchLoanDetails();
}, []);

if (isLoading) return <div>Loading...</div>;
if (currentLoan) return <div>{currentLoan.bank_name}</div>;
```

### Save Loan Details
```typescript
const { saveLoanDetails, isSaving } = useLoanDetailsStore();

const handleSave = async () => {
    const success = await saveLoanDetails({
        loan_number: 'HL123',
        principal_amount: 5000000,
        // ... other fields
    });
    
    if (success) {
        toast({ title: "Saved!" });
    } else {
        toast({ title: "Error", variant: "destructive" });
    }
};
```

### Access Current Loan
```typescript
const { currentLoan } = useLoanDetailsStore();

// currentLoan is automatically updated after save
// and persisted to localStorage
```

### Switch Between Loans (Future)
```typescript
const { loans, setCurrentLoan } = useLoanDetailsStore();

const handleSelectLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan) setCurrentLoan(loan);
};
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Page Load                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  1. Load from localStorage (if exists)                  │
│     currentLoan: { ... }                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. fetchLoanDetails() called                           │
│     - Sets isLoading = true                             │
│     - Calls /api/loan-details                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. API Response                                        │
│     - Sets loans = [...]                                │
│     - Sets currentLoan = loans[0]                       │
│     - Sets isLoading = false                            │
│     - Auto-saves to localStorage                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. Form Updates                                        │
│     - useEffect detects currentLoan change              │
│     - Populates form fields                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. User Edits & Saves                                  │
│     - saveLoanDetails() called                          │
│     - Sets isSaving = true                              │
│     - Calls /api/loan-details (POST)                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  6. Save Response                                       │
│     - Updates currentLoan with saved data               │
│     - Refreshes loans list                              │
│     - Sets isSaving = false                             │
│     - Auto-saves to localStorage                        │
└─────────────────────────────────────────────────────────┘
```

## Error Handling

The store automatically handles errors:

```typescript
try {
    const response = await fetch('/api/loan-details');
    // ... success handling
} catch (error) {
    set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch',
        loans: [],
        currentLoan: null
    });
}
```

Access errors in components:
```typescript
const { error } = useLoanDetailsStore();

if (error) {
    return <div>Error: {error}</div>;
}
```

## Migration Summary

### Changes Made

1. ✅ Created `src/store/loan-details-store.ts`
2. ✅ Integrated store into `InputForm.tsx`
3. ✅ Removed manual API calls from component
4. ✅ Removed local loading state variables
5. ✅ Added automatic form population from store
6. ✅ Replaced manual save logic with store action

### Breaking Changes
**None** - The component interface remains the same

### Performance Improvements
- Reduced re-renders with centralized state
- Automatic memoization with Zustand
- Persistent cache reduces API calls

## Future Enhancements

### 1. Multi-Loan Support
```typescript
// Add loan selector dropdown
const { loans, setCurrentLoan } = useLoanDetailsStore();

<Select onValueChange={(id) => {
    const loan = loans.find(l => l.id === id);
    setCurrentLoan(loan);
}}>
    {loans.map(loan => (
        <SelectItem value={loan.id}>{loan.loan_number}</SelectItem>
    ))}
</Select>
```

### 2. Optimistic Updates
```typescript
saveLoanDetails: async (loanData) => {
    // Optimistically update UI
    set({ currentLoan: { ...currentLoan, ...loanData } });
    
    // Then save to server
    const response = await fetch(...);
    
    // Rollback on error
    if (!response.ok) {
        set({ currentLoan: previousLoan });
    }
}
```

### 3. Real-time Sync
```typescript
// Subscribe to Supabase real-time updates
supabase
    .channel('loan_details')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_details' }, 
        (payload) => {
            fetchLoanDetails(); // Refresh on changes
        }
    )
    .subscribe();
```

## Testing

### Unit Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useLoanDetailsStore } from '@/store/loan-details-store';

test('fetchLoanDetails updates currentLoan', async () => {
    const { result } = renderHook(() => useLoanDetailsStore());
    
    await act(async () => {
        await result.current.fetchLoanDetails();
    });
    
    expect(result.current.currentLoan).toBeDefined();
    expect(result.current.isLoading).toBe(false);
});
```

## Conclusion

The Zustand store integration provides a robust, scalable solution for managing loan details with:
- Automatic persistence
- Centralized state management
- Built-in loading and error states
- Type-safe API
- Easy to extend for future features
