# Visual Guide - Two-Card Loan Configuration

## New Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  LOAN CONFIGURATION                               │ │ PRIMARY CARD
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  Principal Amount                                 │ │
│  │  [5000000_________________________________]       │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │ │
│  │  ₹ 1L                                  ₹ 2Cr+     │ │
│  │                                                   │ │
│  │  Interest Rate (%)                                │ │
│  │  [8.5______________________________________]      │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │ │
│  │  1%                                       20%     │ │
│  │                                                   │ │
│  │  EMI Start Date                                   │ │
│  │  [📅 01/01/2024_________________________]        │ │
│  │                                                   │ │
│  │  Loan Tenure                         20 Years     │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       │ │
│  │  1 Yr                                    30 Yrs   │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │              Apply                          │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ↓ (spacing)                                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  LOAN DETAILS (Optional)                          │ │ SECONDARY CARD
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  Loan Type                                        │ │
│  │  [Home Loan ▼]                                    │ │
│  │                                                   │ │
│  │  Bank Name                                        │ │
│  │  [e.g., HDFC Bank, SBI, ICICI__________]         │ │
│  │                                                   │ │
│  │  Loan Number                                      │ │
│  │  [e.g., HL123456789 (auto-generated)___]         │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │         Save to Database                    │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## User Interaction Flow

### Scenario 1: Quick EMI Calculation (No Database)

```
User enters values in PRIMARY CARD
         ↓
Clicks "Apply" button
         ↓
✓ Loan parameters updated
✓ EMI calculations refresh
✓ Toast: "Applied! Loan parameters updated successfully"
         ↓
User sees updated amortization table & charts
```

### Scenario 2: Full Setup with Database Storage

```
User enters values in PRIMARY CARD
         ↓
Clicks "Apply" button
         ↓
✓ Loan parameters updated
✓ EMI calculations refresh
         ↓
User scrolls to SECONDARY CARD
         ↓
Optionally fills: Loan Type, Bank Name, Loan Number
         ↓
Clicks "Save to Database" button
         ↓
✓ Data saved to Supabase
✓ Toast: "Saved! Loan details created successfully"
         ↓
On next visit, data auto-loads
```

### Scenario 3: Update Existing Loan

```
Page loads → Auto-fetches from database
         ↓
Both cards populate with saved data
         ↓
User modifies PRIMARY CARD values
         ↓
Clicks "Apply" → Calculations update
         ↓
User modifies SECONDARY CARD values
         ↓
Clicks "Save to Database"
         ↓
✓ Toast: "Updated! Loan details updated successfully"
```

## Button Behavior Comparison

| Feature | Primary "Apply" | Secondary "Save to Database" |
|---------|----------------|------------------------------|
| **Action** | Update state | Save to Supabase |
| **Speed** | Instant | ~500ms (API call) |
| **Validation** | PA & Rate only | PA & Rate only |
| **Required Fields** | PA, Rate, Date, Tenure | None (auto-fills) |
| **Toast Message** | "Applied!" | "Saved!" or "Updated!" |
| **Loading State** | No | Yes ("Saving...") |
| **Database** | No interaction | Creates/Updates record |
| **Auto-generation** | No | Yes (loan number) |

## Field Requirements

### PRIMARY CARD (Required for Calculations)
✅ **Principal Amount** - Must be > 0  
✅ **Interest Rate** - Must be 0-100%  
✅ **EMI Start Date** - Must be selected  
✅ **Loan Tenure** - Must be 1-30 years  

### SECONDARY CARD (All Optional)
⭕ **Loan Type** - Defaults to "Home Loan"  
⭕ **Bank Name** - Defaults to "Not Specified"  
⭕ **Loan Number** - Auto-generates if empty  

## Visual Styling Differences

### Primary Card
- **Title Color**: Bright primary color
- **Title Size**: `text-xl` (larger)
- **Input Size**: `text-2xl` (very large)
- **Button Color**: Primary theme color
- **Emphasis**: High - this is the main action

### Secondary Card
- **Title Color**: Muted/gray
- **Title Size**: `text-lg` (smaller)
- **Title Suffix**: "(Optional)" in small text
- **Input Size**: `text-lg` (medium)
- **Button Color**: Secondary theme color
- **Button Label**: More descriptive ("Save to Database")
- **Emphasis**: Low - this is optional

## Responsive Behavior

Both cards stack vertically with spacing:
- **Desktop**: Full width, comfortable spacing
- **Tablet**: Full width, reduced spacing
- **Mobile**: Full width, minimal spacing

## Auto-Load Behavior

On page load:
```
1. Fetch latest loan from database
2. If found:
   - Populate PRIMARY CARD fields
   - Populate SECONDARY CARD fields
   - Update calculations automatically
3. If not found:
   - Show default values
   - User can start fresh
```

## Error Handling

### Primary Card Errors
```
❌ Principal amount must be greater than 0
❌ Interest rate must be between 0 and 100
```

### Secondary Card Errors
```
❌ Principal amount must be greater than 0
❌ Interest rate must be between 0 and 100
❌ Failed to save loan details (network error)
```

Note: Secondary card uses primary card values, so validation is the same.

## Benefits of This Design

1. **🎯 Focus**: Essential fields are prominent
2. **⚡ Speed**: Quick calculations without database
3. **🔄 Flexibility**: Can use app offline
4. **📊 Organization**: Related fields grouped
5. **👁️ Clarity**: Visual hierarchy guides user
6. **💾 Optional Persistence**: Save when ready
7. **🚀 Progressive**: Start simple, add details later

## Common Use Cases

### Use Case 1: Quick Comparison
User wants to compare different loan scenarios:
- Adjust values in PRIMARY CARD
- Click "Apply" repeatedly
- See instant results
- No database clutter

### Use Case 2: Track Real Loan
User has an actual loan to track:
- Fill PRIMARY CARD with loan details
- Fill SECONDARY CARD with bank info
- Click "Save to Database"
- Data persists across sessions

### Use Case 3: Multiple Loans
User wants to track multiple loans:
- Create first loan with details
- Save to database
- Modify values for second loan
- Change loan number
- Save again
- Switch between loans by loading different loan numbers
