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
        <Card className="w-full">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            Loan Settings
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Adjust your loan parameters
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
                <div className="grid gap-6">
                    {/* Principal Amount */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="principal" className="text-sm font-medium">
                                Principal Amount
                            </Label>
                            <div className="relative w-40">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <IndianRupee className="w-4 h-4" />
                                </div>
                                <Input
                                    id="principal"
                                    type="number"
                                    value={principal}
                                    onChange={handlePrincipalChange}
                                    className="pl-9 text-right font-medium"
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
                            className="py-2 [&_[data-slot=slider-range]]:bg-principal [&_[data-slot=slider-thumb]]:border-principal"
                            showTooltip
                            formatTooltip={formatCompactCurrency}
                        />
                        <p className="text-xs font-medium text-principal text-right">
                            {formatCurrency(principal)}
                        </p>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="interest" className="text-sm font-medium">
                                Interest Rate
                            </Label>
                            <div className="relative w-40">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Percent className="w-4 h-4" />
                                </div>
                                <Input
                                    id="interest"
                                    type="number"
                                    value={interest}
                                    onChange={handleInterestChange}
                                    className="pl-9 text-right font-medium"
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
                            className="py-2 [&_[data-slot=slider-range]]:bg-interest [&_[data-slot=slider-thumb]]:border-interest"
                            showTooltip
                            formatTooltip={(v) => `${v}%`}
                        />
                        <p className="text-xs font-medium text-interest text-right">{interest}% p.a.</p>
                    </div>

                    {/* Loan Tenure */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tenure" className="text-sm font-medium">
                                Tenure (Years)
                            </Label>
                            <div className="relative w-40">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <Input
                                    id="tenure"
                                    type="number"
                                    value={tenureYears}
                                    onChange={handleTenureYearChange}
                                    className="pl-9 text-right font-medium"
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
                        <p className="text-xs font-medium text-muted-foreground text-right">
                            {tenureYears}y ({tenure}m)
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


