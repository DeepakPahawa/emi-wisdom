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

export interface FullLoanSummary {
    totalEmisPaid: number;
    emiPaymentProgress: number;
    totalPartPayments: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
    remainingBalance: number;
    totalAmountPaid: number;
    originalTotalCost: number;
    originalTotalInterest: number;
    timeSavedMonths: number;
    interestSaved: number;
    projectedTotalInterest: number;
    projectedTotalCost: number;
    projectedPayoffDate: Date;
    originalPayoffDate: Date;
    estimatedRemainingMonths: number;
    actualMonthsPaid: number;
    actualTotalMonths: number;
    originalEmi: number;
}

/**
 * Calculate comprehensive loan metrics considering transactions and part payments
 */
export function calculateComprehensiveSummary(
    principal: number,
    interest: number,
    tenure: number,
    emiStartDate: Date | null,
    transactions: Record<number, { paidEmi: number; partPayment: number }>
): FullLoanSummary | null {
    if (principal <= 0 || interest <= 0 || tenure <= 0) {
        return null;
    }

    const startDate = emiStartDate || new Date();
    const actualSchedule = generateAmortizationSchedule(principal, interest, tenure, startDate, transactions);
    const originalSchedule = generateAmortizationSchedule(principal, interest, tenure);

    const paidMonthNumbers = Object.keys(transactions)
        .map(Number)
        .filter(m => transactions[m].paidEmi > 0)
        .sort((a, b) => a - b);

    const lastPaidMonth = paidMonthNumbers.length > 0 ? Math.max(...paidMonthNumbers) : 0;

    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;

    for (let i = 0; i < lastPaidMonth; i++) {
        totalPrincipalPaid += actualSchedule[i].principal;
        totalInterestPaid += actualSchedule[i].interest;
    }

    const remainingBalance = lastPaidMonth > 0 ? actualSchedule[lastPaidMonth - 1].balance : principal;
    const originalTotalInterest = originalSchedule.reduce((sum, p) => sum + p.interest, 0);
    const originalEmi = originalSchedule[0]?.emi || 0;

    const estimatedRemainingMonths = actualSchedule.filter((p, i) =>
        (i >= lastPaidMonth && p.balance > 0) || (i >= lastPaidMonth && i < tenure && p.emi > 0)
    ).length;

    const originalRemainingMonths = tenure - lastPaidMonth;
    const timeSavedMonths = Math.max(0, originalRemainingMonths - estimatedRemainingMonths);
    const projectedTotalInterest = actualSchedule.reduce((sum, p) => sum + p.interest, 0);

    // Calculate actual total months (last month with any payment activity)
    const lastMonthWithPayment = [...actualSchedule].reverse().find(p => p.principal > 0 || p.interest > 0 || p.emi > 0);
    const actualTotalMonths = lastMonthWithPayment ? lastMonthWithPayment.month : tenure;

    const projectedPayoffDate = new Date(startDate);
    projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + lastPaidMonth + estimatedRemainingMonths - 1);

    const originalPayoffDate = new Date(startDate);
    originalPayoffDate.setMonth(originalPayoffDate.getMonth() + tenure - 1);

    return {
        totalEmisPaid: paidMonthNumbers.length,
        emiPaymentProgress: (paidMonthNumbers.length / tenure) * 100,
        totalPartPayments: Object.values(transactions).reduce((sum, t) => sum + (t.partPayment || 0), 0),
        totalPrincipalPaid,
        totalInterestPaid,
        remainingBalance,
        totalAmountPaid: totalPrincipalPaid + totalInterestPaid,
        originalTotalCost: principal + originalTotalInterest,
        originalTotalInterest,
        timeSavedMonths,
        interestSaved: originalTotalInterest - projectedTotalInterest,
        projectedTotalInterest,
        projectedTotalCost: principal + projectedTotalInterest,
        projectedPayoffDate,
        originalPayoffDate,
        estimatedRemainingMonths,
        actualMonthsPaid: lastPaidMonth,
        actualTotalMonths,
        originalEmi,
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

/**
 * Format currency in a compact Indian format (Lakhs, Crores)
 */
export function formatCompactCurrency(amount: number): string {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);

    let formatted = "";
    if (absAmount >= 10000000) {
        formatted = (absAmount / 10000000).toFixed(2) + "Cr";
    } else if (absAmount >= 100000) {
        formatted = (absAmount / 100000).toFixed(2) + "L";
    } else if (absAmount >= 1000) {
        formatted = (absAmount / 1000).toFixed(1) + "K";
    } else {
        formatted = absAmount.toString();
    }

    return (isNegative ? "-" : "") + "₹" + formatted;
}
