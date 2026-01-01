# Loan Details Store Simplification

## Overview
Simplified `useLoanDetailsStore` to work exclusively with IndexedDB, removing all Supabase-related code while keeping Supabase files intact for potential future use.

## Changes Made

### Removed
1. **StorageService dependency** - No longer uses the abstraction layer
2. **Backend detection** - Removed `storageBackend` state and `getBackend()` calls
3. **Sync functionality** - Removed `syncToSupabase()` action
4. **Sync states** - Removed `isSyncing` and `lastSyncedAt` states
5. **StorageBackend type** - No longer tracking which backend is in use
6. **LoanDetailsService** - Removed service layer abstraction

### Added
1. **Direct IndexedDB integration** - Uses `indexedDBService` directly
2. **Simplified interface** - Cleaner, more focused store interface

### Kept Intact
- All Supabase files in `src/lib/supabase/`
- StorageService file (not imported but available)
- LoanDetailsService file (not imported but available)
- All API routes in `src/app/api/`

## New Store Structure

### State
```typescript
{
    currentLoan: LoanDetailsDB | null;
    loans: LoanDetailsDB[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}
```

### Actions
```typescript
{
    setCurrentLoan: (loan) => void;
    setLoans: (loans) => void;
    setIsLoading: (loading) => void;
    setIsSaving: (saving) => void;
    setError: (error) => void;
    fetchLoanDetails: () => Promise<void>;
    saveLoanDetails: (loan) => Promise<boolean>;
    clearCurrentLoan: () => void;
}
```

## Benefits

1. **Simpler Code** - Removed ~50 lines of abstraction code
2. **Faster Execution** - No backend detection or service layer overhead
3. **Easier to Understand** - Direct IndexedDB calls are more transparent
4. **Better Performance** - Fewer function calls and async operations
5. **Focused Functionality** - Does one thing well: manage IndexedDB loan data

## Data Flow

### Before (Complex)
```
Component → Store → StorageService → Backend Detection → LoanDetailsService → IndexedDBService
```

### After (Simple)
```
Component → Store → IndexedDBService
```

## Migration Notes

- No breaking changes for components using the store
- Same API surface for `fetchLoanDetails()` and `saveLoanDetails()`
- Removed properties (`storageBackend`, `isSyncing`, etc.) are no longer available
- `syncToSupabase()` action is removed

## Future Considerations

If Supabase integration is needed in the future:
1. All Supabase files are still available
2. Can re-add StorageService abstraction
3. Can implement sync as a separate utility function
4. Store interface can be extended without breaking existing code
