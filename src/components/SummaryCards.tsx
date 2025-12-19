
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculationResult } from "@/types"
import { ArrowUpIcon, ArrowDownIcon, IndianRupeeIcon, PercentIcon } from "lucide-react"

interface SummaryCardsProps {
    result: CalculationResult
}

export function SummaryCards({ result }: SummaryCardsProps) {
    const { emi, totalInterest, totalAmount } = result;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-200">Monthly EMI</CardTitle>
                    <IndianRupeeIcon className="h-4 w-4 text-blue-200" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹ {Math.round(emi).toLocaleString()}</div>
                    <p className="text-xs text-blue-200/70 mt-1">Fixed monthly payment</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-200">Total Interest</CardTitle>
                    <PercentIcon className="h-4 w-4 text-red-200" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹ {Math.round(totalInterest).toLocaleString()}</div>
                    <p className="text-xs text-red-200/70 mt-1">
                        {((totalInterest / totalAmount) * 100).toFixed(1)}% of total amount
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-md border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-200">Total Amount</CardTitle>
                    <ArrowUpIcon className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹ {Math.round(totalAmount).toLocaleString()}</div>
                    <p className="text-xs text-emerald-200/70 mt-1">Principal + Interest</p>
                </CardContent>
            </Card>

        </div>
    )
}
