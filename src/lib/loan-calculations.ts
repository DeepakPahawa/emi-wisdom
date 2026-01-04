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
    startDate: Date = new Date(),
    transactions: Record<number, { paidEmi: number; partPayment: number }> = {}
): MonthlyPayment[] {
    const schedule: MonthlyPayment[] = [];
    const originalEmi = calculateEMI(principal, annualRate, months);
    const monthlyRate = annualRate / 12 / 100;

    let balance = principal;

    // We still show all 'months' rows, but the balance might hit zero earlier
    for (let month = 1; month <= months; month++) {
        const transaction = transactions[month] || { paidEmi: 0, partPayment: 0 };

        // If balance is already 0, we just push empty rows or stop based on preference
        // Usually it's better to show the full tenure but with 0 values if paid off early
        if (balance <= 0) {
            schedule.push({
                month,
                emi: 0,
                principal: 0,
                interest: 0,
                balance: 0,
            });
            continue;
        }

        const interestPayment = balance * monthlyRate;

        // Use paid EMI if provided, otherwise use original EMI
        // ONLY use paidEmi if it's explicitly set (greater than 0)
        let actualEmiPaid = transaction.paidEmi > 0 ? transaction.paidEmi : originalEmi;
        const partPayment = transaction.partPayment || 0;

        let principalPaidFromEmi = actualEmiPaid - interestPayment;

        // Ensure interest is always covered first. If EMI < interest, 
        // interest is paid only up to EMI amount, and principal paid is 0.
        if (principalPaidFromEmi < 0) {
            principalPaidFromEmi = 0;
            // Note: In real life, negative principal would increase balance (unpaid interest added to principal)
            // But for simple calculators we usually assume interest is fully paid or we just cap it.
        }

        // Total principal reduction this month
        let totalPrincipalReduction = principalPaidFromEmi + partPayment;

        // Don't pay more than the remaining balance
        if (totalPrincipalReduction > balance) {
            totalPrincipalReduction = balance;
            // Adjust emi display if payoff happened with a smaller amount
            if (partPayment > balance) {
                // Should not happen usually as part payment is extra
            }
        }

        balance = Math.max(0, balance - totalPrincipalReduction);

        schedule.push({
            month,
            emi: Math.round(actualEmiPaid * 100) / 100,
            principal: Math.round(totalPrincipalReduction * 100) / 100,
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
    payoffDate.setMonth(payoffDate.getMonth() + months - 1);

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

