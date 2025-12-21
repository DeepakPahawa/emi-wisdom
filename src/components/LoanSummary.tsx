"use client"

import { useEmiStore } from '@/store/emi-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Wallet, PiggyBank, Target } from 'lucide-react';

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
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const originalTenureMonths = loanDetails.durationMonths;
    const savedMonths = summary.numberOfPaidEmis > 0
        ? originalTenureMonths - (summary.numberOfPaidEmis + summary.remainingMonths)
        : 0;

    return (
        <div className="space-y-4">
            <Card className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-light text-primary uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Loan Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Number of Paid EMIs */}
                    <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>Paid EMIs</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {summary.numberOfPaidEmis}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                / {originalTenureMonths}
                            </span>
                        </div>
                    </div>

                    {/* Total Paid to Interest */}
                    <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span>Paid to Interest</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {formatCurrency(summary.totalPaidToInterest)}
                        </div>
                    </div>

                    {/* Total Paid to Principal */}
                    <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>Paid to Principal</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {formatCurrency(summary.totalPaidToPrincipal)}
                        </div>
                    </div>

                    {/* Remaining Tenure */}
                    <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>Remaining Tenure</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {summary.remainingYears}y {summary.remainingMonths % 12}m
                        </div>
                        {savedMonths > 0 && (
                            <div className="text-xs text-green-500 mt-1">
                                Saved {Math.floor(savedMonths / 12)}y {savedMonths % 12}m
                            </div>
                        )}
                    </div>

                    {/* Savings from Part Payments */}
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-1">
                            <PiggyBank className="w-4 h-4" />
                            <span>Part Payment Total</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(summary.totalSavingsFromHacks)}
                        </div>
                    </div>

                    {/* Projected Completion */}
                    <div className="p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Wallet className="w-4 h-4" />
                            <span>Completion Date</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {formatDate(summary.projectedCompletionDate)}
                        </div>
                    </div>

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
