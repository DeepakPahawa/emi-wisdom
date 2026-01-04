"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCurrency, formatDate } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, DollarSign, PiggyBank, Zap, CheckCircle2, Clock } from "lucide-react";

export function LoanSummary() {
    const { principal, interest, tenure, isInitialized, emiStartDate, transactions } = useLoanConfigStore();

    const summaryData = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return null;
        }

        const actualSchedule = generateAmortizationSchedule(principal, interest, tenure, emiStartDate ? new Date(emiStartDate) : new Date(), transactions);
        const originalSchedule = generateAmortizationSchedule(principal, interest, tenure);

        // Calculate total EMIs paid (where user has recorded a payment)
        const totalEmisPaid = Object.values(transactions).filter(t => t.paidEmi > 0).length;
        const emiPaymentProgress = (totalEmisPaid / tenure) * 100;

        // Calculate total part payments made
        const totalPartPayments = Object.values(transactions).reduce((sum, t) => sum + (t.partPayment || 0), 0);

        // Find the index of the last month where a payment was recorded
        // We use month numbers (1-indexed) in our transactions record
        const paidMonthNumbers = Object.keys(transactions)
            .map(Number)
            .filter(m => transactions[m].paidEmi > 0)
            .sort((a, b) => a - b);

        const lastPaidMonth = paidMonthNumbers.length > 0 ? Math.max(...paidMonthNumbers) : 0;
        const actualMonthsPaid = lastPaidMonth;

        // Calculate metrics based on the actual schedule
        let totalPrincipalPaid = 0;
        let totalInterestPaid = 0;

        for (let i = 0; i < lastPaidMonth; i++) {
            totalPrincipalPaid += actualSchedule[i].principal;
            totalInterestPaid += actualSchedule[i].interest;
        }

        // Remaining balance is the balance after the last recorded payment
        const remainingBalance = lastPaidMonth > 0 ? actualSchedule[lastPaidMonth - 1].balance : principal;

        // Total amount paid so far (EMIs + Part Payments)
        const totalAmountPaid = totalPrincipalPaid + totalInterestPaid;

        // Calculate original total cost and interest (from original schedule)
        const originalTotalInterest = originalSchedule.reduce((sum, p) => sum + p.interest, 0);
        const originalTotalCost = principal + originalTotalInterest;
        const originalEmi = originalSchedule[0]?.emi || 0;

        // Calculate estimated remaining months
        // Count months in actualSchedule that have balance > 0 and are after the last paid month
        const estimatedRemainingMonths = actualSchedule.filter((p, i) => i >= lastPaidMonth && p.balance > 0 || (i >= lastPaidMonth && i < tenure && p.emi > 0)).length;

        // Time saved calculation
        const originalRemainingMonths = tenure - lastPaidMonth;
        const timeSavedMonths = Math.max(0, originalRemainingMonths - estimatedRemainingMonths);

        // Projected interest vs original interest
        const projectedTotalInterest = actualSchedule.reduce((sum, p) => sum + p.interest, 0);
        const interestSaved = originalTotalInterest - projectedTotalInterest;

        // Calculate payoff dates
        const startDate = emiStartDate ? new Date(emiStartDate) : new Date();
        const projectedPayoffDate = new Date(startDate);
        projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + lastPaidMonth + estimatedRemainingMonths - 1);

        const originalPayoffDate = new Date(startDate);
        originalPayoffDate.setMonth(originalPayoffDate.getMonth() + tenure - 1);

        return {
            totalEmisPaid,
            emiPaymentProgress,
            totalPartPayments,
            totalPrincipalPaid,
            totalInterestPaid,
            remainingBalance,
            totalAmountPaid,
            originalTotalCost,
            originalTotalInterest,
            timeSavedMonths,
            interestSaved,
            projectedPayoffDate,
            originalPayoffDate,
            estimatedRemainingMonths,
            actualMonthsPaid,
            originalEmi,
        };
    }, [principal, interest, tenure, isInitialized, emiStartDate, transactions]);

    if (!summaryData) {
        return null;
    }

    const {
        totalEmisPaid,
        emiPaymentProgress,
        totalPartPayments,
        totalPrincipalPaid,
        totalInterestPaid,
        remainingBalance,
        totalAmountPaid,
        originalTotalInterest,
        timeSavedMonths,
        interestSaved,
        projectedPayoffDate,
        originalPayoffDate,
        estimatedRemainingMonths,
        actualMonthsPaid,
        originalEmi,
    } = summaryData;

    const principalPercentage = totalAmountPaid > 0 ? (totalPrincipalPaid / totalAmountPaid) * 100 : 0;
    const interestPercentage = totalAmountPaid > 0 ? (totalInterestPaid / totalAmountPaid) * 100 : 0;

    return (
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 py-0">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-b py-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                    Loan Summary
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Track your progress and savings
                </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* EMI Payment Progress */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h3 className="font-semibold text-sm">EMI Payment Progress</h3>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {totalEmisPaid} / {tenure} EMIs
                        </span>
                    </div>
                    <div className="relative">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700 ease-out relative"
                                style={{ width: `${emiPaymentProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 text-right">
                            {emiPaymentProgress.toFixed(1)}% Complete
                        </p>
                    </div>
                </div>

                {/* Principal vs Interest Breakdown */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-sm">Payment Breakdown</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Principal Paid</span>
                                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                {formatCurrency(totalPrincipalPaid)}
                            </p>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                    style={{ width: `${principalPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {principalPercentage.toFixed(1)}% of total paid
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Interest Paid</span>
                                <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                {formatCurrency(totalInterestPaid)}
                            </p>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                                    style={{ width: `${interestPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {interestPercentage.toFixed(1)}% of total paid
                            </p>
                        </div>
                    </div>
                </div>

                {/* Part Payments Impact */}
                {totalPartPayments > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
                                    Part Payment Benefits
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-300">Total Part Payments</p>
                                        <p className="text-base font-bold text-green-900 dark:text-green-100">
                                            {formatCurrency(totalPartPayments)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-300">Time Saved</p>
                                        <p className="text-base font-bold text-green-900 dark:text-green-100">
                                            {timeSavedMonths} {timeSavedMonths === 1 ? 'month' : 'months'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-300">Interest Saved</p>
                                        <p className="text-base font-bold text-green-900 dark:text-green-100">
                                            {formatCurrency(Math.max(0, interestSaved))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-300">New Payoff Date</p>
                                        <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                                            {formatDate(projectedPayoffDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Metrics Grid */}
                <div className="pt-4 border-t grid grid-cols-2 gap-x-4 gap-y-6 text-center">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Paid</p>
                        <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(totalAmountPaid)}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Remaining</p>
                        <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(remainingBalance)}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Months Left</p>
                        <p className="text-sm font-semibold text-foreground">
                            {estimatedRemainingMonths}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Monthly EMI</p>
                        <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(originalEmi)}
                        </p>
                    </div>
                </div>

                {/* Original vs Projected Comparison */}
                {totalPartPayments > 0 && (
                    <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Original Payoff</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatDate(originalPayoffDate)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ({tenure} months)
                                </p>
                            </div>
                            <div className="space-y-1 bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                                <p className="text-xs text-green-700 dark:text-green-300">Projected Payoff</p>
                                <p className="text-sm font-bold text-green-900 dark:text-green-100">
                                    {formatDate(projectedPayoffDate)}
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                    ({actualMonthsPaid + estimatedRemainingMonths} months)
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
