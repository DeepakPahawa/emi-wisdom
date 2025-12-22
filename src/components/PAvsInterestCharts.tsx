"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmiStore } from '@/store/emi-store';
import { useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ReferenceLine,
} from 'recharts';

interface ChartDataPoint {
    month: number;
    principalComponent: number;
    interestComponent: number;
    cumulativePrincipal: number;
    cumulativeInterest: number;
    displayMonth: string;
}

export function PAvsInterestCharts() {
    const { schedule, loanDetails, calculationResult } = useEmiStore();

    // Prepare data for Original Plan Chart
    const originalPlanData = useMemo(() => {
        const data: ChartDataPoint[] = [];
        let cumulativePrincipal = 0;
        let cumulativeInterest = 0;

        // Calculate based on original EMI schedule (without part payments)
        const monthlyRate = loanDetails.rate / 12 / 100;
        const emi = calculationResult.emi;
        let balance = loanDetails.principal;

        for (let month = 1; month <= loanDetails.durationMonths; month++) {
            const interestForMonth = balance * monthlyRate;
            const principalForMonth = emi - interestForMonth;

            cumulativePrincipal += principalForMonth;
            cumulativeInterest += interestForMonth;

            balance -= principalForMonth;

            data.push({
                month,
                principalComponent: Math.round(principalForMonth),
                interestComponent: Math.round(interestForMonth),
                cumulativePrincipal: Math.round(cumulativePrincipal),
                cumulativeInterest: Math.round(cumulativeInterest),
                displayMonth: `M${month}`,
            });
        }

        return data;
    }, [loanDetails, calculationResult.emi]);

    // Find crossover point for original plan
    const originalCrossoverMonth = useMemo(() => {
        return originalPlanData.findIndex(point => point.principalComponent > point.interestComponent);
    }, [originalPlanData]);

    // Prepare data for Actual Plan Chart
    const actualPlanData = useMemo(() => {
        const data: ChartDataPoint[] = [];
        let cumulativePrincipal = 0;
        let cumulativeInterest = 0;

        schedule.forEach((point) => {
            cumulativePrincipal += point.principalComponent;
            cumulativeInterest += point.interestComponent;

            data.push({
                month: point.month,
                principalComponent: Math.round(point.principalComponent),
                interestComponent: Math.round(point.interestComponent),
                cumulativePrincipal: Math.round(cumulativePrincipal),
                cumulativeInterest: Math.round(cumulativeInterest),
                displayMonth: `M${point.month}`,
            });
        });

        return data;
    }, [schedule]);

    // Find crossover point for actual plan
    const actualCrossoverMonth = useMemo(() => {
        return actualPlanData.findIndex(point => point.principalComponent > point.interestComponent);
    }, [actualPlanData]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
        } else if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
        } else if (value >= 1000) {
            return `₹${(value / 1000).toFixed(0)}k`;
        }
        return `₹${value}`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const monthNumber = data.month;
            const monthlyPA = data.principalComponent;
            const monthlyInterest = data.interestComponent;
            const totalPA = data.cumulativePrincipal;
            const totalInterest = data.cumulativeInterest;

            return (
                <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-xl">
                    <p className="font-semibold text-primary mb-3">Month {monthNumber}</p>

                    {/* Monthly Contribution */}
                    <div className="space-y-1 mb-3 pb-3 border-b border-border">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">This Month</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            <span className="font-medium">PA:</span>{' '}
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                            }).format(monthlyPA)}
                        </p>
                        <p className="text-sm text-rose-600 dark:text-rose-400">
                            <span className="font-medium">Interest:</span>{' '}
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                            }).format(monthlyInterest)}
                        </p>
                    </div>

                    {/* Cumulative Totals */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Total Paid So Far</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            <span className="font-medium">Total PA:</span>{' '}
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                            }).format(totalPA)}
                        </p>
                        <p className="text-sm text-rose-600 dark:text-rose-400">
                            <span className="font-medium">Total Interest:</span>{' '}
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                            }).format(totalInterest)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full space-y-6">
            {/* Actual Plan Chart - Row 2 */}
            <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">
                        Actual Plan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {schedule.length} months
                        {schedule.length < loanDetails.durationMonths && (
                            <span className="text-green-600 dark:text-green-400 font-semibold ml-1">
                                • Saved {loanDetails.durationMonths - schedule.length} months!
                            </span>
                        )}
                        {actualCrossoverMonth !== -1 && (
                            <span className="block text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                ⚡ Crossover at Month {actualCrossoverMonth + 1}
                            </span>
                        )}
                    </p>
                </CardHeader>
                <CardContent className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={actualPlanData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="actualPrincipal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="actualInterest" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                stroke="var(--chart-axis)"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => {
                                    const lastMonth = schedule.length;
                                    // Show every 60th month (5 years), plus the first and last month
                                    if (value === 1 || value === lastMonth || value % 60 === 0) {
                                        return `M${value}`;
                                    }
                                    return '';
                                }}
                            />
                            <YAxis
                                stroke="var(--chart-axis)"
                                tickFormatter={formatCurrency}
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '14px' }}
                                iconType="circle"
                            />

                            {/* Crossover Reference Line */}
                            {actualCrossoverMonth !== -1 && (
                                <ReferenceLine
                                    x={actualCrossoverMonth + 1}
                                    stroke="#fbbf24"
                                    strokeDasharray="3 3"
                                    strokeWidth={2}
                                    label={{
                                        value: 'PA > Interest',
                                        fill: '#fbbf24',
                                        position: 'top',
                                        fontSize: 12,
                                        fontWeight: 'bold'
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="principalComponent"
                                name="Principal (Monthly)"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#actualPrincipal)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="interestComponent"
                                name="Interest (Monthly)"
                                stroke="#f43f5e"
                                fillOpacity={1}
                                fill="url(#actualInterest)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Original Plan Chart - Row 3 */}
            <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">
                        Original Plan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {loanDetails.durationMonths} months • EMI: {formatCurrency(calculationResult.emi)}
                        {originalCrossoverMonth !== -1 && (
                            <span className="block text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                ⚡ Crossover at Month {originalCrossoverMonth + 1}
                            </span>
                        )}
                    </p>
                </CardHeader>
                <CardContent className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={originalPlanData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="originalPrincipal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="originalInterest" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                stroke="var(--chart-axis)"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => {
                                    const lastMonth = loanDetails.durationMonths;
                                    // Show every 60th month (5 years), plus the first and last month
                                    if (value === 1 || value === lastMonth || value % 60 === 0) {
                                        return `M${value}`;
                                    }
                                    return '';
                                }}
                            />
                            <YAxis
                                stroke="var(--chart-axis)"
                                tickFormatter={formatCurrency}
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '14px' }}
                                iconType="circle"
                            />

                            {/* Crossover Reference Line */}
                            {originalCrossoverMonth !== -1 && (
                                <ReferenceLine
                                    x={originalCrossoverMonth + 1}
                                    stroke="#fbbf24"
                                    strokeDasharray="3 3"
                                    strokeWidth={2}
                                    label={{
                                        value: 'PA > Interest',
                                        fill: '#fbbf24',
                                        position: 'top',
                                        fontSize: 12,
                                        fontWeight: 'bold'
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="principalComponent"
                                name="Principal (Monthly)"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#originalPrincipal)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="interestComponent"
                                name="Interest (Monthly)"
                                stroke="#f43f5e"
                                fillOpacity={1}
                                fill="url(#originalInterest)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
