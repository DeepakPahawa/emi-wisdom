
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef, useCallback } from "react"
import { RotateCcw, IndianRupee, CirclePercent, Calendar } from "lucide-react"
import { useEmiStore } from "@/store/emi-store"
import { useLoanDetailsStore } from "@/store/loan-details-store"
import { useToast } from "@/hooks/use-toast"
import { LoanSummary } from "@/components/LoanSummary"

export function LoanConfiguration() {
    const { loanDetails, setLoanDetails } = useEmiStore();
    const {
        currentLoan,
        isLoading: storeLoading,
        fetchLoanDetails,
        saveLoanDetails
    } = useLoanDetailsStore();
    const { toast } = useToast();

    // Local state derives from store
    const [amount, setAmount] = useState<number | string>(loanDetails.principal)
    const [rate, setRate] = useState<number | string>(loanDetails.rate)
    const [years, setYears] = useState(loanDetails.durationMonths / 12)
    const [isInitialized, setIsInitialized] = useState(false);

    // Refs to manage state updates
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoadedRef = useRef(false);
    const isUserInputRef = useRef(false);

    // Load saved loan details from IndexedDB on mount
    useEffect(() => {
        if (hasLoadedRef.current) {
            console.log('[LoanConfiguration] Already loaded, skipping');
            return;
        }

        console.log('[LoanConfiguration] Starting initialization...');
        hasLoadedRef.current = true;

        // Set initialized immediately - don't wait for fetch
        setIsInitialized(true);
        console.log('[LoanConfiguration] Set isInitialized to true');

        // Fetch loan details in background
        fetchLoanDetails().then(() => {
            console.log('[LoanConfiguration] fetchLoanDetails() completed');
        }).catch((error) => {
            console.error('[LoanConfiguration] Error loading saved loan details:', error);
        });
    }, []); // Run only once on mount

    // Update store when currentLoan is fetched from IndexedDB (only if values changed)
    useEffect(() => {
        if (!hasLoadedRef.current || !isInitialized) return;

        if (currentLoan) {
            // Only update if values are different to prevent infinite loop
            const valuesChanged =
                loanDetails.principal !== currentLoan.principal_amount ||
                loanDetails.rate !== currentLoan.current_interest_rate ||
                loanDetails.durationMonths !== currentLoan.loan_tenure_months;

            if (valuesChanged) {
                console.log('[LoanConfiguration] Updating store with saved loan:', {
                    principal: currentLoan.principal_amount,
                    rate: currentLoan.current_interest_rate,
                    tenure: currentLoan.loan_tenure_months
                });

                setLoanDetails({
                    principal: currentLoan.principal_amount,
                    rate: currentLoan.current_interest_rate,
                    durationMonths: currentLoan.loan_tenure_months,
                    startDate: new Date(currentLoan.emi_start_date),
                });
            } else {
                console.log('[LoanConfiguration] Loan values unchanged, skipping store update');
            }
        } else {
            console.log('[LoanConfiguration] No saved loan found, using store defaults');
        }
    }, [currentLoan, isInitialized, loanDetails, setLoanDetails]);

    // Sync local state with store whenever store changes (but not from user input)
    useEffect(() => {
        console.log('[LoanConfiguration] Store changed, syncing local state. isUserInput:', isUserInputRef.current, 'values:', {
            principal: loanDetails.principal,
            rate: loanDetails.rate,
            years: loanDetails.durationMonths / 12
        });

        if (!isUserInputRef.current) {
            setAmount(loanDetails.principal);
            setRate(loanDetails.rate);
            setYears(loanDetails.durationMonths / 12);
        }
        isUserInputRef.current = false; // Reset flag
    }, [loanDetails]);

    // Log when isInitialized changes
    useEffect(() => {
        console.log('[LoanConfiguration] isInitialized changed to:', isInitialized);
    }, [isInitialized]);

    // Debounced auto-save function
    const debouncedSave = useCallback(async (principal: number, interestRate: number, tenure: number) => {
        try {
            const loanData = {
                id: currentLoan?.id,
                principal_amount: principal,
                original_interest_rate: interestRate,
                current_interest_rate: interestRate,
                loan_tenure_months: tenure,
                emi_start_date: currentLoan?.emi_start_date || new Date().toISOString().split('T')[0],
                bank_name: currentLoan?.bank_name || '',
                loan_label: currentLoan?.loan_label || 'Other',
                loan_number: currentLoan?.loan_number || '',
            };

            await saveLoanDetails(loanData);

            console.log('✅ Loan configuration auto-saved to IndexedDB');
        } catch (error) {
            console.error('Error auto-saving loan configuration:', error);
        }
    }, [currentLoan, saveLoanDetails]);

    // Trigger debounced save when local values change
    useEffect(() => {
        if (!isInitialized) return;

        const principal = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
        const interestRate = typeof rate === 'string' ? parseFloat(rate) || 0 : rate;
        const tenure = years * 12;

        console.log('[LoanConfiguration] Values changed, setting debounce timer:', {
            principal,
            interestRate,
            tenure
        });

        // Set flag to indicate this is user input
        isUserInputRef.current = true;

        // Update store immediately for UI consistency
        setLoanDetails({
            principal,
            rate: interestRate,
            durationMonths: tenure,
            startDate: loanDetails.startDate
        });

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for 2 seconds to save to IndexedDB
        debounceTimerRef.current = setTimeout(() => {
            console.log('[LoanConfiguration] Debounce timer fired, saving to IndexedDB...');
            debouncedSave(principal, interestRate, tenure);
        }, 2000);

        // Cleanup on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [amount, rate, years, isInitialized, debouncedSave, setLoanDetails, loanDetails.startDate]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAmount(val === '' ? '' : Number(val));
    }

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow decimals
        setRate(val === '' ? '' : val);
    }

    const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = val === '' ? 1 : Number(val);
        // Ensure years is between 1 and 30
        if (numVal >= 1 && numVal <= 30) {
            setYears(numVal);
        }
    }

    const handleReset = async () => {
        try {
            // Fetch the latest loan details from the database or local storage
            await fetchLoanDetails();

            // If we have a loan in the database/storage, use those values
            if (currentLoan) {
                // Update the store with saved values
                setLoanDetails({
                    principal: currentLoan.principal_amount,
                    rate: currentLoan.current_interest_rate,
                    durationMonths: currentLoan.loan_tenure_months,
                    startDate: new Date(currentLoan.emi_start_date),
                });

                toast({
                    title: "✅ Reset Complete",
                    description: "Loan details reloaded from storage",
                });
            } else {
                // If no loan exists in database, reset to store's default values
                // Store defaults: PA: 5000000, Rate: 7.5%, Tenure: 240 months
                setLoanDetails({
                    principal: 5000000,
                    rate: 7.5,
                    durationMonths: 240,
                    startDate: new Date(),
                });

                toast({
                    title: "ℹ️ Reset to Defaults",
                    description: "No saved loan found. Using default values.",
                });
            }
        } catch (error) {
            console.error('Error resetting loan details:', error);
            toast({
                title: "❌ Error",
                description: "Failed to reset loan details",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6" id="input-form-container">
            {/* Loan Configuration + Loan Summary - Height reference for Amortization Table */}
            <div id="loan-config-summary" className="space-y-6">
                {/* Primary Card - Essential Loan Parameters */}
                <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">Loan Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* Principal Amount */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <Label className="text-muted-foreground text-sm">Principal Amount</Label>
                                <div className="relative w-48">
                                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-primary/10 rounded-l-md flex items-center justify-center border border-r-0 border-border">
                                        <IndianRupee className="h-4 w-4 text-primary" />
                                    </div>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className="pl-12 pr-4 h-10 text-base font-semibold text-primary bg-primary/5 border-border rounded-md"
                                        placeholder="Enter Amount"
                                    />
                                </div>
                            </div>
                            <div className="relative pt-6">
                                <Slider
                                    value={[typeof amount === 'number' ? amount : 0]}
                                    min={100000}
                                    max={100000000}
                                    step={50000}
                                    onValueChange={(v) => setAmount(v[0])}
                                    className="py-1"
                                />
                                {/* Amount in words label */}
                                <div
                                    className="absolute -top-1 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                                    style={{
                                        left: `${((typeof amount === 'number' ? amount : 0) - 100000) / (100000000 - 100000) * 100}%`
                                    }}
                                >
                                    {(() => {
                                        const amt = typeof amount === 'number' ? amount : 0;
                                        if (amt >= 10000000) {
                                            return `₹ ${(amt / 10000000).toFixed(2)} Cr`;
                                        } else if (amt >= 100000) {
                                            return `₹ ${(amt / 100000).toFixed(2)} L`;
                                        } else {
                                            return `₹ ${amt.toLocaleString('en-IN')}`;
                                        }
                                    })()}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>₹ 1L</span>
                                <span>₹ 10Cr</span>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <Label className="text-muted-foreground text-sm">Interest Rate</Label>
                                <div className="relative w-32">
                                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-primary/10 rounded-l-md flex items-center justify-center border border-r-0 border-border">
                                        <CirclePercent className="h-4 w-4 text-primary" />
                                    </div>
                                    <Input
                                        type="number"
                                        value={rate}
                                        onChange={handleRateChange}
                                        step="0.01"
                                        className="pl-12 pr-10 h-10 text-base font-semibold text-primary bg-primary/5 border-border rounded-md"
                                        placeholder="Rate"
                                    />
                                    <div className="absolute right-3 top-0 bottom-0 flex items-center">
                                        <span className="text-sm font-medium text-primary">%</span>
                                    </div>
                                </div>
                            </div>
                            <Slider
                                value={[typeof rate === 'string' ? parseFloat(rate) || 0 : rate]}
                                min={1}
                                max={20}
                                step={0.1}
                                onValueChange={(v) => setRate(v[0])}
                                className="py-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1%</span>
                                <span>20%</span>
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <Label className="text-muted-foreground text-sm">Loan Tenure</Label>
                                <div className="relative w-32">
                                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-primary/10 rounded-l-md flex items-center justify-center border border-r-0 border-border">
                                        <Calendar className="h-4 w-4 text-primary" />
                                    </div>
                                    <Input
                                        type="number"
                                        value={years}
                                        onChange={handleYearsChange}
                                        min={1}
                                        max={30}
                                        step={1}
                                        className="pl-12 pr-10 h-10 text-base font-semibold text-primary bg-primary/5 border-border rounded-md"
                                        placeholder="Years"
                                    />
                                    <div className="absolute right-3 top-0 bottom-0 flex items-center">
                                        <span className="text-sm font-medium text-primary">Yr</span>
                                    </div>
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
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1 Yr</span>
                                <span>30 Yrs</span>
                            </div>
                        </div>

                        {/* Action Button - Reset */}
                        <div className="flex gap-3">
                            {/* Reset Button */}
                            <Button
                                onClick={handleReset}
                                disabled={storeLoading}
                                variant="outline"
                                className="flex-1 h-12 text-base font-semibold transition-all duration-200"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>

                    </CardContent>
                </Card>

                {/* Loan Summary - Between Configuration and Details */}
                <LoanSummary />
            </div>
        </div>
    )
}
