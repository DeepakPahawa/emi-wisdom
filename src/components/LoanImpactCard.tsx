"use client";

import { useMemo } from "react";
import { useLoanConfigStore } from "@/store/loan-config-store";
import { generateAmortizationSchedule, formatCompactCurrency } from "@/lib/loan-calculations";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const UnderscoredValue = ({ colorClass, text }: { colorClass: string, text: string }) => (
    <span className="relative inline-flex whitespace-nowrap">
        <span className={cn("font-extrabold tracking-tight relative z-10 px-0.5", colorClass)}>
            {text}
        </span>
        <motion.span
            className={cn("absolute -bottom-0.5 left-0 w-full h-[2.5px] rounded-full opacity-60", colorClass.replace('text-', 'bg-'))}
            style={{ originX: 0 }}
            animate={{ scaleX: [0, 1] }}
            transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                repeatDelay: 0.3
            }}
        />
    </span>
);

export function LoanImpactCard() {
    const { principal, interest, tenure, isInitialized, emiStartDate, transactions } = useLoanConfigStore();

    const impact = useMemo(() => {
        if (!isInitialized || principal <= 0 || interest <= 0 || tenure <= 0) {
            return null;
        }

        const actualSchedule = generateAmortizationSchedule(principal, interest, tenure, emiStartDate ? new Date(emiStartDate) : new Date(), transactions);
        const originalSchedule = generateAmortizationSchedule(principal, interest, tenure);

        const paidMonthNumbers = Object.keys(transactions)
            .map(Number)
            .filter(m => transactions[m].paidEmi > 0)
            .sort((a, b) => a - b);
        const lastPaidMonth = paidMonthNumbers.length > 0 ? Math.max(...paidMonthNumbers) : 0;

        const estimatedRemainingMonths = actualSchedule.filter((p, i) => i >= lastPaidMonth && p.balance > 0 || (i >= lastPaidMonth && i < tenure && p.emi > 0)).length;

        const originalRemainingMonths = tenure - lastPaidMonth;
        const timeSavedMonths = Math.max(0, originalRemainingMonths - estimatedRemainingMonths);

        const originalTotalInterest = originalSchedule.reduce((sum, p) => sum + p.interest, 0);
        const projectedTotalInterest = actualSchedule.reduce((sum, p) => sum + p.interest, 0);
        const interestSaved = originalTotalInterest - projectedTotalInterest;

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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-full"
            >
                <Card className="overflow-hidden border border-part-payment/20 bg-gradient-to-r from-part-payment/10 via-part-payment/5 to-transparent relative group shadow-sm py-2">
                    <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <motion.div
                                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-part-payment/10 border border-part-payment/20 relative"
                                    animate={{
                                        boxShadow: ["0 0 0px rgba(34, 197, 94, 0)", "0 0 10px rgba(34, 197, 94, 0.1)", "0 0 0px rgba(34, 197, 94, 0)"]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <TrendingDown className="w-6 h-6 text-part-payment" />
                                    <div className="absolute -top-1.5 -right-1.5 bg-part-payment text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                        SAVED
                                    </div>
                                </motion.div>
                            </div>

                            <div className="flex-grow">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Sparkles className="w-3 h-3 text-part-payment/60" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-part-payment/70">
                                        Impact
                                    </h3>
                                </div>

                                <p className="text-sm md:text-lg font-bold tracking-tight text-foreground/90 leading-tight">
                                    Reduced tenure by{" "}
                                    <UnderscoredValue colorClass="text-part-payment" text={`${impact.timeSavedMonths} ${impact.timeSavedMonths === 1 ? 'month' : 'months'}`} />
                                    {" "}and saved{" "}
                                    <UnderscoredValue colorClass="text-part-payment" text={formatCompactCurrency(Math.max(0, impact.interestSaved))} />
                                    {" "}interest!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
