# 💰 Principal/Interest Split Logic

## Overview

The system now handles principal and interest components differently based on which column you edit:

## Logic Summary

| Column | Transaction Type | Principal Component | Interest Component |
|--------|-----------------|--------------------|--------------------|
| **Paid EMI** | `'emi'` | From schedule | From schedule |
| **EMI Hacks** | `'part_payment'` | **100% of amount** | **0** |

## How It Works

### Paid EMI Column (Regular EMI Payment)
```typescript
// Uses the scheduled breakdown from amortization
principal_component: point.principalComponent  // e.g., ₹35,000
interest_component: point.interestComponent    // e.g., ₹15,000
amount_paid: 50,000                            // Total
```

**Example:**
- User enters: ₹50,000 in "Paid EMI"
- Saves as:
  - `amount_paid`: 50,000
  - `principal_component`: 35,000 (from schedule)
  - `interest_component`: 15,000 (from schedule)
  - `transaction_type`: 'emi'

### EMI Hacks Column (Extra Principal Payment)
```typescript
// 100% goes to principal reduction
principal_component: amount                    // e.g., ₹10,000
interest_component: 0                          // Always 0
amount_paid: 10,000                            // Total
```

**Example:**
- User enters: ₹10,000 in "EMI Hacks"
- Saves as:
  - `amount_paid`: 10,000
  - `principal_component`: 10,000 (100% of amount)
  - `interest_component`: 0 (no interest)
  - `transaction_type`: 'part_payment'

## Code Implementation

```typescript
const saveEmiTransaction = async (
    month: number,
    amount: number,
    point: any,
    transactionType: 'emi' | 'part_payment'
) => {
    // For EMI Hacks: entire amount goes to principal, 0 to interest
    // For Paid EMI: use the scheduled principal/interest breakdown
    const principalComponent = transactionType === 'part_payment' 
        ? amount                      // EMI Hacks: 100% principal
        : point.principalComponent;   // Paid EMI: use schedule
    
    const interestComponent = transactionType === 'part_payment' 
        ? 0                           // EMI Hacks: no interest
        : point.interestComponent;    // Paid EMI: use schedule

    const transactionData = {
        emi_date: point.date.toISOString().split('T')[0],
        month_number: month,
        transaction_type: transactionType,
        amount_paid: amount,
        principal_component: principalComponent,
        interest_component: interestComponent,
    };
    
    // Save to database...
};
```

## Real-World Examples

### Example 1: Regular EMI Payment
**Scenario:** Paying your monthly EMI

**Action:**
- Click "Paid EMI" for Month 1
- Enter: ₹50,000

**Database Record:**
```json
{
  "month_number": 1,
  "transaction_type": "emi",
  "amount_paid": 50000,
  "principal_component": 35000,
  "interest_component": 15000
}
```

**Interpretation:** Out of ₹50,000 paid, ₹35,000 reduced your principal and ₹15,000 went to interest.

---

### Example 2: Extra Principal Payment
**Scenario:** Making a lump sum payment to reduce principal

**Action:**
- Click "EMI Hacks" for Month 1
- Enter: ₹100,000

**Database Record:**
```json
{
  "month_number": 1,
  "transaction_type": "part_payment",
  "amount_paid": 100000,
  "principal_component": 100000,
  "interest_component": 0
}
```

**Interpretation:** The entire ₹100,000 goes directly to reducing your principal. No interest is charged on this extra payment.

---

### Example 3: Partial EMI Payment
**Scenario:** Could only pay part of your EMI this month

**Action:**
- Click "Paid EMI" for Month 1
- Enter: ₹25,000 (less than scheduled ₹50,000)

**Database Record:**
```json
{
  "month_number": 1,
  "transaction_type": "emi",
  "amount_paid": 25000,
  "principal_component": 35000,
  "interest_component": 15000
}
```

**Note:** The principal/interest components still reflect the scheduled breakdown, not the actual amount paid. This shows what should have been paid.

---

## Benefits of This Approach

### For Paid EMI Column
✅ **Accurate Tracking**: Records the actual principal/interest split from your loan schedule  
✅ **Historical Record**: Shows how much of each payment went to principal vs interest  
✅ **Loan Analysis**: Helps analyze your loan repayment pattern  

### For EMI Hacks Column
✅ **Direct Principal Reduction**: 100% of extra payment reduces principal  
✅ **No Interest**: Extra payments don't incur interest charges  
✅ **Faster Payoff**: Directly accelerates loan repayment  
✅ **Clear Impact**: Easy to see how much principal you've reduced  

## Use Cases

### Use Case 1: Regular Monthly Payments
**Goal:** Track your regular EMI payments

**Method:**
- Use "Paid EMI" column only
- Enter the amount you actually paid each month
- System records the principal/interest breakdown

---

### Use Case 2: Aggressive Principal Reduction
**Goal:** Pay extra to finish loan faster

**Method:**
- Use "Paid EMI" for regular payments
- Use "EMI Hacks" for extra lump sum payments
- All extra payments go 100% to principal

---

### Use Case 3: Year-End Bonus Payment
**Goal:** Use your bonus to reduce loan principal

**Method:**
- Click "EMI Hacks" for any month
- Enter bonus amount (e.g., ₹200,000)
- Entire amount reduces principal

---

## Database Examples

### Scenario: Month 1 - Regular EMI + Extra Payment

**If you could save both (future enhancement):**

**Record 1 - Regular EMI:**
```json
{
  "month_number": 1,
  "transaction_type": "emi",
  "amount_paid": 50000,
  "principal_component": 35000,
  "interest_component": 15000
}
```

**Record 2 - Extra Payment:**
```json
{
  "month_number": 1,
  "transaction_type": "part_payment",
  "amount_paid": 10000,
  "principal_component": 10000,
  "interest_component": 0
}
```

**Total for Month 1:**
- Total Paid: ₹60,000
- Principal Reduction: ₹45,000 (₹35,000 + ₹10,000)
- Interest Paid: ₹15,000

**Current Limitation:** Only the last entry for a month is saved (one transaction per month).

---

## Testing

### Test 1: Paid EMI
```
1. Click "Paid EMI" for Month 1
2. Enter: 50000
3. Check Supabase:
   ✓ amount_paid = 50000
   ✓ principal_component = 35000 (from schedule)
   ✓ interest_component = 15000 (from schedule)
   ✓ transaction_type = 'emi'
```

### Test 2: EMI Hacks
```
1. Click "EMI Hacks" for Month 2
2. Enter: 10000
3. Check Supabase:
   ✓ amount_paid = 10000
   ✓ principal_component = 10000 (100% of amount)
   ✓ interest_component = 0
   ✓ transaction_type = 'part_payment'
```

### Test 3: Different Amounts
```
1. Click "EMI Hacks" for Month 3
2. Enter: 100000
3. Check Supabase:
   ✓ amount_paid = 100000
   ✓ principal_component = 100000 (entire amount)
   ✓ interest_component = 0
   ✓ transaction_type = 'part_payment'
```

---

## Build Status

✅ **Build Successful**
```
✓ Compiled successfully
✓ TypeScript passed
✓ No errors
```

---

## Summary

| Aspect | Paid EMI | EMI Hacks |
|--------|----------|-----------|
| **Purpose** | Regular monthly payment | Extra principal payment |
| **Transaction Type** | `'emi'` | `'part_payment'` |
| **Principal** | From schedule | 100% of amount |
| **Interest** | From schedule | Always 0 |
| **Use When** | Paying monthly EMI | Making extra payments |

---

**Version**: 1.3  
**Date**: December 21, 2025  
**Status**: ✅ Implemented
