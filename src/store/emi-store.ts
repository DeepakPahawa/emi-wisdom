import { create } from 'zustand';
import { LoanDetails, AmortizationPoint, CalculationResult, LoanSummary } from '@/types';
import { CalculationService } from '@/services/CalculationService';

interface EmiStore {
    // Loan configuration
    loanDetails: LoanDetails;

    // Calculation results
    calculationResult: CalculationResult;

    // Editable table data
    schedule: AmortizationPoint[];

    // Derived summary
    summary: LoanSummary;

    // Actions
    setLoanDetails: (details: LoanDetails) => void;
    updatePaidEmi: (month: number, amount: number) => void;
    updatePartPayment: (month: number, amount: number) => void;
    recalculate: () => void;
}

const calculateSummary = (schedule: AmortizationPoint[], originalTenure: number): LoanSummary => {
    let numberOfPaidEmis = 0;
    let totalPaidToInterest = 0;
    let totalPaidToPrincipal = 0;
    let totalSavingsFromHacks = 0;
    let remainingBalance = 0;

    schedule.forEach((point, index) => {
        if (point.paidEmi !== undefined && point.paidEmi > 0) {
            numberOfPaidEmis++;
            totalPaidToInterest += point.interestComponent;
            totalPaidToPrincipal += point.principalComponent;
        }

        if (point.partPayment !== undefined && point.partPayment > 0) {
            totalSavingsFromHacks += point.partPayment;
        }

        // Get the last outstanding balance
        if (index === schedule.length - 1) {
            remainingBalance = point.outstandingBalance;
        }
    });

    // Calculate remaining months based on outstanding balance
    const lastPaidMonth = schedule.findIndex(p => p.paidEmi === undefined || p.paidEmi === 0);
    const actualRemainingMonths = lastPaidMonth === -1 ? 0 : schedule.length - lastPaidMonth;

    const remainingMonths = actualRemainingMonths > 0 ? actualRemainingMonths : 0;
    const remainingYears = Math.floor(remainingMonths / 12);

    // Calculate projected completion date
    let projectedCompletionDate: Date | null = null;
    if (numberOfPaidEmis > 0 && remainingMonths > 0) {
        projectedCompletionDate = new Date();
        projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + remainingMonths);
    }

    return {
        numberOfPaidEmis,
        totalPaidToInterest,
        totalPaidToPrincipal,
        remainingMonths,
        remainingYears,
        totalSavingsFromHacks,
        projectedCompletionDate,
    };
};

export const useEmiStore = create<EmiStore>((set, get) => ({
    loanDetails: {
        principal: 5000000,
        rate: 9,
        durationMonths: 240,
        startDate: new Date(),
    },

    calculationResult: {
        emi: 0,
        totalInterest: 0,
        totalAmount: 0,
        schedule: [],
        crossingPointMonth: null,
    },

    schedule: [],

    summary: {
        numberOfPaidEmis: 0,
        totalPaidToInterest: 0,
        totalPaidToPrincipal: 0,
        remainingMonths: 0,
        remainingYears: 0,
        totalSavingsFromHacks: 0,
        projectedCompletionDate: null,
    },

    setLoanDetails: (details: LoanDetails) => {
        set({ loanDetails: details });
        get().recalculate();
    },

    updatePaidEmi: (month: number, amount: number) => {
        const { schedule, loanDetails } = get();

        // Create a new array with the updated value
        const updatedSchedule = schedule.map((point) =>
            point.month === month ? { ...point, paidEmi: amount } : { ...point }
        );

        // Recalculate summary
        const summary = calculateSummary(updatedSchedule, loanDetails.durationMonths);

        // Batch the state update
        set({
            schedule: updatedSchedule,
            summary
        });
    },

    updatePartPayment: (month: number, amount: number) => {
        const { schedule, loanDetails } = get();

        // Find the index of the month
        const monthIndex = schedule.findIndex(p => p.month === month);
        if (monthIndex === -1) return;

        // Update the EMI hack for this month
        const updatedSchedule = [...schedule];
        updatedSchedule[monthIndex] = {
            ...updatedSchedule[monthIndex],
            partPayment: amount,
        };

        // Recalculate the schedule from this point forward with the extra payment
        const extraPayments = updatedSchedule
            .filter(p => p.partPayment && p.partPayment > 0)
            .map(p => ({ month: p.month, amount: p.partPayment || 0 }));

        const newResult = CalculationService.calculateAmortizationSchedule(
            loanDetails,
            extraPayments
        );

        // Preserve user inputs (paidEmi and partPayment)
        const finalSchedule = newResult.schedule.map((point, index) => ({
            ...point,
            paidEmi: updatedSchedule[index]?.paidEmi,
            partPayment: updatedSchedule[index]?.partPayment,
        }));

        set({
            calculationResult: newResult,
            schedule: finalSchedule,
        });

        // Recalculate summary
        const summary = calculateSummary(finalSchedule, loanDetails.durationMonths);
        set({ summary });
    },

    recalculate: () => {
        const { loanDetails, schedule: currentSchedule } = get();

        // Extract extra payments from current schedule
        const extraPayments = currentSchedule
            .filter(p => p.partPayment && p.partPayment > 0)
            .map(p => ({ month: p.month, amount: p.partPayment || 0 }));

        const result = CalculationService.calculateAmortizationSchedule(
            loanDetails,
            extraPayments
        );

        // Preserve user inputs if they exist
        const newSchedule = result.schedule.map((point, index) => ({
            ...point,
            paidEmi: currentSchedule[index]?.paidEmi,
            partPayment: currentSchedule[index]?.partPayment,
        }));

        set({
            calculationResult: result,
            schedule: newSchedule,
        });

        // Calculate summary
        const summary = calculateSummary(newSchedule, loanDetails.durationMonths);
        set({ summary });
    },
}));
