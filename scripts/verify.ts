
import { CalculationService } from '../src/services/CalculationService';
import { SavingsService } from '../src/services/SavingsService';

const details = {
    principal: 5000000, // 50 Lakhs
    rate: 9, // 9%
    durationMonths: 240 // 20 years
};

console.log("--- Standard Loan ---");
const result = CalculationService.calculateAmortizationSchedule(details);
console.log(`EMI: ${result.emi.toFixed(2)}`);
console.log(`Total Interest: ${result.totalInterest.toFixed(2)}`);
console.log(`Total Amount: ${result.totalAmount.toFixed(2)}`);
console.log(`Months: ${result.schedule.length}`);
console.log(`Crossing Point Month: ${result.crossingPointMonth}`);

console.log("\n--- With Extra Payment (5k/month) ---");
// Need to map ExtraPayment interface correctly
// Assuming we want 5000 extra every month starting month 1
const extras = [];
for (let i = 1; i <= 240; i++) {
    extras.push({ month: i, amount: 5000, isRecurring: true });
}

// Note: The service currently expects explicit array of payments, but we passed a big array.
// Let's test with just one extra payment to keep it simple or the big array.
// The service code mapped extras: `extraPayments.forEach(p => extraPaymentMap.set(p.month, p.amount));`
// So it handles array fine.

const resultOpt = CalculationService.calculateAmortizationSchedule(details, extras);
console.log(`New Total Interest: ${resultOpt.totalInterest.toFixed(2)}`);
console.log(`New Months: ${resultOpt.schedule.length}`);

console.log("\n--- Savings Analysis ---");
const savings = SavingsService.calculateSavings(details, [], extras, []);
console.log(`Interest Saved: ${savings.interestSaved.toFixed(2)}`);
console.log(`Time Saved (Months): ${savings.timeSavedMonths}`);
