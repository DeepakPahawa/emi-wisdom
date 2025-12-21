
export interface LoanDetails {
    principal: number;
    rate: number; // Annual interest rate in percentage
    durationMonths: number;
    startDate: Date; // EMI start date
}

export interface ExtraPayment {
    month: number; // 1-based index
    amount: number;
    isRecurring?: boolean;
}

export interface RateChange {
    month: number; // 1-based index
    newRate: number;
}

export interface AmortizationPoint {
    month: number;
    year: number;
    date: Date; // Actual EMI payment date
    principalComponent: number;
    interestComponent: number;
    totalPayment: number;
    outstandingBalance: number;
    paidEmi?: number; // User-entered actual EMI paid
    partPayment?: number; // User-entered extra principal payment
}

export interface CalculationResult {
    emi: number;
    totalInterest: number;
    totalAmount: number;
    schedule: AmortizationPoint[];
    crossingPointMonth: number | null; // Month where Principal component > Interest component
}

export interface LoanSummary {
    numberOfPaidEmis: number;
    totalPaidToInterest: number;
    totalPaidToPrincipal: number;
    remainingMonths: number;
    remainingYears: number;
    totalSavingsFromHacks: number;
    projectedCompletionDate: Date | null;
    originalCompletionDate: Date | null; // Completion date based on original tenure
    actualTotalMonths: number; // Actual total months (can be less due to part payments)
}

// EMI Transaction types for database
export interface EmiTransaction {
    id?: string;
    loan_id?: string; // For future multi-loan support
    emi_date: string; // ISO date string
    month_number: number;
    transaction_type: 'emi' | 'part_payment';
    amount_paid: number;
    principal_component: number;
    interest_component: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateEmiTransactionRequest {
    loan_id: string; // Required: ID of the loan this transaction belongs to
    emi_date: string;
    month_number: number;
    transaction_type: 'emi' | 'part_payment';
    amount_paid: number;
    principal_component: number;
    interest_component: number;
}

// Loan Details types for database
export type LoanLabel = 'BusinessLoan' | 'CarLoan' | 'EducationLoan' | 'GoldLoan' | 'HomeLoan' | 'Other' | 'PersonalLoan';

export interface LoanDetailsDB {
    id?: string;
    loan_number: string;
    principal_amount: number;
    original_interest_rate: number;
    current_interest_rate: number;
    emi_start_date: string; // ISO date string
    loan_tenure_months: number;
    bank_name: string;
    loan_label: LoanLabel;
    created_at?: string;
    updated_at?: string;
}

export interface CreateLoanDetailsRequest {
    loan_number: string;
    principal_amount: number;
    original_interest_rate: number;
    current_interest_rate: number;
    emi_start_date: string; // ISO date string (YYYY-MM-DD)
    loan_tenure_months: number;
    bank_name: string;
    loan_label: LoanLabel;
}
