"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEmiStore } from "@/store/emi-store";
import { saveLoanConfig } from "@/lib/indexeddb-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { IndianRupee, Percent, Calendar } from "lucide-react";

const DEBOUNCE_DELAY = 1000; // Reduced to 1 second for better responsiveness

export function LoanConfiguration() {
    const {
        principal,
        interest,
        tenure,
        isInitialized,
        setPrincipal,
        setInterest,
        setTenure,
        loadFromStorage,
    } = useEmiStore();

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load from IndexedDB on mount
    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    // Debounced save function
    const debouncedSave = useCallback(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(async () => {
            try {
                await saveLoanConfig({ principal, interest, tenure });
            } catch (error) {
                console.error("Failed to save loan config:", error);
            }
        }, DEBOUNCE_DELAY);
    }, [principal, interest, tenure]);

    // Trigger debounced save when values change (only after initialization)
    useEffect(() => {
        if (isInitialized) {
            debouncedSave();
        }

        // Cleanup on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [principal, interest, tenure, isInitialized, debouncedSave]);

    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setPrincipal(value);
    };

    const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setInterest(value);
    };

    const handleTenureYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const years = parseInt(e.target.value) || 0;
        setTenure(years * 12);
    };

    const tenureYears = Math.floor(tenure / 12);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(val);

    const formatCompactCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return formatCurrency(val);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Loan Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Principal Amount */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="principal" className="text-sm font-medium whitespace-nowrap">
                            Principal Amount
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-md">
                                <IndianRupee className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="principal"
                                type="number"
                                value={principal}
                                onChange={handlePrincipalChange}
                                className="pl-10 text-right font-semibold"
                                min="0"
                                max={100000000}
                                step="10000"
                            />
                        </div>
                    </div>
                    <Slider
                        value={[principal]}
                        onValueChange={(vals) => setPrincipal(vals[0])}
                        max={100000000}
                        step={50000}
                        className="py-2"
                        showTooltip
                        formatTooltip={formatCompactCurrency}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {formatCurrency(principal)}
                    </p>
                </div>

                {/* Interest Rate */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="interest" className="text-sm font-medium whitespace-nowrap">
                            Interest Rate
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-md">
                                <Percent className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="interest"
                                type="number"
                                value={interest}
                                onChange={handleInterestChange}
                                className="pl-10 text-right font-semibold"
                                min="0"
                                max="30"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <Slider
                        value={[interest]}
                        onValueChange={(vals) => setInterest(vals[0])}
                        max={30}
                        step={0.05}
                        className="py-2"
                        showTooltip
                        formatTooltip={(v) => `${v}%`}
                    />
                    <p className="text-xs text-muted-foreground text-right">{interest}% per annum</p>
                </div>

                {/* Loan Tenure */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="tenure" className="text-sm font-medium whitespace-nowrap">
                            Loan Tenure (Years)
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-md">
                                <Calendar className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="tenure"
                                type="number"
                                value={tenureYears}
                                onChange={handleTenureYearChange}
                                className="pl-10 text-right font-semibold"
                                min="1"
                                max={30}
                                step="1"
                            />
                        </div>
                    </div>
                    <Slider
                        value={[tenureYears]}
                        onValueChange={(vals) => setTenure(vals[0] * 12)}
                        min={1}
                        max={30}
                        step={1}
                        className="py-2"
                        showTooltip
                        formatTooltip={(v) => `${v} Years`}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {tenureYears} years ({tenure} months)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}


