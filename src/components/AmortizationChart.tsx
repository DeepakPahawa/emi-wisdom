
"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AmortizationPoint } from '@/types';

interface ChartProps {
    data: AmortizationPoint[];
    crossingPoint: number | null;
}

export function AmortizationChart({ data, crossingPoint }: ChartProps) {
    // Downsample for performance if needed, but <360 points is fine for modern browsers.

    return (
        <Card className="w-full bg-white/5 backdrop-blur-md border-white/10 text-white shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-light text-blue-200 uppercase tracking-widest">
                    Principal vs Interest
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="#9ca3af" minTickGap={30} />
                        <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number | string | unknown) => {
                                if (typeof value === 'number') return `₹ ${Math.round(value).toLocaleString()}`;
                                return value as string;
                            }}
                            labelFormatter={(label) => `Year ${label}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />

                        <Area
                            type="monotone"
                            dataKey="principalComponent"
                            name="Principal Part"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorPrincipal)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="interestComponent"
                            name="Interest Part"
                            stroke="#f43f5e"
                            fillOpacity={1}
                            fill="url(#colorInterest)"
                            strokeWidth={2}
                        />

                        {crossingPoint && (
                            <ReferenceLine x={crossingPoint} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Break Even', fill: '#fbbf24', position: 'insideTopRight' }} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
