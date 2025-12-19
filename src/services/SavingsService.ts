
import { CalculationService } from './CalculationService';
import { LoanDetails, ExtraPayment, RateChange } from '@/types';

export class SavingsService {
    /**
     * Compares two scenarios and returns the savings.
     * Useful for "What If" analysis: "What if I pay 5000 extra?"
     */
    static calculateSavings(
        details: LoanDetails,
        baselineExtras: ExtraPayment[],
        newExtras: ExtraPayment[],
        rateChanges: RateChange[] = []
    ) {
        const base = CalculationService.calculateAmortizationSchedule(details, baselineExtras, rateChanges);
        const optimized = CalculationService.calculateAmortizationSchedule(details, newExtras, rateChanges);

        return {
            interestSaved: base.totalInterest - optimized.totalInterest,
            timeSavedMonths: base.schedule.length - optimized.schedule.length,
            originalTotalInterest: base.totalInterest,
            newTotalInterest: optimized.totalInterest,
            originalDuration: base.schedule.length,
            newDuration: optimized.schedule.length
        };
    }
}
