"use client"

import { useEmiStore } from '@/store/emi-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useState } from 'react';

export function LoanOverviewCard() {
    const { loanDetails, calculationResult, summary } = useEmiStore();
    const [hoveredSegment, setHoveredSegment] = useState<'principal' | 'interest' | null>(null);

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

    // Calculate percentages for the progress bar
    const totalCost = loanDetails.principal + calculationResult.totalInterest;
    const principalPercentage = totalCost > 0 ? (loanDetails.principal / totalCost) * 100 : 0;
    const interestPercentage = totalCost > 0 ? (calculationResult.totalInterest / totalCost) * 100 : 0;

    return (
        <Card className="w-full bg-card/80 backdrop-blur-md border-border shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-light text-primary uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Loan Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Loan Amount */}
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                Loan Amount
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground break-words">
                            {formatCurrency(loanDetails.principal)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Principal borrowed
                        </div>
                    </div>

                    {/* Total Interest Paid */}
                    <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                                Total Interest
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground break-words">
                            {formatCurrency(calculationResult.totalInterest)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Interest cost over tenure
                        </div>
                    </div>

                    {/* Total Cost of Loan */}
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                Total Cost
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground break-words">
                            {formatCurrency(totalCost)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Principal + Interest
                        </div>
                    </div>

                    {/* Payoff Date */}
                    <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Payoff Date
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground break-words">
                            {formatDate(summary.projectedCompletionDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Expected completion
                        </div>
                    </div>

                </div>

                {/* Cost Breakdown Progress Bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Cost Breakdown</span>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                                <span className="text-muted-foreground">Principal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                                <span className="text-muted-foreground">Interest</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full bg-muted rounded-full h-8 overflow-visible flex">
                        {/* Principal Segment */}
                        <div
                            className={`h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-l-full transition-all duration-300 cursor-pointer relative group ${hoveredSegment === 'principal' ? 'opacity-100' : hoveredSegment ? 'opacity-50' : 'opacity-100'
                                }`}
                            style={{ width: `${principalPercentage}%` }}
                            onMouseEnter={() => setHoveredSegment('principal')}
                            onMouseLeave={() => setHoveredSegment(null)}
                        >
                            {principalPercentage > 15 && (
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                    {principalPercentage.toFixed(1)}%
                                </span>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-xs">
                                    <div className="font-semibold">Principal Amount</div>
                                    <div className="mt-1">{formatCurrency(loanDetails.principal)}</div>
                                    <div className="text-gray-300 dark:text-gray-600">{principalPercentage.toFixed(1)}% of total cost</div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interest Segment */}
                        <div
                            className={`h-full bg-gradient-to-r from-red-500 to-red-600 rounded-r-full transition-all duration-300 cursor-pointer relative group ${hoveredSegment === 'interest' ? 'opacity-100' : hoveredSegment ? 'opacity-50' : 'opacity-100'
                                }`}
                            style={{ width: `${interestPercentage}%` }}
                            onMouseEnter={() => setHoveredSegment('interest')}
                            onMouseLeave={() => setHoveredSegment(null)}
                        >
                            {interestPercentage > 15 && (
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                    {interestPercentage.toFixed(1)}%
                                </span>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-xs">
                                    <div className="font-semibold">Interest Amount</div>
                                    <div className="mt-1">{formatCurrency(calculationResult.totalInterest)}</div>
                                    <div className="text-gray-300 dark:text-gray-600">{interestPercentage.toFixed(1)}% of total cost</div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Percentage Labels Below */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Principal: {formatCurrency(loanDetails.principal)}</span>
                        <span>Interest: {formatCurrency(calculationResult.totalInterest)}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
