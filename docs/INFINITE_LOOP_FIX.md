# Infinite Loop Fix - Loan Configuration Auto-Save

## Problem
The application was stuck in an infinite loop causing severe performance issues:

```
Save → Fetch → Update Store → Trigger Debounce → Save → Fetch → ...
```

## Root Causes

### 1. Unnecessary Fetch After Save
**Location**: `src/store/loan-details-store.ts` line 124

After saving loan details to IndexedDB, the store was calling `fetchLoanDetails()` to refresh the data. This was unnecessary because:
- The saved data was already available in `result.data`
- The `currentLoan` was already being updated with the saved data
- The fetch triggered the update effect in LoanConfiguration, starting the loop

**Fix**: Removed the `fetchLoanDetails()` call and updated both `currentLoan` and `loans` directly with the saved data.

### 2. Unconditional Store Updates
**Location**: `src/components/LoanConfiguration.tsx` lines 59-79

The effect that updates the store when `currentLoan` changes was running even when the values hadn't actually changed. This meant:
- Save updates `currentLoan` → Effect runs → Updates store → Triggers debounce → Saves again

**Fix**: Added a check to only update the store if the values have actually changed:
```typescript
const valuesChanged = 
    loanDetails.principal !== currentLoan.principal_amount ||
    loanDetails.rate !== currentLoan.current_interest_rate ||
    loanDetails.durationMonths !== currentLoan.loan_tenure_months;

if (valuesChanged) {
    // Only update if different
    setLoanDetails({...});
}
```

## Changes Made

### `src/store/loan-details-store.ts`
- ❌ Removed: `await get().fetchLoanDetails()` after saving
- ✅ Added: Direct update of `loans` array with saved data
- ✅ Added: Console log for successful save

### `src/components/LoanConfiguration.tsx`
- ✅ Added: Value comparison before updating store
- ✅ Added: Console log when skipping unnecessary updates
- ✅ Added: `loanDetails` to dependency array for proper comparison

## Result
- ✅ No more infinite loop
- ✅ Significant performance improvement
- ✅ Auto-save still works correctly
- ✅ Store remains single source of truth
- ✅ Values persist across page refreshes

## How It Works Now

1. **User changes value** → Local state updates
2. **Debounce timer (2s)** → Saves to IndexedDB
3. **Save updates currentLoan** → Effect checks if values changed
4. **If unchanged** → Skip update (no loop!)
5. **If changed** → Update store once (e.g., on page load)

The loop is broken because saving no longer triggers a fetch, and the update effect only runs when values actually change.
