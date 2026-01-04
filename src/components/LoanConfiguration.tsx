"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
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
        isLoading,
        setPrincipal,
        setInterest,
        setTenure,
    } = useLoanConfigStore();

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced save function
    const debouncedSave = useCallback(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(async () => {
            try {
                console.log("💾 Saving loan config to IndexedDB:", { principal, interest, tenure });
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
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 py-0">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Loan Configuration
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Set your loan parameters
                        </p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Loading...</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Principal Amount */}
                <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-all duration-300 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="principal" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Principal Amount
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-md shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                <IndianRupee className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="principal"
                                type="number"
                                value={principal}
                                onChange={handlePrincipalChange}
                                className="pl-10 text-right font-bold bg-white/50 dark:bg-gray-800/50 border-blue-200 dark:border-blue-800 focus:ring-blue-500"
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
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 text-right">
                        {formatCurrency(principal)}
                    </p>
                </div>

                {/* Interest Rate */}
                <div className="group p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all duration-300 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="interest" className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                            Interest Rate
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-md shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Percent className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="interest"
                                type="number"
                                value={interest}
                                onChange={handleInterestChange}
                                className="pl-10 text-right font-bold bg-white/50 dark:bg-gray-800/50 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500"
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
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 text-right">{interest}% per annum</p>
                </div>

                {/* Loan Tenure */}
                <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/50 hover:shadow-md transition-all duration-300 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="tenure" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                            Loan Tenure (Years)
                        </Label>
                        <div className="relative w-48">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-md shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-3 h-3 text-white" />
                            </div>
                            <Input
                                id="tenure"
                                type="number"
                                value={tenureYears}
                                onChange={handleTenureYearChange}
                                className="pl-10 text-right font-bold bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800 focus:ring-purple-500"
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
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 text-right">
                        {tenureYears} years ({tenure} months)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}


