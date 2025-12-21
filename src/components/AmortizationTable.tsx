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

export function AmortizationTable() {
    const { schedule, calculationResult, updatePaidEmi, updateEmiHack } = useEmiStore();
    const { currentLoan } = useLoanDetailsStore();
    const { transactions, fetchTransactionsByLoanId } = useEmiTransactionsStore();
    const [editingCell, setEditingCell] = useState<{ month: number; field: 'paidEmi' | 'emiHack' } | null>(null);
    const { toast } = useToast();

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
                    updateEmiHack(transaction.month_number, transaction.amount_paid);
                }
            });
        }
    }, [transactions, updatePaidEmi, updateEmiHack]);

    const handleCellClick = (month: number, field: 'paidEmi' | 'emiHack') => {
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

            // For EMI Hacks (part_payment): entire amount goes to principal, 0 to interest
            // For Paid EMI (emi): use the scheduled principal/interest breakdown
            const principalComponent = transactionType === 'part_payment'
                ? amount  // EMI Hacks: 100% principal
                : point.principalComponent;  // Paid EMI: use schedule

            const interestComponent = transactionType === 'part_payment'
                ? 0  // EMI Hacks: no interest
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

    const handleInputChange = (month: number, field: 'paidEmi' | 'emiHack', value: string) => {
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
            updateEmiHack(month, numValue);

            if (point && numValue > 0) {
                // Save to database as 'part_payment' type
                saveEmiTransaction(month, numValue, point, 'part_payment');
            } else if (numValue === 0) {
                // Delete from database if value is 0 (EMI Hack removed)
                deleteEmiTransaction(month, 'part_payment');
            }
        }
    };

    const handleInputBlur = () => {
        setEditingCell(null);
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
        <Card className="w-full bg-card/80 backdrop-blur-md border-border shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-light text-primary uppercase tracking-widest">
                    Amortization Schedule
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                    <Table>
                        <TableHeader className="sticky top-0 bg-card backdrop-blur-md z-10 border-b-2 border-border shadow-sm">
                            <TableRow>
                                <TableHead className="font-semibold text-primary w-24 bg-card">Date</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Scheduled EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-28">Paid EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-28">EMI Hacks</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Principal</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Interest</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card w-32">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((point) => {
                                const isPrincipalGreater = point.principalComponent > point.interestComponent;
                                const hasEmiHack = point.emiHack && point.emiHack > 0;

                                return (
                                    <TableRow
                                        key={point.month}
                                        className={`
                      transition-colors hover:bg-muted/50
                      ${isPrincipalGreater ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' : ''}
                      ${hasEmiHack ? 'bg-blue-500/5 border-r-4 border-r-blue-500' : ''}
                    `}
                                    >
                                        <TableCell className="font-medium text-foreground">
                                            {formatDate(point.date)}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(calculationResult.emi)}
                                        </TableCell>

                                        {/* Paid EMI - Editable */}
                                        <TableCell
                                            className="text-right cursor-pointer hover:bg-accent/20 transition-colors"
                                            onClick={() => handleCellClick(point.month, 'paidEmi')}
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
                                            ) : (
                                                <span className="text-foreground">
                                                    {point.paidEmi ? formatCurrency(point.paidEmi) : '-'}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* EMI Hacks - Editable */}
                                        <TableCell
                                            className="text-right cursor-pointer hover:bg-accent/20 transition-colors"
                                            onClick={() => handleCellClick(point.month, 'emiHack')}
                                        >
                                            {editingCell?.month === point.month && editingCell?.field === 'emiHack' ? (
                                                <Input
                                                    type="number"
                                                    defaultValue={point.emiHack || ''}
                                                    onBlur={(e) => {
                                                        handleInputChange(point.month, 'emiHack', e.target.value);
                                                        handleInputBlur();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleInputChange(point.month, 'emiHack', e.currentTarget.value);
                                                            handleInputBlur();
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="h-8 text-right bg-background max-w-24"
                                                    placeholder="Extra amount"
                                                />
                                            ) : (
                                                <span className={`${hasEmiHack ? 'text-blue-500 font-semibold' : 'text-foreground'}`}>
                                                    {point.emiHack ? formatCurrency(point.emiHack) : '-'}
                                                </span>
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
                <div className="border-t-2 border-border bg-muted/30">
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
                                        schedule.reduce((sum, point) => sum + (point.emiHack || 0), 0)
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
