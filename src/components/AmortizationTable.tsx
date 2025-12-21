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
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateEmiTransactionRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function AmortizationTable() {
    const { schedule, calculationResult, updatePaidEmi, updateEmiHack } = useEmiStore();
    const [editingCell, setEditingCell] = useState<{ month: number; field: 'paidEmi' | 'emiHack' } | null>(null);
    const { toast } = useToast();

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
            // For EMI Hacks (part_payment): entire amount goes to principal, 0 to interest
            // For Paid EMI (emi): use the scheduled principal/interest breakdown
            const principalComponent = transactionType === 'part_payment'
                ? amount  // EMI Hacks: 100% principal
                : point.principalComponent;  // Paid EMI: use schedule

            const interestComponent = transactionType === 'part_payment'
                ? 0  // EMI Hacks: no interest
                : point.interestComponent;  // Paid EMI: use schedule

            const transactionData: CreateEmiTransactionRequest = {
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

    const handleInputChange = (month: number, field: 'paidEmi' | 'emiHack', value: string) => {
        const numValue = parseFloat(value) || 0;

        // Find the schedule point for this month
        const point = schedule.find(p => p.month === month);

        if (field === 'paidEmi') {
            updatePaidEmi(month, numValue);

            if (point && numValue > 0) {
                // Save to database as 'emi' type
                saveEmiTransaction(month, numValue, point, 'emi');
            }
        } else {
            updateEmiHack(month, numValue);

            if (point && numValue > 0) {
                // Save to database as 'part_payment' type
                saveEmiTransaction(month, numValue, point, 'part_payment');
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
                                <TableHead className="font-semibold text-primary w-32 bg-card">Date</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">Scheduled EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">Paid EMI</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">EMI Hacks</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">Principal</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">Interest</TableHead>
                                <TableHead className="font-semibold text-primary text-right bg-card">Balance</TableHead>
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
                                                    className="h-8 text-right bg-background"
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
                                                    className="h-8 text-right bg-background"
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

                {/* Totals Row */}
                <div className="px-4 py-4 border-t-2 border-border bg-muted/30">
                    <div className="grid grid-cols-7 gap-4 items-center">
                        {/* Date column - empty */}
                        <div className="font-bold text-primary">
                            TOTAL
                        </div>

                        {/* Scheduled EMI Total */}
                        <div className="text-right font-semibold text-foreground">
                            {formatCurrency(calculationResult.emi * schedule.length)}
                        </div>

                        {/* Paid EMI Total */}
                        <div className="text-right font-semibold text-foreground">
                            {formatCurrency(
                                schedule.reduce((sum, point) => sum + (point.paidEmi || 0), 0)
                            )}
                        </div>

                        {/* EMI Hacks Total */}
                        <div className="text-right font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(
                                schedule.reduce((sum, point) => sum + (point.emiHack || 0), 0)
                            )}
                        </div>

                        {/* Principal Total */}
                        <div className="text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(
                                schedule.reduce((sum, point) => sum + point.principalComponent, 0)
                            )}
                        </div>

                        {/* Interest Total */}
                        <div className="text-right font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(
                                schedule.reduce((sum, point) => sum + point.interestComponent, 0)
                            )}
                        </div>

                        {/* Balance - empty or final balance */}
                        <div className="text-right font-semibold text-muted-foreground">
                            -
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
