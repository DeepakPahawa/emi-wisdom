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

const calculateSummary = (schedule: AmortizationPoint[], loanDetails: LoanDetails): LoanSummary => {
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

    // Calculate projected completion date from the last EMI in the schedule
    let projectedCompletionDate: Date | null = null;
    if (schedule.length > 0) {
        // Get the date of the last EMI in the schedule
        const lastEmi = schedule[schedule.length - 1];
        projectedCompletionDate = new Date(lastEmi.date);
    }

    // Calculate original completion date (based on original tenure from start date)
    let originalCompletionDate: Date | null = null;
    if (loanDetails.startDate) {
        originalCompletionDate = new Date(loanDetails.startDate);
        originalCompletionDate.setMonth(originalCompletionDate.getMonth() + loanDetails.durationMonths);
    }

    // Actual total months is the length of the schedule (can be less than original due to part payments)
    const actualTotalMonths = schedule.length;

    return {
        numberOfPaidEmis,
        totalPaidToInterest,
        totalPaidToPrincipal,
        remainingMonths,
        remainingYears,
        totalSavingsFromHacks,
        projectedCompletionDate,
        originalCompletionDate,
        actualTotalMonths,
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
        originalCompletionDate: null,
        actualTotalMonths: 0,
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
        const summary = calculateSummary(updatedSchedule, loanDetails);

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
        const summary = calculateSummary(finalSchedule, loanDetails);
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
        const summary = calculateSummary(newSchedule, loanDetails);
        set({ summary });
    },
}));
