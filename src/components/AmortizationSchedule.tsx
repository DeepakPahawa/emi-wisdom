"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCurrency } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function AmortizationSchedule() {
    const { principal, interest, tenure, isInitialized } = useLoanConfigStore();

    const schedule = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return [];
        }
        return generateAmortizationSchedule(principal, interest, tenure);
    }, [principal, interest, tenure, isInitialized]);

    if (schedule.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Amortization Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Configure your loan parameters to see the amortization schedule
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 py-0">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-b py-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                    Amortization Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly breakdown of your loan payments over {tenure} months
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow className="hover:bg-transparent border-b-2">
                                <TableHead className="font-bold text-center w-16 text-xs py-2">Month</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">EMI</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Principal</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Interest</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((payment, index) => {
                                const isEvenRow = index % 2 === 0;
                                const isLastPayment = index === schedule.length - 1;
                                const principalPercentage = (payment.principal / payment.emi) * 100;
                                const interestPercentage = (payment.interest / payment.emi) * 100;

                                return (
                                    <TableRow
                                        key={payment.month}
                                        className={`
                                            group transition-all duration-200
                                            ${isEvenRow ? 'bg-muted/30' : 'bg-background'}
                                            hover:bg-blue-50 dark:hover:bg-blue-950/20
                                            ${isLastPayment ? 'border-b-2 border-green-500 dark:border-green-600' : ''}
                                        `}
                                    >
                                        <TableCell className="text-center font-semibold py-2">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs group-hover:scale-110 transition-transform duration-200">
                                                {payment.month}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-foreground text-sm py-2">
                                            {formatCurrency(payment.emi)}
                                        </TableCell>
                                        <TableCell className="text-right py-2">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-blue-700 dark:text-blue-400 text-sm">
                                                    {formatCurrency(payment.principal)}
                                                </div>
                                                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                        style={{ width: `${principalPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {principalPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-2">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-orange-700 dark:text-orange-400 text-sm">
                                                    {formatCurrency(payment.interest)}
                                                </div>
                                                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                                                        style={{ width: `${interestPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {interestPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-2">
                                            <div className={`
                                                font-semibold text-sm
                                                ${payment.balance === 0
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-foreground'
                                                }
                                            `}>
                                                {payment.balance === 0 ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        {formatCurrency(payment.balance)}
                                                        <span className="text-xs">✓</span>
                                                    </span>
                                                ) : (
                                                    formatCurrency(payment.balance)
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Summary Footer */}
                <div className="border-t-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Total Months</p>
                            <p className="text-base font-bold text-foreground">{schedule.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Monthly EMI</p>
                            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(schedule[0]?.emi || 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Total Principal</p>
                            <p className="text-base font-bold text-blue-700 dark:text-blue-300">
                                {formatCurrency(principal)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Total Interest</p>
                            <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(
                                    schedule.reduce((sum, p) => sum + p.interest, 0)
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
