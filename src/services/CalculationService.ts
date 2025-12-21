
import { LoanDetails, ExtraPayment, RateChange, CalculationResult, AmortizationPoint } from '@/types';

export class CalculationService {
    /**
     * Calculates the EMI for a fixed rate loan.
     * EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
     */
    static calculateEMI(principal: number, annualRate: number, months: number): number {
        if (annualRate === 0) return principal / months;

        const monthlyRate = annualRate / 12 / 100;
        const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
        const denominator = Math.pow(1 + monthlyRate, months) - 1;

        return numerator / denominator;
    }

    /**
     * Generates the full amortization schedule considering extra payments and rate changes.
     */
    static calculateAmortizationSchedule(
        details: LoanDetails,
        extraPayments: ExtraPayment[] = [],
        rateChanges: RateChange[] = []
    ): CalculationResult {
        let { principal, rate, durationMonths, startDate } = details;
        let balance = principal;
        const schedule: AmortizationPoint[] = [];

        let currentRate = rate;
        let emi = this.calculateEMI(principal, currentRate, durationMonths);

        let totalInterest = 0;
        let totalPaid = 0;
        let crossingPointMonth: number | null = null;

        // Map for faster lookup
        const extraPaymentMap = new Map<number, number>();
        extraPayments.forEach(p => extraPaymentMap.set(p.month, p.amount)); // Handle recurring later if needed

        const rateChangeMap = new Map<number, number>();
        rateChanges.forEach(r => rateChangeMap.set(r.month, r.newRate));

        let month = 1;
        // We iterate until balance is roughly 0 or we hit a safety limit (e.g. double duration)
        const MAX_MONTHS = 12 * 50;

        while (balance > 0.01 && month <= MAX_MONTHS) {
            // Check for rate change at START of month
            if (rateChangeMap.has(month)) {
                currentRate = rateChangeMap.get(month)!;
                // Recalculate EMI based on remaining balance and remaining term? 
                // Typically, banks keep tenure same and change EMI, or keep EMI same and change tenure.
                // Let's assume EMI updates to keep tenure roughly compatible or standard banking logic: re-calculate EMI for remaining term.
                // Remaining months: durationMonths - (month - 1)
                const remainingMonths = Math.max(1, durationMonths - (month - 1));
                emi = this.calculateEMI(balance, currentRate, remainingMonths);
            }

            const monthlyRate = currentRate / 12 / 100;
            const interestForMonth = balance * monthlyRate;

            let principalForMonth = emi - interestForMonth;

            // Handle Extra Payment
            let extraPay = extraPaymentMap.get(month) || 0;

            // If last payment
            if (balance + interestForMonth < emi + extraPay) {
                principalForMonth = balance;
                // Adjust total payment
            }

            // Check if principal component is effectively negative (shouldn't happen unless rate is huge)
            if (principalForMonth < 0) principalForMonth = 0;

            let totalMonthlyPay = interestForMonth + principalForMonth + extraPay;

            // Actual principal reduction
            const principalReduction = principalForMonth + extraPay;
            balance -= principalReduction;
            if (balance < 0) balance = 0;

            totalInterest += interestForMonth;
            totalPaid += totalMonthlyPay;

            if (crossingPointMonth === null && (principalForMonth + extraPay) > interestForMonth) {
                crossingPointMonth = month;
            }

            // Calculate the date for this EMI payment
            const emiDate = new Date(startDate);
            emiDate.setMonth(emiDate.getMonth() + (month - 1));

            schedule.push({
                month,
                year: Math.ceil(month / 12),
                date: emiDate,
                principalComponent: principalForMonth + extraPay,
                interestComponent: interestForMonth,
                totalPayment: totalMonthlyPay,
                outstandingBalance: balance
            });

            month++;
        }

        return {
            emi,
            totalInterest,
            totalAmount: totalPaid,
            schedule,
            crossingPointMonth
        };
    }
}
