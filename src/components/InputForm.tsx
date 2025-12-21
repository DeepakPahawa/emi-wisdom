
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useEmiStore } from "@/store/emi-store"
import { useLoanDetailsStore } from "@/store/loan-details-store"
import { useToast } from "@/hooks/use-toast"
import { LoanLabel } from "@/types"

export function InputForm() {
    const { loanDetails, setLoanDetails } = useEmiStore();
    const {
        currentLoan,
        isLoading: storeLoading,
        isSaving: storeSaving,
        fetchLoanDetails,
        saveLoanDetails,
        setCurrentLoan
    } = useLoanDetailsStore();
    const { toast } = useToast();

    const [amount, setAmount] = useState<number | string>(loanDetails.principal)
    const [rate, setRate] = useState<number | string>(loanDetails.rate)
    const [years, setYears] = useState(loanDetails.durationMonths / 12)
    const [startDate, setStartDate] = useState<Date>(loanDetails.startDate)

    // New fields for loan details
    const [bankName, setBankName] = useState<string>("")
    const [loanLabel, setLoanLabel] = useState<LoanLabel>("HomeLoan")
    const [loanNumber, setLoanNumber] = useState<string>("")

    // Fetch loan details on mount using the store
    useEffect(() => {
        fetchLoanDetails();
    }, [fetchLoanDetails]);

    // Update form fields when currentLoan changes in the store
    useEffect(() => {
        if (currentLoan) {
            setBankName(currentLoan.bank_name);
            setLoanLabel(currentLoan.loan_label);
            setLoanNumber(currentLoan.loan_number);
            setAmount(currentLoan.principal_amount);
            setRate(currentLoan.current_interest_rate);
            setYears(currentLoan.loan_tenure_months / 12);
            setStartDate(new Date(currentLoan.emi_start_date));
        }
    }, [currentLoan]);


    useEffect(() => {
        const principal = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
        const interestRate = typeof rate === 'string' ? parseFloat(rate) || 0 : rate;

        setLoanDetails({
            principal,
            rate: interestRate,
            durationMonths: years * 12,
            startDate: startDate
        })
    }, [amount, rate, years, startDate, setLoanDetails])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAmount(val === '' ? '' : Number(val));
    }

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow decimals
        setRate(val === '' ? '' : val);
    }


    const handleApplyPrimary = async () => {
        const principal = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
        const interestRate = typeof rate === 'string' ? parseFloat(rate) || 0 : rate;

        if (principal <= 0) {
            toast({
                title: "Validation Error",
                description: "Principal amount must be greater than 0",
                variant: "destructive"
            });
            return;
        }

        if (interestRate < 0 || interestRate > 100) {
            toast({
                title: "Validation Error",
                description: "Interest rate must be between 0 and 100",
                variant: "destructive"
            });
            return;
        }

        // Update the loan details in the EMI calculation store
        setLoanDetails({
            principal,
            rate: interestRate,
            durationMonths: years * 12,
            startDate: startDate
        });

        // If we have loan metadata (from secondary card), also update the database
        if (currentLoan || (bankName.trim() || loanNumber.trim())) {
            const finalLoanNumber = loanNumber.trim() || currentLoan?.loan_number || `LOAN-${Date.now()}`;

            await saveLoanDetails({
                loan_number: finalLoanNumber,
                principal_amount: principal,
                original_interest_rate: currentLoan?.original_interest_rate || interestRate,
                current_interest_rate: interestRate,
                emi_start_date: startDate.toISOString().split('T')[0],
                loan_tenure_months: years * 12,
                bank_name: bankName.trim() || currentLoan?.bank_name || 'Not Specified',
                loan_label: loanLabel,
            });

            // Update loan number if it was auto-generated
            if (!loanNumber.trim() && !currentLoan?.loan_number) {
                setLoanNumber(finalLoanNumber);
            }
        }

        toast({
            title: "Applied!",
            description: "Loan parameters updated successfully",
        });
    };

    const handleApplySecondary = async () => {
        // Secondary card fields are optional, so no strict validation
        const principal = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
        const interestRate = typeof rate === 'string' ? parseFloat(rate) || 0 : rate;

        if (principal <= 0) {
            toast({
                title: "Validation Error",
                description: "Principal amount must be greater than 0",
                variant: "destructive"
            });
            return;
        }

        if (interestRate < 0 || interestRate > 100) {
            toast({
                title: "Validation Error",
                description: "Interest rate must be between 0 and 100",
                variant: "destructive"
            });
            return;
        }

        // Generate a default loan number if not provided
        const finalLoanNumber = loanNumber.trim() || `LOAN-${Date.now()}`;

        // Use the store action to save loan details
        const success = await saveLoanDetails({
            loan_number: finalLoanNumber,
            principal_amount: principal,
            original_interest_rate: interestRate,
            current_interest_rate: interestRate,
            emi_start_date: startDate.toISOString().split('T')[0],
            loan_tenure_months: years * 12,
            bank_name: bankName.trim() || 'Not Specified',
            loan_label: loanLabel,
        });

        if (success) {
            toast({
                title: currentLoan ? "Updated!" : "Saved!",
                description: currentLoan ? "Loan details updated successfully" : "Loan details created successfully",
            });
            // Update loan number if it was auto-generated
            if (!loanNumber.trim()) {
                setLoanNumber(finalLoanNumber);
            }
        } else {
            toast({
                title: "Error",
                description: "Failed to save loan details. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Primary Card - Essential Loan Parameters */}
            <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">Loan Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">

                    {/* Principal Amount */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-muted-foreground text-sm">Principal Amount</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                className="text-2xl font-semibold text-foreground bg-transparent border-border h-12 placeholder:text-muted-foreground/50"
                                placeholder="Enter Amount"
                            />
                        </div>
                        <Slider
                            value={[typeof amount === 'number' ? amount : 0]}
                            min={100000}
                            max={20000000}
                            step={50000}
                            onValueChange={(v) => setAmount(v[0])}
                            className="py-1"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₹ 1L</span>
                            <span>₹ 2Cr+</span>
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-muted-foreground text-sm">Interest Rate (%)</Label>
                            <Input
                                type="number"
                                value={rate}
                                onChange={handleRateChange}
                                step="0.01"
                                className="text-2xl font-semibold text-foreground bg-transparent border-border h-12 placeholder:text-muted-foreground/50"
                                placeholder="Rate"
                            />
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

                    {/* EMI Start Date */}
                    <div className="space-y-4">
                        <Label className="text-muted-foreground text-sm">EMI Start Date</Label>
                        <DatePicker
                            date={startDate}
                            onDateChange={(date) => date && setStartDate(date)}
                            placeholder="Select EMI start date"
                        />
                    </div>

                    {/* Tenure */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label className="text-muted-foreground text-sm">Loan Tenure</Label>
                            <div className="text-2xl font-semibold text-foreground">
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
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 Yr</span>
                            <span>30 Yrs</span>
                        </div>
                    </div>

                    {/* Apply Button - Primary */}
                    <Button
                        onClick={handleApplyPrimary}
                        disabled={storeLoading}
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200"
                    >
                        Apply
                    </Button>

                </CardContent>
            </Card>

            {/* Secondary Card - Optional Loan Details */}
            <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-light text-muted-foreground uppercase tracking-widest">
                        Loan Details <span className="text-xs normal-case">(Optional)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Loan Type */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Loan Type</Label>
                        <Select value={loanLabel} onValueChange={(value) => setLoanLabel(value as LoanLabel)} disabled={storeLoading}>
                            <SelectTrigger className="text-lg font-medium text-foreground bg-transparent border-border h-11">
                                <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HomeLoan">Home Loan</SelectItem>
                                <SelectItem value="PersonalLoan">Personal Loan</SelectItem>
                                <SelectItem value="CarLoan">Car Loan</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bank Name */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Bank Name</Label>
                        <Input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="text-lg font-medium text-foreground bg-transparent border-border h-11 placeholder:text-muted-foreground/50"
                            placeholder="e.g., HDFC Bank, SBI, ICICI"
                            disabled={storeLoading}
                        />
                    </div>

                    {/* Loan Number */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Loan Number</Label>
                        <Input
                            type="text"
                            value={loanNumber}
                            onChange={(e) => setLoanNumber(e.target.value)}
                            className="text-lg font-medium text-foreground bg-transparent border-border h-11 placeholder:text-muted-foreground/50"
                            placeholder="e.g., HL123456789 (auto-generated if empty)"
                            disabled={storeLoading}
                        />
                    </div>

                    {/* Apply Button - Secondary */}
                    <Button
                        onClick={handleApplySecondary}
                        disabled={storeSaving || storeLoading}
                        className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200"
                    >
                        {storeSaving ? "Saving..." : "Save to Database"}
                    </Button>

                </CardContent>
            </Card>
        </div>
    )
}
