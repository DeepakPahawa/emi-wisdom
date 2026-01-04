"use client";

import { useMemo, useState } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCurrency, formatMonthYear } from "@/lib/loan-calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Copy, ArrowLeftRight, Pencil, Trash2, ArrowDownUp, ArrowDownToLine } from "lucide-react";

export function AmortizationSchedule() {
    const { principal, interest, tenure, isInitialized, emiStartDate, transactions, updateTransaction, updateBulkTransactions } = useLoanConfigStore();
    const [hoveredCell, setHoveredCell] = useState<{ month: number; type: 'paid' | 'part' } | null>(null);
    const [editingCell, setEditingCell] = useState<{ month: number; type: 'paid' | 'part' } | null>(null);

    const schedule = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return [];
        }
        return generateAmortizationSchedule(principal, interest, tenure, emiStartDate ? new Date(emiStartDate) : new Date(), transactions);
    }, [principal, interest, tenure, isInitialized, emiStartDate, transactions]);

    const actualMonths = useMemo(() => {
        const lastMonthWithPayment = [...schedule].reverse().find(p => p.principal > 0 || p.interest > 0 || p.emi > 0);
        return lastMonthWithPayment ? lastMonthWithPayment.month : 0;
    }, [schedule]);

    if (schedule.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">EMI Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Configure your loan parameters to see the EMI schedule
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full gap-0">
            <CardHeader className="py-1 px-4 border-b ">
                <CardTitle className="text-lg font-semibold">
                    EMI Schedule
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                    Monthly breakdown of your loan payments
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <Table containerClassName="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent">
                    <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
                        <TableRow className="hover:bg-transparent border-b-2">
                            <TableHead className="font-bold text-center w-12 text-xs py-2 bg-background">#</TableHead>
                            <TableHead className="font-bold text-center w-20 text-xs py-2 bg-background">Month</TableHead>
                            <TableHead className="font-bold text-right text-xs py-2 bg-background">EMI</TableHead>
                            <TableHead className="font-bold text-right w-[110px] text-xs py-2 bg-background">Paid EMI</TableHead>
                            <TableHead className="font-bold text-right w-[110px] text-xs py-2 bg-background">Part Payment</TableHead>
                            <TableHead className="font-bold text-right text-xs py-2 bg-background">Principal</TableHead>
                            <TableHead className="font-bold text-right text-xs py-2 bg-background">Interest</TableHead>
                            <TableHead className="font-bold text-right text-xs py-2 bg-background">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedule.map((payment, index) => {
                            const isEvenRow = index % 2 === 0;
                            const isLastPayment = index === schedule.length - 1;
                            const transaction = transactions[payment.month] || { paidEmi: 0, partPayment: 0 };

                            // The principal and emi in 'payment' now already include transaction adjustments
                            const totalPayment = payment.emi + (transaction.partPayment > 0 ? 0 : 0); // This is just for context

                            // Calculate percentages based on the actual components returned by the generator
                            const totalContributedThisMonth = payment.principal + payment.interest;
                            const principalPercentage = totalContributedThisMonth > 0 ? (payment.principal / totalContributedThisMonth) * 100 : 0;
                            const interestPercentage = totalContributedThisMonth > 0 ? (payment.interest / totalContributedThisMonth) * 100 : 0;

                            const startDate = emiStartDate ? new Date(emiStartDate) : new Date();

                            const handleCopyEmi = () => {
                                // Update all cells from month 1 to current month, but only if they don't have values
                                const updates = [];
                                for (let month = 1; month <= payment.month; month++) {
                                    const monthPayment = schedule.find(p => p.month === month);
                                    const existingTransaction = transactions[month] || { paidEmi: 0, partPayment: 0 };
                                    // Only update if there's no existing paidEmi value
                                    if (monthPayment && !existingTransaction.paidEmi) {
                                        updates.push({
                                            month,
                                            paidEmi: monthPayment.emi,
                                            partPayment: existingTransaction.partPayment
                                        });
                                    }
                                }
                                updateBulkTransactions(updates);
                                setHoveredCell(null);
                            };


                            const handleSyncPartPayment = () => {
                                // Find the most recent filled part payment cell before this one
                                let valueToSync = payment.emi; // Default to EMI amount

                                for (let month = payment.month - 1; month >= 1; month--) {
                                    const prevTransaction = transactions[month];
                                    if (prevTransaction && prevTransaction.partPayment > 0) {
                                        valueToSync = prevTransaction.partPayment;
                                        break;
                                    }
                                }

                                updateTransaction(payment.month, transaction.paidEmi, valueToSync);
                                setHoveredCell(null);
                            };

                            const handleBulkSyncPartPayment = () => {
                                // Find the most recent filled part payment cell
                                let valueToSync = payment.emi; // Default to EMI amount
                                let startMonth = 1;

                                for (let month = payment.month - 1; month >= 1; month--) {
                                    const prevTransaction = transactions[month];
                                    if (prevTransaction && prevTransaction.partPayment > 0) {
                                        valueToSync = prevTransaction.partPayment;
                                        startMonth = month + 1;
                                        break;
                                    }
                                }

                                // Copy to all previous unfilled cells
                                const updates = [];
                                for (let month = startMonth; month <= payment.month; month++) {
                                    const existingTransaction = transactions[month] || { paidEmi: 0, partPayment: 0 };
                                    // Only update if there's no existing part payment
                                    if (!existingTransaction.partPayment) {
                                        updates.push({
                                            month,
                                            paidEmi: existingTransaction.paidEmi,
                                            partPayment: valueToSync
                                        });
                                    }
                                }
                                updateBulkTransactions(updates);
                                setHoveredCell(null);
                            };

                            const handlePaidEmiChange = (value: string) => {
                                const numValue = parseFloat(value) || 0;
                                updateTransaction(payment.month, numValue, transaction.partPayment);
                            };

                            const handlePartPaymentChange = (value: string) => {
                                const numValue = parseFloat(value) || 0;
                                updateTransaction(payment.month, transaction.paidEmi, numValue);
                            };

                            const handleDeletePaidEmi = () => {
                                // Clear current cell and all subsequent cells
                                const updates = [];
                                for (let month = payment.month; month <= schedule.length; month++) {
                                    const existingTransaction = transactions[month] || { paidEmi: 0, partPayment: 0 };
                                    updates.push({
                                        month,
                                        paidEmi: 0,
                                        partPayment: existingTransaction.partPayment
                                    });
                                }
                                updateBulkTransactions(updates);
                                setHoveredCell(null);
                            };

                            const handleDeletePartPayment = () => {
                                // Clear only the current cell
                                updateTransaction(payment.month, transaction.paidEmi, 0);
                                setHoveredCell(null);
                            };



                            return (
                                <TableRow
                                    key={payment.month}
                                    className={`
                                        group
                                        ${isEvenRow ? 'bg-muted/30' : 'bg-background'}
                                        ${isLastPayment ? 'border-b-2 border-primary' : ''}
                                    `}
                                >
                                    {/* Month Number */}
                                    <TableCell className="text-center font-medium py-1 text-xs">
                                        {payment.month}
                                    </TableCell>

                                    {/* Month Name */}
                                    <TableCell className="text-center font-medium text-sm py-1">
                                        {formatMonthYear(startDate, payment.month)}
                                    </TableCell>

                                    {/* EMI */}
                                    <TableCell className="text-right font-semibold text-foreground text-sm py-1">
                                        {formatCurrency(payment.emi)}
                                    </TableCell>

                                    {/* Paid EMI */}
                                    <TableCell
                                        className="text-right py-1 w-[110px]"
                                        onMouseEnter={() => setHoveredCell({ month: payment.month, type: 'paid' })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        <div className="relative w-full min-h-[28px] flex items-center justify-end">
                                            {editingCell?.month === payment.month && editingCell?.type === 'paid' ? (
                                                <input
                                                    type="number"
                                                    value={transaction.paidEmi || ''}
                                                    onChange={(e) => handlePaidEmiChange(e.target.value)}
                                                    placeholder="-"
                                                    className="w-full px-2 py-0.5 text-sm text-right border border-primary/30 rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                            setEditingCell(null);
                                                        }
                                                    }}
                                                    onBlur={() => setEditingCell(null)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className="w-full py-1 text-sm text-right cursor-pointer"
                                                    onClick={() => setEditingCell({ month: payment.month, type: 'paid' })}
                                                >
                                                    {hoveredCell?.month === payment.month && hoveredCell?.type === 'paid' ? (
                                                        <div className="flex justify-end gap-1 items-center">
                                                            {transaction.paidEmi ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeletePaidEmi(); }}
                                                                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleCopyEmi(); }}
                                                                    className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                    title="Copy EMI amount"
                                                                >
                                                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <div className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-all duration-150">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Show amount
                                                        <>
                                                            {transaction.paidEmi ? (
                                                                <span className="font-medium text-foreground">
                                                                    {formatCurrency(transaction.paidEmi)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Part Payment */}
                                    <TableCell
                                        className="text-right py-1 w-[110px]"
                                        onMouseEnter={() => setHoveredCell({ month: payment.month, type: 'part' })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        <div className="relative w-full min-h-[28px] flex items-center justify-end">
                                            {editingCell?.month === payment.month && editingCell?.type === 'part' ? (
                                                <input
                                                    type="number"
                                                    value={transaction.partPayment || ''}
                                                    onChange={(e) => handlePartPaymentChange(e.target.value)}
                                                    placeholder="-"
                                                    className="w-full px-2 py-0.5 text-sm text-right border border-primary/30 rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                            setEditingCell(null);
                                                        }
                                                    }}
                                                    onBlur={() => setEditingCell(null)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className="w-full py-1 text-sm text-right cursor-pointer"
                                                    onClick={() => setEditingCell({ month: payment.month, type: 'part' })}
                                                >
                                                    {hoveredCell?.month === payment.month && hoveredCell?.type === 'part' ? (
                                                        <div className="flex justify-end gap-1 items-center">
                                                            {transaction.partPayment ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleBulkSyncPartPayment(); }}
                                                                        className="p-1 bg-purple-500 hover:bg-purple-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                        title="Copy Previous Part Payment or EMI amount to all the cells"
                                                                    >
                                                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeletePartPayment(); }}
                                                                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleBulkSyncPartPayment(); }}
                                                                        className="p-1 bg-purple-500 hover:bg-purple-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                        title="Copy Previous Part Payment or EMI amount to all the cells"
                                                                    >
                                                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleSyncPartPayment(); }}
                                                                        className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all duration-150 hover:scale-105"
                                                                        title="Copy Previous Part Payment or EMI amount"
                                                                    >
                                                                        <ArrowDownUp className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <div className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-all duration-150">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Show amount
                                                        <>
                                                            {transaction.partPayment ? (
                                                                <span className="font-medium text-part-payment">
                                                                    {formatCurrency(transaction.partPayment)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Principal */}
                                    <TableCell className="text-right py-1">
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-principal text-sm">
                                                {formatCurrency(payment.principal)}
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-principal transition-all duration-500"
                                                    style={{ width: `${principalPercentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {principalPercentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Interest */}
                                    <TableCell className="text-right py-1">
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-interest text-sm">
                                                {formatCurrency(payment.interest)}
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-interest transition-all duration-500"
                                                    style={{ width: `${interestPercentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {interestPercentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Balance */}
                                    <TableCell className="text-right py-1">
                                        <div className={`
                                            font-semibold text-sm
                                            ${payment.balance === 0
                                                ? 'text-primary font-bold'
                                                : 'text-foreground font-medium'
                                            }
                                        `}>
                                            {payment.balance === 0 ? (
                                                <span className="inline-flex items-center gap-1">
                                                    {formatCurrency(payment.balance)}
                                                    <span className="text-xs">✓</span>
                                                </span>
                                            ) : (
                                                formatCurrency(payment.balance)
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* Summary Footer */}
                <div className="border-t p-3 bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Actual Months / Original Months</p>
                            <p className="font-semibold text-sm">
                                <span className={actualMonths < tenure ? "text-green-600 font-bold" : ""}>
                                    {actualMonths}
                                </span>
                                <span className="text-muted-foreground font-normal mx-1">/</span>
                                <span className="text-muted-foreground">{tenure}</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Paid EMI</p>
                            <p className="font-semibold text-sm">{formatCurrency(schedule.reduce((sum, p) => {
                                const t = transactions[p.month];
                                return sum + (t?.paidEmi || 0);
                            }, 0))}</p>
                        </div>
                        <div className="space-y-1 text-part-payment">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Part Payment</p>
                            <p className="font-semibold text-sm">{formatCurrency(Object.values(transactions).reduce((sum, t) => sum + (t.partPayment || 0), 0))}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
