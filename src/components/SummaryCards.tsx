"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculationResult } from "@/types"
import { ArrowUpIcon, PercentIcon, IndianRupeeIcon } from "lucide-react"

interface SummaryCardsProps {
    result: CalculationResult
}

export function SummaryCards({ result }: SummaryCardsProps) {
    const { emi, totalInterest, totalAmount } = result;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="backdrop-blur shadow-xl border-border" style={{ backgroundColor: 'var(--card-blue)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-blue)' }}>Monthly EMI</CardTitle>
                    <IndianRupeeIcon className="h-4 w-4" style={{ color: 'var(--text-blue)' }} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">₹ {Math.round(emi).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Fixed monthly payment</p>
                </CardContent>
            </Card>

            <Card className="backdrop-blur shadow-xl border-border" style={{ backgroundColor: 'var(--card-red)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-red)' }}>Total Interest</CardTitle>
                    <PercentIcon className="h-4 w-4" style={{ color: 'var(--text-red)' }} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">₹ {Math.round(totalInterest).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {((totalInterest / totalAmount) * 100).toFixed(1)}% of total amount
                    </p>
                </CardContent>
            </Card>

            <Card className="backdrop-blur-md shadow-xl border-border" style={{ backgroundColor: 'var(--card-emerald)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-emerald)' }}>Total Amount</CardTitle>
                    <ArrowUpIcon className="h-4 w-4" style={{ color: 'var(--text-emerald)' }} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">₹ {Math.round(totalAmount).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Principal + Interest</p>
                </CardContent>
            </Card>

        </div>
    )
}
