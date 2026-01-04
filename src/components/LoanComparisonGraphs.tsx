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
        let actualCrossMonth = null;
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
        let originalCrossMonth = null;
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
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="font-bold text-foreground">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
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

    const renderChart = (title: string, data: any[], crossover: number | null, colorRange: string) => (
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 py-0">
            <CardHeader className={`bg-gradient-to-r ${colorRange} border-b py-4`}>
                <CardTitle className="text-lg font-bold text-foreground">
                    {title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Principal component vs Interest component over time
                </p>
            </CardHeader>
            <CardContent className="pt-6 pb-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: 'Month', position: 'insideBottom', offset: -5, fontSize: 10 }}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `₹${val / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />

                            {crossover && (
                                <ReferenceLine
                                    x={crossover}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `PA > Interest @ Month ${crossover}`,
                                        position: 'top',
                                        fill: '#ef4444',
                                        fontSize: 10,
                                        fontWeight: 'bold'
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="principal"
                                stroke="#3b82f6"
                                name="Principal Amount"
                                fillOpacity={1}
                                fill="url(#colorPrincipal)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="interest"
                                stroke="#f97316"
                                name="Interest Component"
                                fillOpacity={1}
                                fill="url(#colorInterest)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="w-full space-y-8">
            {renderChart(
                "Actual Loan Trajectory (With Part Payments)",
                actualData,
                crossoverPointActual,
                "from-emerald-500/10 via-teal-500/10 to-cyan-500/10"
            )}
            {renderChart(
                "Original Loan Trajectory",
                originalData,
                crossoverPointOriginal,
                "from-slate-500/10 via-gray-500/10 to-zinc-500/10"
            )}
        </div>
    );
}
