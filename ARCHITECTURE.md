# Service Layer Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ LoanConfiguration│  │ AmortizationTable│  │  Other Components │  │
│  │    Component     │  │    Component     │  │                   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           │                     │                      │              │
└───────────┼─────────────────────┼──────────────────────┼──────────────┘
            │                     │                      │
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT                             │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ loan-details     │  │ emi-transactions │  │   emi-store      │  │
│  │    store         │  │     store        │  │                   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           │                     │                      │              │
└───────────┼─────────────────────┼──────────────────────┼──────────────┘
            │                     │                      │
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES LAYER                               │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ LoanDetails      │  │ EmiTransactions  │  │  LocalStorage    │  │
│  │   Service        │  │    Service       │  │    Service       │  │
│  │                  │  │                  │  │                   │  │
│  │ • fetch()        │  │ • fetch()        │  │ • getLoanDetails │  │
│  │ • save()         │  │ • save()         │  │ • getTransactions│  │
│  │ • delete()       │  │ • batchSave()    │  │ • save()         │  │
│  │                  │  │ • delete()       │  │ • delete()       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           │                     │                      │              │
└───────────┼─────────────────────┼──────────────────────┼──────────────┘
            │                     │                      │
            │ (Authenticated)     │ (Authenticated)      │ (Offline)
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API ROUTES (Next.js)                         │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │ /api/loan-details│  │/api/emi-         │                         │
│  │                  │  │  transactions    │                         │
│  │ • GET            │  │ • GET            │                         │
│  │ • POST           │  │ • POST           │                         │
│  │ • DELETE         │  │ • PATCH          │                         │
│  │                  │  │ • PUT            │                         │
│  │                  │  │ • DELETE         │                         │
│  └────────┬─────────┘  └────────┬─────────┘                         │
│           │                     │                                    │
└───────────┼─────────────────────┼────────────────────────────────────┘
            │                     │
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                            │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │  loan_details    │  │ emi_transactions │                         │
│  │     table        │  │      table       │                         │
│  └──────────────────┘  └──────────────────┘                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### Example: Saving Loan Details

```
1. User clicks "Save Details" button
   ↓
2. LoanConfiguration component calls store method
   ↓
3. loan-details-store calls loanDetailsService.saveLoanDetails()
   ↓
4. LoanDetailsService makes POST request to /api/loan-details
   ↓
5. API route validates data and calls Supabase
   ↓
6. Supabase saves data and returns result
   ↓
7. API route returns response to service
   ↓
8. Service returns data to store
   ↓
9. Store updates state
   ↓
10. Component re-renders with new data
```

## Offline vs Online Flow

### Online (Authenticated User)
```
Component → Store → Service → API Route → Supabase
                                   ↓
                            Response flows back
```

### Offline (Unauthenticated User)
```
Component → Store → LocalStorageService → IndexedDB/LocalStorage
                              ↓
                       Response flows back
```

## Key Benefits

1. **Single Responsibility**: Each layer has a clear purpose
2. **Testability**: Services can be mocked for testing
3. **Maintainability**: Changes to API are isolated to service layer
4. **Type Safety**: TypeScript ensures correct data flow
5. **Error Handling**: Centralized error handling in services
6. **Reusability**: Services can be used by multiple components/stores
