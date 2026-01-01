/**
 * Loan calculation utilities for EMI and amortization
 */

export interface LoanDetails {
    principal: number;
    interest: number; // Annual interest rate in percentage
    tenure: number; // Tenure in months
}

export interface MonthlyPayment {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}

export interface LoanSummary {
    emi: number;
    totalInterest: number;
    totalCost: number;
    payoffDate: Date;
}

/**
 * Calculate EMI using the formula:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N-1]
 * where P = Principal, R = Monthly interest rate, N = Number of months
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
    if (principal <= 0 || annualRate <= 0 || months <= 0) {
        return 0;
    }

    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

    return Math.round(emi * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate complete amortization schedule
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    months: number,
    startDate: Date = new Date()
): MonthlyPayment[] {
    const schedule: MonthlyPayment[] = [];
    const emi = calculateEMI(principal, annualRate, months);
    const monthlyRate = annualRate / 12 / 100;

    let balance = principal;

    for (let month = 1; month <= months; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        balance = Math.max(0, balance - principalPayment);

        schedule.push({
            month,
            emi: Math.round(emi * 100) / 100,
            principal: Math.round(principalPayment * 100) / 100,
            interest: Math.round(interestPayment * 100) / 100,
            balance: Math.round(balance * 100) / 100,
        });
    }

    return schedule;
}

/**
 * Calculate loan summary including total interest and total cost
 */
export function calculateLoanSummary(
    principal: number,
    annualRate: number,
    months: number,
    startDate: Date = new Date()
): LoanSummary {
    const emi = calculateEMI(principal, annualRate, months);
    const totalCost = emi * months;
    const totalInterest = totalCost - principal;

    // Calculate payoff date
    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
        emi: Math.round(emi * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        payoffDate,
    };
}

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date in a readable format
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

/**
 * Format month name with year abbreviation (e.g., Jan'26, Feb'26)
 */
export function formatMonthYear(startDate: Date, monthNumber: number): string {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthNumber - 1);

    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);

    return `${monthName}'${year}`;
}

