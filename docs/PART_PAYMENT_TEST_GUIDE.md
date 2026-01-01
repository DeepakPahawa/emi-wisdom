# Quick Test Guide: Part Payment CRUD with IndexedDB

## Prerequisites
- Browser with IndexedDB support (Chrome, Firefox, Edge, Safari)
- EMI Hacks application running (`npm run dev`)

## Test Scenarios

### Scenario 1: Offline Part Payment Creation
**Goal**: Verify Part Payments are stored in IndexedDB when not authenticated

1. **Setup**:
   - Ensure you're signed out
   - Open browser DevTools (F12)
   - Go to Application → IndexedDB → `emi_hacks_db`

2. **Test Steps**:
   - Enter loan details (PA: 1000000, Rate: 8.5%, Tenure: 240 months)
   - Click "Save Details" (creates local loan)
   - In Amortization Table, hover over "Part Payment" column for Month 1
   - Click the green sync icon (ArrowDownUp)
   - Verify toast shows "Part Payment Added"

3. **Verification**:
   - In DevTools → IndexedDB → `emi_transactions`
   - Find transaction with `transaction_type: "part_payment"`
   - Verify `amount_paid` matches half of EMI
   - Verify `principal_component` equals `amount_paid`
   - Verify `interest_component` is 0

4. **Expected Result**: ✅ Part Payment stored in IndexedDB

---

### Scenario 2: Part Payment Update
**Goal**: Verify Part Payment amounts can be updated

1. **Test Steps**:
   - Click on the Part Payment cell (shows current amount)
   - Input field appears
   - Enter new amount (e.g., 75000)
   - Press Enter or click outside

2. **Verification**:
   - Check IndexedDB → `emi_transactions`
   - Verify `amount_paid` is updated to 75000
   - Verify `updated_at` timestamp is recent
   - Check UI shows new amount

3. **Expected Result**: ✅ Part Payment updated in IndexedDB

---

### Scenario 3: Part Payment Deletion
**Goal**: Verify Part Payments can be deleted

1. **Test Steps**:
   - Hover over a Part Payment cell with a value
   - Click the red delete icon (Trash2)
   - Verify toast shows "Part Payment Deleted"

2. **Verification**:
   - Check IndexedDB → `emi_transactions`
   - Verify transaction is removed
   - Check UI shows "-" in the cell

3. **Expected Result**: ✅ Part Payment deleted from IndexedDB

---

### Scenario 4: Batch Part Payment Creation
**Goal**: Verify multiple Part Payments can be created at once

1. **Test Steps**:
   - Hover over Part Payment cell for Month 10
   - Click the green sync icon
   - Wait for operation to complete

2. **Verification**:
   - Check IndexedDB → `emi_transactions`
   - Verify only Month 10 has a new Part Payment
   - Verify previous months (1-9) do NOT show loaders
   - Verify only Month 10 showed a loader during creation

3. **Expected Result**: ✅ Only new Part Payment created, no loaders on existing rows

---

### Scenario 5: Online Sync Test
**Goal**: Verify Part Payments sync to Supabase when signing in

1. **Setup**:
   - Ensure you have Part Payments in IndexedDB (from previous tests)
   - Note the count of Part Payments

2. **Test Steps**:
   - Click "Sign In" button
   - Sign in with Google
   - Wait for sync to complete
   - Check Supabase dashboard

3. **Verification**:
   - Go to Supabase → Table Editor → `emi_transactions`
   - Filter by `transaction_type = 'part_payment'`
   - Verify all local Part Payments are now in Supabase
   - Verify `user_id` is populated
   - Check Storage Indicator shows "Cloud" badge

4. **Expected Result**: ✅ Part Payments synced to Supabase

---

### Scenario 6: Mixed EMI and Part Payment
**Goal**: Verify EMI and Part Payment transactions coexist

1. **Test Steps**:
   - For Month 1, add both:
     - Paid EMI (click blue sync icon)
     - Part Payment (click green sync icon)

2. **Verification**:
   - Check IndexedDB → `emi_transactions`
   - Verify 2 transactions for Month 1:
     - One with `transaction_type: "emi"`
     - One with `transaction_type: "part_payment"`
   - Check UI shows both values

3. **Expected Result**: ✅ Both transaction types stored correctly

---

### Scenario 7: Part Payment Persistence
**Goal**: Verify Part Payments persist across page reloads

1. **Test Steps**:
   - Add several Part Payments
   - Note the amounts
   - Refresh the page (F5)

2. **Verification**:
   - Check Amortization Table
   - Verify all Part Payments are still visible
   - Verify amounts match what you entered

3. **Expected Result**: ✅ Part Payments persist after reload

---

### Scenario 8: Storage Backend Toggle
**Goal**: Verify Storage Toggle component shows correct status

1. **Test Steps**:
   - When signed out:
     - Check Storage Toggle card
     - Should show "Local Storage (IndexedDB)"
     - Badge should show "Offline"
   - Sign in:
     - Check Storage Toggle card
     - Should show "Cloud Storage (Supabase)"
     - Badge should show "Online"

2. **Verification**:
   - Click refresh button on Storage Toggle
   - Verify status updates correctly
   - Check icon changes (HardDrive → Cloud)

3. **Expected Result**: ✅ Storage Toggle accurately reflects backend

---

## Browser DevTools Inspection

### View IndexedDB Data
```
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "IndexedDB" → "emi_hacks_db"
4. Click "emi_transactions"
5. View all transactions
```

### Filter Part Payments
In the IndexedDB viewer, you can't filter directly, but you can:
1. Look for `transaction_type: "part_payment"`
2. Check `principal_component` equals `amount_paid`
3. Check `interest_component` is 0

### Console Testing
```javascript
// Open browser console and run:

// 1. Get all transactions
const db = await indexedDB.open('emi_hacks_db', 1);
// Then use IndexedDB API to query

// 2. Or use the test function
await testPartPaymentCRUD()
```

---

## Common Issues & Solutions

### Issue: "Please save loan details first"
**Solution**: Click "Save Details" in Loan Details card before adding transactions

### Issue: Part Payment not showing after page reload
**Solution**: 
1. Check if loan ID changed (local IDs start with "local-")
2. Verify IndexedDB has the transaction
3. Check browser console for errors

### Issue: Loader appears on all rows
**Solution**: This was fixed! Only rows without transactions should show loaders now.

### Issue: Can't delete Part Payment
**Solution**: 
1. Ensure transaction exists in storage
2. Check browser console for errors
3. Verify loan ID matches

---

## Success Criteria

All tests pass if:
- ✅ Part Payments save to IndexedDB when offline
- ✅ Part Payments save to Supabase when online
- ✅ Updates work correctly
- ✅ Deletes work correctly
- ✅ Batch operations only affect target rows
- ✅ Data persists across page reloads
- ✅ Sync works when signing in
- ✅ Storage Toggle shows correct status
- ✅ No loaders on rows with existing transactions

---

## Automated Test

For comprehensive testing, run:
```typescript
// In browser console
await testPartPaymentCRUD()
```

This will automatically test all CRUD operations and report results.
