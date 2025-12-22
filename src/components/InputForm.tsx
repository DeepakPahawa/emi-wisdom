
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Pencil, RotateCcw, IndianRupee, CirclePercent, Calendar } from "lucide-react"
import { useEmiStore } from "@/store/emi-store"
import { useLoanDetailsStore } from "@/store/loan-details-store"
import { useToast } from "@/hooks/use-toast"
import { LoanLabel } from "@/types"
import { LoanSummary } from "@/components/LoanSummary"
import { useAuth } from "@/contexts/AuthContext"
import { LoginDialog } from "@/components/LoginDialog"

// Helper function to format loan label for display
const formatLoanLabel = (label: LoanLabel): string => {
    const labelMap: Record<LoanLabel, string> = {
        'BusinessLoan': 'Business Loan',
        'CarLoan': 'Car Loan',
        'EducationLoan': 'Education Loan',
        'GoldLoan': 'Gold Loan',
        'HomeLoan': 'Home Loan',
        'Other': 'Other',
        'PersonalLoan': 'Personal Loan'
    };
    return labelMap[label];
};

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
    const { user } = useAuth();

    const [amount, setAmount] = useState<number | string>(loanDetails.principal)
    const [rate, setRate] = useState<number | string>(loanDetails.rate)
    const [years, setYears] = useState(loanDetails.durationMonths / 12)
    const [startDate, setStartDate] = useState<Date>(loanDetails.startDate)

    // New fields for loan details
    const [bankName, setBankName] = useState<string>("")
    const [loanLabel, setLoanLabel] = useState<LoanLabel>("HomeLoan")
    const [loanLabelText, setLoanLabelText] = useState<string>("")
    const [isEditMode, setIsEditMode] = useState<boolean>(false)
    const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false)

    // Fetch loan details on mount using the store
    useEffect(() => {
        fetchLoanDetails();
    }, [fetchLoanDetails]);

    // Update form fields when currentLoan changes in the store
    useEffect(() => {
        if (currentLoan) {
            setBankName(currentLoan.bank_name);
            setLoanLabel(currentLoan.loan_label);
            setLoanLabelText(currentLoan.loan_number);
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
            // Fetch the latest loan details from the database
            await fetchLoanDetails();

            // If we have a loan in the database, use those values
            if (currentLoan) {
                setAmount(currentLoan.principal_amount);
                setRate(currentLoan.current_interest_rate);
                setYears(currentLoan.loan_tenure_months / 12);
                setStartDate(new Date(currentLoan.emi_start_date));
                setBankName(currentLoan.bank_name);
                setLoanLabel(currentLoan.loan_label);
                setLoanLabelText(currentLoan.loan_number);

                // Update the EMI calculation store
                setLoanDetails({
                    principal: currentLoan.principal_amount,
                    rate: currentLoan.current_interest_rate,
                    durationMonths: currentLoan.loan_tenure_months,
                    startDate: new Date(currentLoan.emi_start_date),
                });

                toast({
                    title: "✅ Reset Complete",
                    description: "Loan details reloaded from database",
                });
            } else {
                // If no loan exists in database, use default values
                const defaultValues = {
                    principal: 5000000,
                    rate: 9,
                    durationMonths: 240,
                    startDate: new Date(),
                };

                setAmount(defaultValues.principal);
                setRate(defaultValues.rate);
                setYears(defaultValues.durationMonths / 12);
                setStartDate(defaultValues.startDate);

                setLoanDetails(defaultValues);

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


    const handleApplyPrimary = async () => {
        // Check if user is authenticated before saving
        if (!user) {
            setShowLoginDialog(true);
            return;
        }

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
        if (currentLoan || (bankName.trim() || loanLabelText.trim())) {
            const finalLoanNumber = loanLabelText.trim() || currentLoan?.loan_number || `LOAN-${Date.now()}`;

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
            if (!loanLabelText.trim() && !currentLoan?.loan_number) {
                setLoanLabelText(finalLoanNumber);
            }
        }

        toast({
            title: "Applied!",
            description: "Loan parameters updated successfully",
        });
    };

    const handleApplySecondary = async () => {
        // Check if user is authenticated before saving
        if (!user) {
            setShowLoginDialog(true);
            return;
        }

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
        const finalLoanNumber = loanLabelText.trim() || `LOAN-${Date.now()}`;

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
            setIsEditMode(false);
            toast({
                title: currentLoan ? "Updated!" : "Saved!",
                description: currentLoan ? "Loan details updated successfully" : "Loan details created successfully",
            });
            // Update loan number if it was auto-generated
            if (!loanLabelText.trim()) {
                setLoanLabelText(finalLoanNumber);
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

                        {/* Action Buttons - Primary */}
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

                            {/* Save Details Button */}
                            <Button
                                onClick={handleApplyPrimary}
                                disabled={storeLoading}
                                className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200"
                            >
                                Save Details
                            </Button>
                        </div>

                    </CardContent>
                </Card>

                {/* Loan Summary - Between Configuration and Details */}
                <LoanSummary />
            </div>

            {/* Secondary Card - Optional Loan Details */}
            <Card className="w-full bg-card/80 backdrop-blur-md border-border text-card-foreground shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-light text-muted-foreground uppercase tracking-widest">
                            Loan Details <span className="text-xs normal-case">(Optional)</span>
                        </CardTitle>
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                            disabled={storeLoading}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">

                    {isEditMode ? (
                        <>
                            {/* Edit Mode - Show Input Fields */}

                            {/* Loan Type */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Loan Type</Label>
                                <Select value={loanLabel} onValueChange={(value) => setLoanLabel(value as LoanLabel)} disabled={storeLoading}>
                                    <SelectTrigger className="text-lg font-medium text-foreground bg-transparent border-border h-11">
                                        <SelectValue placeholder="Select loan type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BusinessLoan">Business Loan</SelectItem>
                                        <SelectItem value="CarLoan">Car Loan</SelectItem>
                                        <SelectItem value="EducationLoan">Education Loan</SelectItem>
                                        <SelectItem value="GoldLoan">Gold Loan</SelectItem>
                                        <SelectItem value="HomeLoan">Home Loan</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                        <SelectItem value="PersonalLoan">Personal Loan</SelectItem>
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

                            {/* Label */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Label</Label>
                                <Input
                                    type="text"
                                    value={loanLabelText}
                                    onChange={(e) => setLoanLabelText(e.target.value)}
                                    className="text-lg font-medium text-foreground bg-transparent border-border h-11 placeholder:text-muted-foreground/50"
                                    placeholder="e.g., My Home Loan"
                                    disabled={storeLoading}
                                />
                            </div>

                            {/* EMI Start Date */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">EMI Start Date</Label>
                                <DatePicker
                                    date={startDate}
                                    onDateChange={(date) => date && setStartDate(date)}
                                    placeholder="Select EMI start date"
                                />
                            </div>

                            {/* Save Button */}
                            <Button
                                onClick={handleApplySecondary}
                                disabled={storeSaving || storeLoading}
                                className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200"
                            >
                                {storeSaving ? "Saving..." : "Save Info"}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Display Mode - Show as Labels */}

                            {/* Loan Type */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Loan Type</Label>
                                <div className="text-lg font-medium text-foreground">
                                    {formatLoanLabel(loanLabel)}
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Bank Name</Label>
                                <div className="text-lg font-medium text-foreground">
                                    {bankName || 'Not Specified'}
                                </div>
                            </div>

                            {/* Label */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Label</Label>
                                <div className="text-lg font-medium text-foreground">
                                    {loanLabelText || 'Not Specified'}
                                </div>
                            </div>

                            {/* EMI Start Date */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">EMI Start Date</Label>
                                <div className="text-lg font-medium text-foreground">
                                    {startDate ? new Intl.DateTimeFormat('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    }).format(startDate) : 'Not Set'}
                                </div>
                            </div>
                        </>
                    )}

                </CardContent>
            </Card>

            {/* Login Dialog */}
            <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
        </div>
    )
}
