
export interface LoanDetails {
    principal: number;
    rate: number; // Annual interest rate in percentage
    durationMonths: number;
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
    principalComponent: number;
    interestComponent: number;
    totalPayment: number;
    outstandingBalance: number;
}

export interface CalculationResult {
    emi: number;
    totalInterest: number;
    totalAmount: number;
    schedule: AmortizationPoint[];
    crossingPointMonth: number | null; // Month where Principal component > Interest component
}
