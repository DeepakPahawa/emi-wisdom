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
        <Card className="w-full">
            <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                    Loan Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Loan Amount */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Loan Amount</p>
                        <p className="text-xl font-bold tracking-tight">
                            {formatCurrency(principal)}
                        </p>
                    </div>

                    {/* Total Interest Paid */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Interest</p>
                        <p className="text-xl font-bold tracking-tight text-muted-foreground">
                            {formatCurrency(summary.totalInterest)}
                        </p>
                    </div>

                    {/* Total Cost of Loan */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Cost</p>
                        <p className="text-xl font-bold tracking-tight">
                            {formatCurrency(summary.totalCost)}
                        </p>
                    </div>

                    {/* Payoff Date */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Payoff Date</p>
                        <p className="text-xl font-bold tracking-tight text-primary">
                            {isMounted ? formatDate(summary.payoffDate) : "Loading..."}
                        </p>
                    </div>
                </div>

                {/* Simple Cost Breakdown */}
                <div className="mt-8 space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</h4>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden bg-secondary flex">
                        <div
                            className="bg-primary transition-all duration-500"
                            style={{ width: `${principalPercentage}%` }}
                        />
                        <div
                            className="bg-primary/30 transition-all duration-500"
                            style={{ width: `${interestPercentage}%` }}
                        />
                    </div>
                    <div className="flex gap-4 text-[10px] font-medium">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div>
                            <span>Principal ({principalPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-primary/30"></div>
                            <span>Interest ({interestPercentage.toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
