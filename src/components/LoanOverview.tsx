"use client";

import { useMemo, useState, useEffect } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { calculateLoanSummary, formatCurrency, formatDate } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Calendar, Percent } from "lucide-react";

export function LoanOverview() {
    const { principal, interest, tenure, isInitialized } = useLoanConfigStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const summary = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return null;
        }
        return calculateLoanSummary(principal, interest, tenure);
    }, [principal, interest, tenure, isInitialized]);

    if (!summary) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Loan Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Configure your loan parameters to see the overview
                    </p>
                </CardContent>
            </Card>
        );
    }

    const interestPercentage = (summary.totalInterest / summary.totalCost) * 100;
    const principalPercentage = (principal / summary.totalCost) * 100;

    return (
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b [.border-b]:pb-2 py-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Loan Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Loan Amount */}
                    <div className="group p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-blue-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <IndianRupee className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                Loan Amount
                            </h3>
                        </div>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300 ml-8">
                            {formatCurrency(principal)}
                        </p>
                    </div>

                    {/* Total Interest Paid */}
                    <div className="group p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Percent className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-xs font-medium text-orange-900 dark:text-orange-100">
                                Total Interest Paid
                            </h3>
                        </div>
                        <p className="text-xl font-bold text-orange-700 dark:text-orange-300 ml-8">
                            {formatCurrency(summary.totalInterest)}
                        </p>
                    </div>

                    {/* Total Cost of Loan */}
                    <div className="group p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-purple-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                Total Cost of Loan
                            </h3>
                        </div>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300 ml-8">
                            {formatCurrency(summary.totalCost)}
                        </p>
                    </div>

                    {/* Payoff Date */}
                    <div className="group p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-green-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-xs font-medium text-green-900 dark:text-green-100">
                                Payoff Date
                            </h3>
                        </div>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300 ml-8">
                            {isMounted ? formatDate(summary.payoffDate) : "Loading..."}
                        </p>
                    </div>
                </div>

                {/* Interactive Progress Bar */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold text-foreground">Cost Breakdown</h4>
                        <p className="text-[10px] text-muted-foreground">Hover to see details</p>
                    </div>
                    <div className="relative h-10 rounded-lg overflow-hidden shadow-inner bg-muted/30 flex">
                        {/* Principal Segment */}
                        <div
                            className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer flex items-center justify-center"
                            style={{ width: `${principalPercentage}%` }}
                        >
                            <span className="text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Principal: {principalPercentage.toFixed(1)}%
                            </span>
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10">
                                <div className="font-semibold">Principal Amount</div>
                                <div>{formatCurrency(principal)}</div>
                                <div className="text-gray-300">{principalPercentage.toFixed(1)}% of total</div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                            </div>
                        </div>

                        {/* Interest Segment */}
                        <div
                            className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 cursor-pointer flex items-center justify-center"
                            style={{ width: `${interestPercentage}%` }}
                        >
                            <span className="text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Interest: {interestPercentage.toFixed(1)}%
                            </span>
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10">
                                <div className="font-semibold">Interest Amount</div>
                                <div>{formatCurrency(summary.totalInterest)}</div>
                                <div className="text-gray-300">{interestPercentage.toFixed(1)}% of total</div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 justify-center text-[10px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
                            <span className="text-muted-foreground">Principal ({principalPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-500 to-orange-600"></div>
                            <span className="text-muted-foreground">Interest ({interestPercentage.toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
