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
        <Card className="w-full">
            <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                    EMI Schedule
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Monthly breakdown of your loan payments
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow className="hover:bg-transparent border-b-2">
                                <TableHead className="font-bold text-center w-12 text-xs py-2">#</TableHead>
                                <TableHead className="font-bold text-center w-20 text-xs py-2">Month</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">EMI</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Paid EMI</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Part Payment</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Principal</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Interest</TableHead>
                                <TableHead className="font-bold text-right text-xs py-2">Balance</TableHead>
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
                                };

                                const handleBulkSyncPartPayment = () => {
                                    // Find the most recent filled part payment cell before this one
                                    let valueToSync = 0;
                                    let lastFilledMonth = 0;

                                    for (let month = payment.month - 1; month >= 1; month--) {
                                        const prevTransaction = transactions[month];
                                        if (prevTransaction && prevTransaction.partPayment > 0) {
                                            valueToSync = prevTransaction.partPayment;
                                            lastFilledMonth = month;
                                            break;
                                        }
                                    }

                                    if (valueToSync > 0) {
                                        const updates = [];
                                        for (let month = lastFilledMonth + 1; month <= payment.month; month++) {
                                            const existingTransaction = transactions[month] || { paidEmi: 0, partPayment: 0 };
                                            updates.push({
                                                month,
                                                paidEmi: existingTransaction.paidEmi,
                                                partPayment: valueToSync
                                            });
                                        }
                                        updateBulkTransactions(updates);
                                    } else {
                                        // If no previous value, just do a normal sync (uses EMI)
                                        handleSyncPartPayment();
                                    }
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
                                };

                                const handleDeletePartPayment = () => {
                                    // Clear only the current cell
                                    updateTransaction(payment.month, transaction.paidEmi, 0);
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
                                        <TableCell className="text-center font-medium py-2 text-xs">
                                            {payment.month}
                                        </TableCell>

                                        {/* Month Name */}
                                        <TableCell className="text-center font-medium text-sm py-2">
                                            {formatMonthYear(startDate, payment.month)}
                                        </TableCell>

                                        {/* EMI */}
                                        <TableCell className="text-right font-semibold text-foreground text-sm py-2">
                                            {formatCurrency(payment.emi)}
                                        </TableCell>

                                        {/* Paid EMI */}
                                        <TableCell className="text-right py-2">
                                            <div className="relative inline-block w-full">
                                                {editingCell?.month === payment.month && editingCell?.type === 'paid' ? (
                                                    <input
                                                        type="number"
                                                        value={transaction.paidEmi || ''}
                                                        onChange={(e) => handlePaidEmiChange(e.target.value)}
                                                        placeholder="-"
                                                        className="w-full px-2 py-1 text-sm text-right border border-primary/30 rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                                        className="px-2 py-1 text-sm text-right"
                                                        onMouseEnter={() => setHoveredCell({ month: payment.month, type: 'paid' })}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {hoveredCell?.month === payment.month && hoveredCell?.type === 'paid' ? (
                                                            // Show icons, hide amount
                                                            <div className="flex justify-end gap-1">
                                                                {transaction.paidEmi ? (
                                                                    // Show delete icon when there's a value
                                                                    <button
                                                                        onClick={handleDeletePaidEmi}
                                                                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-200 hover:scale-110"
                                                                        title="Delete this and all subsequent EMI payments"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    // Show sync icon when there's no value
                                                                    <button
                                                                        onClick={handleCopyEmi}
                                                                        className="p-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                        title="Sync EMI amount to all previous empty cells"
                                                                    >
                                                                        <ArrowLeftRight className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCell({ month: payment.month, type: 'paid' });
                                                                    }}
                                                                    className="p-1 bg-primary/60 hover:bg-primary/80 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                    title="Edit amount"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
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
                                        <TableCell className="text-right py-2">
                                            <div className="relative inline-block w-full">
                                                {editingCell?.month === payment.month && editingCell?.type === 'part' ? (
                                                    <input
                                                        type="number"
                                                        value={transaction.partPayment || ''}
                                                        onChange={(e) => handlePartPaymentChange(e.target.value)}
                                                        placeholder="-"
                                                        className="w-full px-2 py-1 text-sm text-right border border-primary/30 rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                                        className="px-2 py-1 text-sm text-right"
                                                        onMouseEnter={() => setHoveredCell({ month: payment.month, type: 'part' })}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {hoveredCell?.month === payment.month && hoveredCell?.type === 'part' ? (
                                                            // Show icons, hide amount
                                                            <div className="flex justify-end gap-1">
                                                                {transaction.partPayment ? (
                                                                    // Show delete and bulk sync icons when there's a value
                                                                    <>
                                                                        <button
                                                                            onClick={handleBulkSyncPartPayment}
                                                                            className="p-1 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                            title="Overwrite this and fill all empty cells before it with previous part payment value"
                                                                        >
                                                                            <ArrowDownToLine className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={handleDeletePartPayment}
                                                                            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-200 hover:scale-110"
                                                                            title="Delete this part payment"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    // Show sync icons when there's no value
                                                                    <>
                                                                        <button
                                                                            onClick={handleBulkSyncPartPayment}
                                                                            className="p-1 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                            title="Fill all empty cells up to this month with previous part payment value"
                                                                        >
                                                                            <ArrowDownToLine className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={handleSyncPartPayment}
                                                                            className="p-1 bg-primary/60 hover:bg-primary/80 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                            title="Sync from previous part payment or EMI amount"
                                                                        >
                                                                            <ArrowDownUp className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCell({ month: payment.month, type: 'part' });
                                                                    }}
                                                                    className="p-1 bg-primary/40 hover:bg-primary/60 text-primary-foreground rounded transition-all duration-200 hover:scale-110"
                                                                    title="Edit amount"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            // Show amount
                                                            <>
                                                                {transaction.partPayment ? (
                                                                    <span className="font-medium text-foreground">
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
                                        <TableCell className="text-right py-2">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-primary text-sm">
                                                    {formatCurrency(payment.principal)}
                                                </div>
                                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${principalPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {principalPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Interest */}
                                        <TableCell className="text-right py-2">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-primary/60 text-sm">
                                                    {formatCurrency(payment.interest)}
                                                </div>
                                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/40 transition-all duration-500"
                                                        style={{ width: `${interestPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {interestPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Balance */}
                                        <TableCell className="text-right py-2">
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
                </div>

                {/* Summary Footer */}
                <div className="border-t p-4 bg-muted/20">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Months</p>
                            <p className="font-semibold">{schedule.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">EMI</p>
                            <p className="font-semibold">{formatCurrency(schedule[0]?.emi || 0)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Principal</p>
                            <p className="font-semibold">{formatCurrency(principal)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Interest</p>
                            <p className="font-semibold">{formatCurrency(schedule.reduce((sum, p) => sum + p.interest, 0))}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
