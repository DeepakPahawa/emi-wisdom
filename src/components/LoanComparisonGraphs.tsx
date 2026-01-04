"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCurrency } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";

// Theme colors matching globals.css
const PRINCIPAL_COLOR = "#3b82f6";
const INTEREST_COLOR = "#f97316";

export function LoanComparisonGraphs() {
    const { principal, interest, tenure, isInitialized, emiStartDate, transactions } = useLoanConfigStore();

    const { actualData, originalData, crossoverPointActual, crossoverPointOriginal } = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return { actualData: [], originalData: [], crossoverPointActual: null, crossoverPointOriginal: null };
        }

        const start = emiStartDate ? new Date(emiStartDate) : new Date();
        const actualSchedule = generateAmortizationSchedule(principal, interest, tenure, start, transactions);
        const originalSchedule = generateAmortizationSchedule(principal, interest, tenure, start, {});

        // Find crossover for actual
        let actualCrossMonth: number | null = null;
        const actualFormatted = actualSchedule
            .filter(p => p.principal > 0 || p.interest > 0)
            .map((p) => {
                if (actualCrossMonth === null && p.principal > p.interest) {
                    actualCrossMonth = p.month;
                }
                return {
                    month: p.month,
                    principal: Math.round(p.principal),
                    interest: Math.round(p.interest),
                };
            });

        // Find crossover for original
        let originalCrossMonth: number | null = null;
        const originalFormatted = originalSchedule.map((p) => {
            if (originalCrossMonth === null && p.principal > p.interest) {
                originalCrossMonth = p.month;
            }
            return {
                month: p.month,
                principal: Math.round(p.principal),
                interest: Math.round(p.interest),
            };
        });

        return {
            actualData: actualFormatted,
            originalData: originalFormatted,
            crossoverPointActual: actualCrossMonth,
            crossoverPointOriginal: originalCrossMonth,
        };
    }, [principal, interest, tenure, isInitialized, emiStartDate, transactions]);

    if (actualData.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl text-xs space-y-2">
                    <p className="font-bold text-sm">Month {label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRINCIPAL_COLOR }}></div>
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="font-bold text-foreground">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INTEREST_COLOR }}></div>
                        <span className="text-muted-foreground">Interest:</span>
                        <span className="font-bold text-foreground">
                            {formatCurrency(payload[1].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderChart = (title: string, data: any[], crossover: number | null) => (
        <Card className="w-full">
            <CardHeader className="py-1 px-4 border-b">
                <CardTitle className="text-lg font-semibold">
                    {title}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                    Principal vs Interest over time
                </p>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`colorPrincipal-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={PRINCIPAL_COLOR} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={PRINCIPAL_COLOR} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`colorInterest-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={INTEREST_COLOR} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={INTEREST_COLOR} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `₹${val / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />

                            {crossover && (
                                <ReferenceLine
                                    x={crossover}
                                    stroke={PRINCIPAL_COLOR}
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `PA > INT @ ${crossover}`,
                                        position: 'top',
                                        fill: PRINCIPAL_COLOR,
                                        fontSize: 10,
                                        fontWeight: '600'
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="principal"
                                stroke={PRINCIPAL_COLOR}
                                name="Principal"
                                fillOpacity={1}
                                fill={`url(#colorPrincipal-${title.replace(/\s+/g, '-')})`}
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="interest"
                                stroke={INTEREST_COLOR}
                                name="Interest"
                                fillOpacity={1}
                                fill={`url(#colorInterest-${title.replace(/\s+/g, '-')})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 gap-4">
            {renderChart("Part Payment Impact", actualData, crossoverPointActual)}
            {renderChart("Original Schedule", originalData, crossoverPointOriginal)}
        </div>
    );
}
