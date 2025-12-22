"use client"

import { useEmiStore } from '@/store/emi-store';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateEmiTransactionRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLoanDetailsStore } from '@/store/loan-details-store';
import { useEmiTransactionsStore } from '@/store/emi-transactions-store';
import { ArrowLeftRight, Edit2, Trash2, Loader2, ArrowDownUp } from 'lucide-react';

export function AmortizationTable() {
    const { schedule, calculationResult, updatePaidEmi, updatePartPayment } = useEmiStore();
    const { currentLoan } = useLoanDetailsStore();
    const { transactions, fetchTransactionsByLoanId } = useEmiTransactionsStore();
    const [editingCell, setEditingCell] = useState<{ month: number; field: 'paidEmi' | 'partPayment' } | null>(null);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [hoveredPartPaymentCell, setHoveredPartPaymentCell] = useState<number | null>(null);
    const [syncingMonths, setSyncingMonths] = useState<Set<number>>(new Set());
    const [syncingPartPaymentMonths, setSyncingPartPaymentMonths] = useState<Set<number>>(new Set());
    const [maxHeight, setMaxHeight] = useState<string>('auto');
    const { toast } = useToast();

    // Calculate max-height based on Loan Configuration + Loan Summary
    useEffect(() => {
        const calculateHeight = () => {
            const loanConfigSummary = document.getElementById('loan-config-summary');
            if (loanConfigSummary) {
                const height = loanConfigSummary.offsetHeight;
                setMaxHeight(`${height}px`);
            }
        };

        // Calculate on mount and when window resizes
        calculateHeight();
        window.addEventListener('resize', calculateHeight);

        // Also recalculate after a short delay to ensure DOM is fully rendered
        const timer = setTimeout(calculateHeight, 100);

        return () => {
            window.removeEventListener('resize', calculateHeight);
            clearTimeout(timer);
        };
    }, []);

    // Fetch transactions when currentLoan changes
    useEffect(() => {
        if (currentLoan?.id) {
            fetchTransactionsByLoanId(currentLoan.id);
        }
    }, [currentLoan?.id, fetchTransactionsByLoanId]);

    // Load transactions into the schedule when they're fetched
    useEffect(() => {
        if (transactions.length > 0) {
            transactions.forEach((transaction) => {
                if (transaction.transaction_type === 'emi') {
                    updatePaidEmi(transaction.month_number, transaction.amount_paid);
                } else if (transaction.transaction_type === 'part_payment') {
                    updatePartPayment(transaction.month_number, transaction.amount_paid);
                }
            });
        }
    }, [transactions, updatePaidEmi, updatePartPayment]);

    const handleCellClick = (month: number, field: 'paidEmi' | 'partPayment') => {
        setEditingCell({ month, field });
    };

    const saveEmiTransaction = async (
        month: number,
        amount: number,
        point: any,
        transactionType: 'emi' | 'part_payment'
    ) => {
        try {
            // Check if we have a loan_id
            if (!currentLoan?.id) {
                toast({
                    title: "⚠️ Warning",
                    description: "Please save loan details first before adding transactions",
                    variant: "destructive",
                });
                return null;
            }

            // For Part Payment (part_payment): entire amount goes to principal, 0 to interest
            // For Paid EMI (emi): use the scheduled principal/interest breakdown
            const principalComponent = transactionType === 'part_payment'
                ? amount  // Part Payment: 100% principal
                : point.principalComponent;  // Paid EMI: use schedule

            const interestComponent = transactionType === 'part_payment'
                ? 0  // Part Payment: no interest
                : point.interestComponent;  // Paid EMI: use schedule

            const transactionData: CreateEmiTransactionRequest = {
                loan_id: currentLoan.id, // Include loan_id from currentLoan
                emi_date: point.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
                month_number: month,
                transaction_type: transactionType,
                amount_paid: amount,
                principal_component: principalComponent,
                interest_component: interestComponent,
            };

            const response = await fetch('/api/emi-transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save transaction');
            }

            const actionText = result.isUpdate ? 'Updated' : 'Saved';
            const typeText = transactionType === 'emi' ? 'EMI Payment' : 'Part Payment';
            toast({
                title: `✅ Transaction ${actionText}`,
                description: `${typeText} of ₹${amount.toLocaleString('en-IN')} ${actionText.toLowerCase()} successfully`,
            });

            // Refresh transactions after saving
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }

            return result.data;
        } catch (error) {
            console.error('Error saving EMI transaction:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to save transaction',
                variant: "destructive",
            });
            throw error;
        }
    };

    const deleteEmiTransaction = async (
        month: number,
        transactionType: 'emi' | 'part_payment'
    ) => {
        try {
            if (!currentLoan?.id) {
                return; // No loan, nothing to delete
            }

            // Find the transaction to delete
            const transactionToDelete = transactions.find(
                t => t.loan_id === currentLoan.id &&
                    t.month_number === month &&
                    t.transaction_type === transactionType
            );

            if (!transactionToDelete?.id) {
                return; // Transaction doesn't exist in database
            }

            const response = await fetch(`/api/emi-transactions?id=${transactionToDelete.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete transaction');
            }

            const typeText = transactionType === 'emi' ? 'EMI Payment' : 'Part Payment';
            toast({
                title: `🗑️ Transaction Deleted`,
                description: `${typeText} for month ${month} removed successfully`,
            });

            // Refresh transactions after deleting
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }

            return result;
        } catch (error) {
            console.error('Error deleting EMI transaction:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to delete transaction',
                variant: "destructive",
            });
            throw error;
        }
    };

    const handleInputChange = (month: number, field: 'paidEmi' | 'partPayment', value: string) => {
        const numValue = parseFloat(value) || 0;

        // Find the schedule point for this month
        const point = schedule.find(p => p.month === month);

        if (field === 'paidEmi') {
            updatePaidEmi(month, numValue);

            if (point && numValue > 0) {
                // Save to database as 'emi' type
                saveEmiTransaction(month, numValue, point, 'emi');
            } else if (numValue === 0) {
                // Delete from database if value is 0
                deleteEmiTransaction(month, 'emi');
            }
        } else {
            updatePartPayment(month, numValue);

            if (point && numValue > 0) {
                // Save to database as 'part_payment' type
                saveEmiTransaction(month, numValue, point, 'part_payment');
            } else if (numValue === 0) {
                // Delete from database if value is 0 (Part Payment removed)
                deleteEmiTransaction(month, 'part_payment');
            }
        }
    };

    const handleInputBlur = () => {
        setEditingCell(null);
    };

    // Generic batch sync handler for both EMI and Part Payment
    const handleBatchSync = async (month: number, transactionType: 'emi' | 'part_payment') => {
        try {
            if (!currentLoan?.id) {
                toast({
                    title: "⚠️ Warning",
                    description: "Please save loan details first before adding transactions",
                    variant: "destructive",
                });
                return;
            }

            // Get all months up to and including the clicked month
            const monthsToSync = schedule.filter(p => p.month <= month);

            if (monthsToSync.length === 0) {
                return;
            }

            // Set loading state for all months being synced
            const monthNumbers = new Set(monthsToSync.map(p => p.month));
            if (transactionType === 'emi') {
                setSyncingMonths(monthNumbers);
            } else {
                setSyncingPartPaymentMonths(monthNumbers);
            }

            // Prepare batch transactions
            const transactions = monthsToSync.map(point => {
                // For both EMI and Part Payment: use scheduled EMI amount
                const amount = calculationResult.emi;

                // For Part Payment: 100% goes to principal, 0 to interest
                // For EMI: use the scheduled breakdown
                const principalComponent = transactionType === 'part_payment'
                    ? amount
                    : point.principalComponent;
                const interestComponent = transactionType === 'part_payment'
                    ? 0
                    : point.interestComponent;

                return {
                    loan_id: currentLoan.id,
                    emi_date: point.date.toISOString().split('T')[0],
                    month_number: point.month,
                    transaction_type: transactionType,
                    amount_paid: amount,
                    principal_component: principalComponent,
                    interest_component: interestComponent,
                };
            });

            // Call batch API endpoint
            const response = await fetch('/api/emi-transactions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactions }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to sync transactions');
            }

            // Update local state for all synced months
            monthsToSync.forEach(point => {
                if (transactionType === 'emi') {
                    updatePaidEmi(point.month, calculationResult.emi);
                } else {
                    updatePartPayment(point.month, calculationResult.emi);
                }
            });

            // Get the month name for the toast
            const clickedPoint = schedule.find(p => p.month === month);
            const monthName = clickedPoint ? new Intl.DateTimeFormat('en-IN', {
                month: 'short',
                year: 'numeric',
            }).format(clickedPoint.date) : `Month ${month}`;

            const typeLabel = transactionType === 'emi' ? 'EMIs' : 'Part Payments';
            toast({
                title: "✅ Synced Successfully",
                description: `All ${typeLabel} marked till ${monthName} (${monthsToSync.length} months)`,
            });

            // Refresh transactions from database
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }
        } catch (error) {
            console.error('Error syncing transactions:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to sync transactions',
                variant: "destructive",
            });
        } finally {
            // Clear loading state
            if (transactionType === 'emi') {
                setSyncingMonths(new Set());
            } else {
                setSyncingPartPaymentMonths(new Set());
            }
        }
    };

    // Generic batch delete handler for both EMI and Part Payment
    const handleBatchDelete = async (month: number, transactionType: 'emi' | 'part_payment') => {
        try {
            if (!currentLoan?.id) {
                return;
            }

            // Get all months from the clicked month onwards
            const monthsToDelete = schedule.filter(p => p.month >= month);

            if (monthsToDelete.length === 0) {
                return;
            }

            // Set loading state for all months being deleted
            const monthNumbers = new Set(monthsToDelete.map(p => p.month));
            if (transactionType === 'emi') {
                setSyncingMonths(monthNumbers);
            } else {
                setSyncingPartPaymentMonths(monthNumbers);
            }

            // Call batch delete API endpoint
            const response = await fetch(
                `/api/emi-transactions?loan_id=${currentLoan.id}&transaction_type=${transactionType}&from_month=${month}`,
                {
                    method: 'DELETE',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete transactions');
            }

            // Update local state for all deleted months
            monthsToDelete.forEach(point => {
                if (transactionType === 'emi') {
                    updatePaidEmi(point.month, 0);
                } else {
                    updatePartPayment(point.month, 0);
                }
            });

            // Get the month name for the toast
            const clickedPoint = schedule.find(p => p.month === month);
            const monthName = clickedPoint ? new Intl.DateTimeFormat('en-IN', {
                month: 'short',
                year: 'numeric',
            }).format(clickedPoint.date) : `Month ${month}`;

            const typeLabel = transactionType === 'emi' ? 'EMIs' : 'Part Payments';
            toast({
                title: "🗑️ Deleted",
                description: `All ${typeLabel} cleared from ${monthName} onwards (${monthsToDelete.length} months)`,
            });

            // Refresh transactions from database
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }
        } catch (error) {
            console.error('Error deleting transactions:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to delete transactions',
                variant: "destructive",
            });
        } finally {
            // Clear loading state
            if (transactionType === 'emi') {
                setSyncingMonths(new Set());
            } else {
                setSyncingPartPaymentMonths(new Set());
            }
        }
    };

    // Wrapper functions for Paid EMI
    const handleCopyScheduledEmi = (month: number) => handleBatchSync(month, 'emi');
    const handleDeletePaidEmi = (month: number) => handleBatchDelete(month, 'emi');

    // Part Payment specific handlers with different logic
    const handleSyncPartPayment = async (month: number) => {
        try {
            if (!currentLoan?.id) {
                toast({
                    title: "⚠️ Warning",
                    description: "Please save loan details first before adding transactions",
                    variant: "destructive",
                });
                return;
            }

            // Find the previous filled Part Payment cell
            const currentMonthIndex = schedule.findIndex(p => p.month === month);
            if (currentMonthIndex === -1) return;

            // Look backwards for the last filled Part Payment
            let previousAmount = 0;
            for (let i = currentMonthIndex - 1; i >= 0; i--) {
                const partPayment = schedule[i]?.partPayment;
                if (partPayment && partPayment > 0) {
                    previousAmount = partPayment;
                    break;
                }
            }

            // If no previous Part Payment found, use 0 or show message
            if (previousAmount === 0) {
                toast({
                    title: "ℹ️ No Previous Part Payment",
                    description: "No previous Part Payment found to copy from",
                    variant: "default",
                });
                return;
            }

            // Set loading state for this month only
            setSyncingPartPaymentMonths(new Set([month]));

            const point = schedule.find(p => p.month === month);
            if (!point) return;

            // Prepare single transaction
            const transactionData = {
                loan_id: currentLoan.id,
                emi_date: point.date.toISOString().split('T')[0],
                month_number: month,
                transaction_type: 'part_payment' as const,
                amount_paid: previousAmount,
                principal_component: previousAmount, // 100% to principal
                interest_component: 0, // 0% to interest
            };

            // Save using the single transaction endpoint (POST)
            const response = await fetch('/api/emi-transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to copy Part Payment');
            }

            // Update local state
            updatePartPayment(month, previousAmount);

            toast({
                title: "✅ Part Payment Copied",
                description: `Copied ₹${previousAmount.toLocaleString('en-IN')} to this month`,
            });

            // Refresh transactions from database
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }
        } catch (error) {
            console.error('Error copying Part Payment:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to copy Part Payment',
                variant: "destructive",
            });
        } finally {
            setSyncingPartPaymentMonths(new Set());
        }
    };

    const handleDeletePartPayment = async (month: number) => {
        try {
            if (!currentLoan?.id) {
                return;
            }

            // Set loading state for this month only
            setSyncingPartPaymentMonths(new Set([month]));

            // Find the transaction to delete
            const transactionToDelete = transactions.find(
                t => t.loan_id === currentLoan.id &&
                    t.month_number === month &&
                    t.transaction_type === 'part_payment'
            );

            if (transactionToDelete?.id) {
                // Delete from database
                const response = await fetch(`/api/emi-transactions?id=${transactionToDelete.id}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to delete Part Payment');
                }
            }

            // Update local state
            updatePartPayment(month, 0);

            toast({
                title: "🗑️ Part Payment Deleted",
                description: `Part Payment cleared for this month`,
            });

            // Refresh transactions from database
            if (currentLoan?.id) {
                fetchTransactionsByLoanId(currentLoan.id);
            }
        } catch (error) {
            console.error('Error deleting Part Payment:', error);
            toast({
                title: "❌ Error",
                description: error instanceof Error ? error.message : 'Failed to delete Part Payment',
                variant: "destructive",
            });
        } finally {
            setSyncingPartPaymentMonths(new Set());
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    return (
        <Card className="w-full flex flex-col bg-card/80 backdrop-blur-md border-border shadow-xl" style={{ maxHeight }}>
            <CardHeader className="flex-shrink-0">
                <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">
                    Amortization Schedule
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card backdrop-blur-md z-10 border-b-2 border-border shadow-sm">
                            <TableRow>
                                <TableHead className="font-semibold text-primary w-24 bg-card">Date</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Scheduled EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-28">Paid EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-28">Part Payment</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Principal</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Interest</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((point) => {
                                const isPrincipalGreater = point.principalComponent > point.interestComponent;
                                const hasPartPayment = point.partPayment && point.partPayment > 0;

                                return (
                                    <TableRow
                                        key={point.month}
                                        className={`
                      transition-colors hover:bg-muted/50
                      ${isPrincipalGreater ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' : ''}
                      ${hasPartPayment ? 'bg-blue-500/5 border-r-4 border-r-blue-500' : ''}
                    `}
                                    >
                                        <TableCell className="font-medium text-foreground">
                                            {formatDate(point.date)}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(calculationResult.emi)}
                                        </TableCell>

                                        {/* Paid EMI - Editable with hover icons */}
                                        <TableCell
                                            className="text-right cursor-pointer hover:bg-accent/20 transition-colors relative group"
                                            onMouseEnter={() => setHoveredCell(point.month)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {editingCell?.month === point.month && editingCell?.field === 'paidEmi' ? (
                                                <Input
                                                    type="number"
                                                    defaultValue={point.paidEmi || ''}
                                                    onBlur={(e) => {
                                                        handleInputChange(point.month, 'paidEmi', e.target.value);
                                                        handleInputBlur();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleInputChange(point.month, 'paidEmi', e.currentTarget.value);
                                                            handleInputBlur();
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="h-8 text-right bg-background max-w-24"
                                                    placeholder="Enter amount"
                                                />
                                            ) : syncingMonths.has(point.month) ? (
                                                // Show loader when syncing
                                                <div className="flex items-center justify-end">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                                                </div>
                                            ) : (
                                                <div className="relative inline-flex items-center justify-end min-w-[100px]">
                                                    {/* Value display - hidden on hover */}
                                                    <span className={`text-foreground transition-opacity duration-200 ${hoveredCell === point.month ? 'opacity-0' : 'opacity-100'}`}>
                                                        {point.paidEmi ? formatCurrency(point.paidEmi) : '-'}
                                                    </span>

                                                    {/* Icons overlay - shown on hover */}
                                                    {hoveredCell === point.month && (
                                                        <div className="absolute inset-0 flex items-center justify-end gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                            {/* Sync Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyScheduledEmi(point.month);
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-all hover:scale-110"
                                                                title="Sync from Scheduled EMI"
                                                            >
                                                                <ArrowLeftRight className="h-4 w-4" />
                                                            </button>

                                                            {/* Edit Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCellClick(point.month, 'paidEmi');
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all hover:scale-110"
                                                                title="Edit Paid EMI"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>

                                                            {/* Delete Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeletePaidEmi(point.month);
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 transition-all hover:scale-110"
                                                                title="Delete Paid EMI"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Part Payment - Editable with hover icons */}
                                        <TableCell
                                            className="text-right cursor-pointer hover:bg-accent/20 transition-colors relative group"
                                            onMouseEnter={() => setHoveredPartPaymentCell(point.month)}
                                            onMouseLeave={() => setHoveredPartPaymentCell(null)}
                                        >
                                            {editingCell?.month === point.month && editingCell?.field === 'partPayment' ? (
                                                <Input
                                                    type="number"
                                                    defaultValue={point.partPayment || ''}
                                                    onBlur={(e) => {
                                                        handleInputChange(point.month, 'partPayment', e.target.value);
                                                        handleInputBlur();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleInputChange(point.month, 'partPayment', e.currentTarget.value);
                                                            handleInputBlur();
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="h-8 text-right bg-background max-w-24"
                                                    placeholder="Extra amount"
                                                />
                                            ) : syncingPartPaymentMonths.has(point.month) ? (
                                                // Show loader when syncing
                                                <div className="flex items-center justify-end">
                                                    <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <div className="relative inline-flex items-center justify-end min-w-[100px]">
                                                    {/* Value display - hidden on hover */}
                                                    <span className={`transition-opacity duration-200 ${hoveredPartPaymentCell === point.month ? 'opacity-0' : 'opacity-100'} ${hasPartPayment ? 'text-blue-500 font-semibold' : 'text-foreground'}`}>
                                                        {point.partPayment ? formatCurrency(point.partPayment) : '-'}
                                                    </span>

                                                    {/* Icons overlay - shown on hover */}
                                                    {hoveredPartPaymentCell === point.month && (
                                                        <div className="absolute inset-0 flex items-center justify-end gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                            {/* Sync Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSyncPartPayment(point.month);
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 transition-all hover:scale-110"
                                                                title="Copy from Previous Part Payment"
                                                            >
                                                                <ArrowDownUp className="h-4 w-4" />
                                                            </button>

                                                            {/* Edit Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCellClick(point.month, 'partPayment');
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all hover:scale-110"
                                                                title="Edit Part Payment"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>

                                                            {/* Delete Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeletePartPayment(point.month);
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 transition-all hover:scale-110"
                                                                title="Delete Part Payments from this month onwards"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-foreground font-medium">
                                            {formatCurrency(point.principalComponent)}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(point.interestComponent)}
                                        </TableCell>

                                        <TableCell className="text-right text-foreground font-semibold">
                                            {formatCurrency(point.outstandingBalance)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Totals Row - Using Table structure for perfect alignment */}
                <div className="border-t-2 border-border bg-muted/30 flex-shrink-0">
                    <Table>
                        <TableBody>
                            <TableRow className="hover:bg-transparent">
                                <TableCell className="font-bold text-primary text-sm w-24">
                                    TOTAL
                                </TableCell>
                                <TableCell className="text-right font-semibold text-foreground text-sm w-32">
                                    {formatCurrency(calculationResult.emi * schedule.length)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-foreground text-sm w-28">
                                    {formatCurrency(
                                        schedule.reduce((sum, point) => sum + (point.paidEmi || 0), 0)
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400 text-sm w-28">
                                    {formatCurrency(
                                        schedule.reduce((sum, point) => sum + (point.partPayment || 0), 0)
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600 dark:text-green-400 text-sm w-32">
                                    {formatCurrency(
                                        schedule.reduce((sum, point) => sum + point.principalComponent, 0)
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-red-600 dark:text-red-400 text-sm w-32">
                                    {formatCurrency(
                                        schedule.reduce((sum, point) => sum + point.interestComponent, 0)
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-muted-foreground text-sm w-32">
                                    -
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
