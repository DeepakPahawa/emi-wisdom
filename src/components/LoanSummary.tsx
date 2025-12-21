"use client"

import { useEmiStore } from '@/store/emi-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Wallet, PiggyBank, Target, Clock } from 'lucide-react';

export function LoanSummary() {
    const { summary, calculationResult, loanDetails } = useEmiStore();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const originalTenureMonths = loanDetails.durationMonths;
    const savedMonths = summary.numberOfPaidEmis > 0
        ? originalTenureMonths - (summary.numberOfPaidEmis + summary.remainingMonths)
        : 0;

    const progressPercentage = originalTenureMonths > 0
        ? (summary.numberOfPaidEmis / originalTenureMonths) * 100
        : 0;

    return (
        <div className="space-y-6">
            <Card className="w-full bg-card/80 backdrop-blur-md border-border shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-light text-primary uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Loan Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Progress Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">EMI Progress</span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-foreground">
                                    {summary.numberOfPaidEmis}
                                    <span className="text-base font-normal text-muted-foreground"> / {originalTenureMonths}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {progressPercentage.toFixed(1)}% Complete
                                </div>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Payment Breakdown - Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Paid to Principal */}
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Principal</span>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(summary.totalPaidToPrincipal)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Paid towards loan amount
                            </div>
                        </div>

                        {/* Paid to Interest */}
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Interest</span>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(summary.totalPaidToInterest)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Paid as interest cost
                            </div>
                        </div>

                    </div>

                    {/* Remaining & Completion Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Remaining Tenure */}
                        <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.remainingYears}y {summary.remainingMonths % 12}m
                            </div>
                            {savedMonths > 0 && (
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                    ✓ Saved {Math.floor(savedMonths / 12)}y {savedMonths % 12}m
                                </div>
                            )}
                        </div>

                        {/* Projected Completion */}
                        <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completion</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatDate(summary.projectedCompletionDate)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Expected payoff date
                            </div>
                        </div>

                    </div>

                    {/* Part Payment Total - Full Width Highlight */}
                    {summary.totalSavingsFromHacks > 0 && (
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                            Total Part Payments
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(summary.totalSavingsFromHacks)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Extra principal paid</div>
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Smart Insights */}
            {summary.totalSavingsFromHacks > 0 && (
                <Card className="w-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                                    Great Progress! 🎉
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    By paying an extra <span className="font-bold text-foreground">{formatCurrency(summary.totalSavingsFromHacks)}</span> towards principal,
                                    you're reducing your loan tenure and saving on interest payments.
                                    {savedMonths > 0 && (
                                        <span className="block mt-1">
                                            You've saved approximately <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {Math.floor(savedMonths / 12)} years and {savedMonths % 12} months
                                            </span> from your original tenure!
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Suggestion for Part Payments */}
            {summary.numberOfPaidEmis === 0 && (
                <Card className="w-full bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                    Pro Tip: Part Payments 💡
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Try adding just <span className="font-bold text-foreground">₹10,000</span> extra to your principal in the first few months.
                                    This can save you lakhs in interest and reduce your loan tenure significantly!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
