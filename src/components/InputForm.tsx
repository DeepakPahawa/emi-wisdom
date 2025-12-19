
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { LoanDetails } from "@/types"

interface InputFormProps {
    onDetailsChange: (details: LoanDetails) => void
}

export function InputForm({ onDetailsChange }: InputFormProps) {
    const [amount, setAmount] = useState(5000000)
    const [rate, setRate] = useState(9)
    const [years, setYears] = useState(20)

    useEffect(() => {
        onDetailsChange({
            principal: amount,
            rate,
            durationMonths: years * 12
        })
    }, [amount, rate, years, onDetailsChange])

    return (
        <Card className="w-full bg-white/5 backdrop-blur-md border-white/10 text-white shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-light text-blue-200 uppercase tracking-widest">Loan Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Principal Amount */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-gray-400 text-sm">Principal Amount</Label>
                        <div className="text-2xl font-semibold text-white">
                            ₹ {amount.toLocaleString()}
                        </div>
                    </div>
                    <Slider
                        value={[amount]}
                        min={100000}
                        max={20000000}
                        step={50000}
                        onValueChange={(v) => setAmount(v[0])}
                        className="py-1"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>₹ 1L</span>
                        <span>₹ 2Cr</span>
                    </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-gray-400 text-sm">Interest Rate (p.a)</Label>
                        <div className="text-2xl font-semibold text-white">
                            {rate} %
                        </div>
                    </div>
                    <Slider
                        value={[rate]}
                        min={1}
                        max={20}
                        step={0.1}
                        onValueChange={(v) => setRate(v[0])}
                        className="py-1"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>1%</span>
                        <span>20%</span>
                    </div>
                </div>

                {/* Tenure */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-gray-400 text-sm">Loan Tenure</Label>
                        <div className="text-2xl font-semibold text-white">
                            {years} Years
                        </div>
                    </div>
                    <Slider
                        value={[years]}
                        min={1}
                        max={30}
                        step={1}
                        onValueChange={(v) => setYears(v[0])}
                        className="py-1"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>1 Yr</span>
                        <span>30 Yrs</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
