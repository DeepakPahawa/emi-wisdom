"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCurrency, formatDate } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, DollarSign, PiggyBank, Zap, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        <div className="space-y-6">
            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg font-semibold">
                        Loan Summary
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your progress and savings
                    </p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">

                    {/* EMI Payment Progress */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">EMI Payment Progress</h3>
                            <span className="text-sm font-semibold text-primary">
                                {totalEmisPaid} / {tenure}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-700 ease-out"
                                    style={{ width: `${emiPaymentProgress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right font-medium">
                                {emiPaymentProgress.toFixed(1)}% Complete
                            </p>
                        </div>
                    </div>

                    {/* Principal vs Interest Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Payment Breakdown</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Principal Paid</span>
                                <p className="text-lg font-semibold tracking-tight">
                                    {formatCurrency(totalPrincipalPaid)}
                                </p>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-principal transition-all duration-500"
                                        style={{ width: `${principalPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Interest Paid</span>
                                <p className="text-lg font-semibold tracking-tight text-interest">
                                    {formatCurrency(totalInterestPaid)}
                                </p>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-interest transition-all duration-500"
                                        style={{ width: `${interestPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Part Payments Impact */}
                    <AnimatePresence mode="wait">
                        {totalPartPayments > 0 && (
                            <div className="p-4 rounded-lg bg-part-payment/5 border border-part-payment/20 space-y-4">
                                <div className="flex items-center gap-2 text-part-payment">
                                    <Zap className="w-4 h-4" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Benefits</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Total Extra", value: formatCurrency(totalPartPayments) },
                                        { label: "Time Saved", value: `${timeSavedMonths} ${timeSavedMonths === 1 ? 'month' : 'months'}` },
                                        { label: "Interest Saved", value: formatCurrency(Math.max(0, interestSaved)) },
                                        { label: "New End Date", value: formatDate(projectedPayoffDate) },
                                    ].map((item) => (
                                        <div key={item.label} className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                {item.label}
                                            </p>
                                            <p className="text-sm font-bold text-part-payment">
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Key Metrics Grid */}
                    <div className="pt-4 border-t grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Paid</p>
                            <p className="font-semibold">{formatCurrency(totalAmountPaid)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Remaining</p>
                            <p className="font-semibold">{formatCurrency(remainingBalance)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Months Left</p>
                            <p className="font-semibold">{estimatedRemainingMonths} {estimatedRemainingMonths === 1 ? 'month' : 'months'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Monthly EMI</p>
                            <p className="font-semibold">{formatCurrency(originalEmi)}</p>
                        </div>
                    </div>

                    {/* Payoff Comparison */}
                    {totalPartPayments > 0 && (
                        <div className="pt-4 border-t grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Original Payoff</p>
                                <p className="text-sm font-medium">{formatDate(originalPayoffDate)}</p>
                            </div>
                            <div className="space-y-1 text-primary">
                                <p className="text-[10px] uppercase font-bold tracking-tight">Projected Payoff</p>
                                <p className="text-sm font-bold">{formatDate(projectedPayoffDate)}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
