"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCompactCurrency } from "@/lib/loan-calculations";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Calendar, Sparkles } from "lucide-react";

export function LoanImpactCard() {
    const { principal, interest, tenure, isInitialized, emiStartDate, transactions } = useLoanConfigStore();

    const impact = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return null;
        }

        const actualSchedule = generateAmortizationSchedule(principal, interest, tenure, emiStartDate ? new Date(emiStartDate) : new Date(), transactions);
        const originalSchedule = generateAmortizationSchedule(principal, interest, tenure);

        // Find last month where a payment was recorded
        const paidMonthNumbers = Object.keys(transactions)
            .map(Number)
            .filter(m => transactions[m].paidEmi > 0)
            .sort((a, b) => a - b);
        const lastPaidMonth = paidMonthNumbers.length > 0 ? Math.max(...paidMonthNumbers) : 0;

        // Estimated remaining months in actual schedule
        const estimatedRemainingMonths = actualSchedule.filter((p, i) => i >= lastPaidMonth && p.balance > 0 || (i >= lastPaidMonth && i < tenure && p.emi > 0)).length;

        // Time saved
        const originalRemainingMonths = tenure - lastPaidMonth;
        const timeSavedMonths = Math.max(0, originalRemainingMonths - estimatedRemainingMonths);

        // Interest saved
        const originalTotalInterest = originalSchedule.reduce((sum, p) => sum + p.interest, 0);
        const projectedTotalInterest = actualSchedule.reduce((sum, p) => sum + p.interest, 0);
        const interestSaved = originalTotalInterest - projectedTotalInterest;

        // Only show if there's an actual impact
        const totalPartPayments = Object.values(transactions).reduce((sum, t) => sum + (t.partPayment || 0), 0);
        if (totalPartPayments <= 0 || (timeSavedMonths <= 0 && interestSaved <= 0)) {
            return null;
        }

        return {
            timeSavedMonths,
            interestSaved,
        };
    }, [principal, interest, tenure, isInitialized, emiStartDate, transactions]);

    if (!impact) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card className="overflow-hidden border-none bg-gradient-to-br from-part-payment/10 via-part-payment/5 to-transparent relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <Sparkles className="w-12 h-12 text-part-payment" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-part-payment/20 rounded-full">
                                    <Sparkles className="w-4 h-4 text-part-payment animate-pulse" />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-part-payment/80">
                                    Impact of Part Payments
                                </h3>
                            </div>

                            <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                                Due to extra part payments, you have reduced your tenure by{" "}
                                <span className="text-part-payment inline-flex items-center gap-1.5 px-2 py-0.5 bg-part-payment/10 rounded-md border border-part-payment/20">
                                    <Calendar className="w-5 h-5" />
                                    {impact.timeSavedMonths} {impact.timeSavedMonths === 1 ? 'month' : 'months'}
                                </span>{" "}
                                and saved{" "}
                                <span className="text-part-payment inline-flex items-center gap-1.5 px-2 py-0.5 bg-part-payment/10 rounded-md border border-part-payment/20">
                                    <TrendingDown className="w-5 h-5" />
                                    {formatCompactCurrency(Math.max(0, impact.interestSaved))}
                                </span>{" "}
                                in interest!
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-1 flex-grow bg-part-payment/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-part-payment"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
