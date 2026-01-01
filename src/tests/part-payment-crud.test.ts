/**
 * Manual Test Script for Part Payment CRUD Operations
 * 
 * This script tests the following operations:
 * 1. Create Part Payment transaction (IndexedDB)
 * 2. Read Part Payment transactions (IndexedDB)
 * 3. Update Part Payment transaction (IndexedDB)
 * 4. Delete Part Payment transaction (IndexedDB)
 * 5. Batch operations for Part Payment (IndexedDB)
 * 
 * To run this test:
 * 1. Open the browser console
 * 2. Copy and paste this code
 * 3. Run: await testPartPaymentCRUD()
 */

import { indexedDBService } from '@/services/IndexedDBService';
import { storageService } from '@/services/StorageService';
import { emiTransactionsService } from '@/services/EmiTransactionsService';

export async function testPartPaymentCRUD() {
    console.log('🧪 Starting Part Payment CRUD Tests...\n');

    try {
        // Initialize IndexedDB
        await indexedDBService.init();
        console.log('✅ IndexedDB initialized\n');

        // Test 1: Create a test loan
        console.log('📝 Test 1: Creating test loan...');
        const testLoan = await indexedDBService.saveLoanDetails({
            loan_number: 'TEST-LOAN-001',
            principal_amount: 1000000,
            original_interest_rate: 8.5,
            current_interest_rate: 8.5,
            emi_start_date: '2024-01-01',
            loan_tenure_months: 240,
            bank_name: 'Test Bank',
            loan_label: 'HomeLoan',
        });
        console.log('✅ Test loan created:', testLoan.id);
        console.log('');

        // Test 2: Create Part Payment transaction
        console.log('📝 Test 2: Creating Part Payment transaction...');
        const partPayment1 = await emiTransactionsService.saveTransaction({
            loan_id: testLoan.id,
            month_number: 1,
            emi_date: '2024-01-01',
            transaction_type: 'part_payment',
            amount_paid: 50000,
            principal_component: 50000,
            interest_component: 0,
        });
        console.log('✅ Part Payment created:', partPayment1.data);
        console.log('');

        // Test 3: Read Part Payment transactions
        console.log('📝 Test 3: Reading Part Payment transactions...');
        const transactions = await emiTransactionsService.fetchTransactionsByLoanId(testLoan.id);
        const partPayments = transactions.filter(t => t.transaction_type === 'part_payment');
        console.log(`✅ Found ${partPayments.length} Part Payment transaction(s):`, partPayments);
        console.log('');

        // Test 4: Update Part Payment transaction
        console.log('📝 Test 4: Updating Part Payment transaction...');
        const updatedPartPayment = await emiTransactionsService.saveTransaction({
            id: partPayment1.data.id,
            loan_id: testLoan.id,
            month_number: 1,
            emi_date: '2024-01-01',
            transaction_type: 'part_payment',
            amount_paid: 75000, // Updated amount
            principal_component: 75000,
            interest_component: 0,
        });
        console.log('✅ Part Payment updated:', updatedPartPayment.data);
        console.log('');

        // Test 5: Create multiple Part Payment transactions (batch)
        console.log('📝 Test 5: Creating multiple Part Payment transactions...');
        const batchTransactions = [
            {
                loan_id: testLoan.id,
                month_number: 2,
                emi_date: '2024-02-01',
                transaction_type: 'part_payment' as const,
                amount_paid: 30000,
                principal_component: 30000,
                interest_component: 0,
            },
            {
                loan_id: testLoan.id,
                month_number: 3,
                emi_date: '2024-03-01',
                transaction_type: 'part_payment' as const,
                amount_paid: 40000,
                principal_component: 40000,
                interest_component: 0,
            },
        ];
        const batchResult = await emiTransactionsService.batchSaveTransactions(testLoan.id, batchTransactions);
        console.log('✅ Batch Part Payments created:', batchResult);
        console.log('');

        // Test 6: Read all transactions again
        console.log('📝 Test 6: Reading all transactions...');
        const allTransactions = await emiTransactionsService.fetchTransactionsByLoanId(testLoan.id);
        const allPartPayments = allTransactions.filter(t => t.transaction_type === 'part_payment');
        console.log(`✅ Total Part Payments: ${allPartPayments.length}`);
        allPartPayments.forEach((pp, index) => {
            console.log(`   ${index + 1}. Month ${pp.month_number}: ₹${pp.amount_paid.toLocaleString('en-IN')}`);
        });
        console.log('');

        // Test 7: Delete a single Part Payment transaction
        console.log('📝 Test 7: Deleting a single Part Payment transaction...');
        await emiTransactionsService.deleteTransaction(partPayment1.data.id!);
        const afterDelete = await emiTransactionsService.fetchTransactionsByLoanId(testLoan.id);
        const afterDeletePartPayments = afterDelete.filter(t => t.transaction_type === 'part_payment');
        console.log(`✅ Part Payment deleted. Remaining: ${afterDeletePartPayments.length}`);
        console.log('');

        // Test 8: Delete Part Payments from a specific month onwards
        console.log('📝 Test 8: Deleting Part Payments from month 2 onwards...');
        const deletedCount = await emiTransactionsService.deleteTransactionsFromMonth(
            testLoan.id,
            'part_payment',
            2
        );
        console.log(`✅ Deleted ${deletedCount} Part Payment transaction(s)`);
        const finalTransactions = await emiTransactionsService.fetchTransactionsByLoanId(testLoan.id);
        const finalPartPayments = finalTransactions.filter(t => t.transaction_type === 'part_payment');
        console.log(`   Remaining Part Payments: ${finalPartPayments.length}`);
        console.log('');

        // Test 9: Test EMI transactions alongside Part Payments
        console.log('📝 Test 9: Testing EMI and Part Payment together...');
        const mixedTransactions = [
            {
                loan_id: testLoan.id,
                month_number: 1,
                emi_date: '2024-01-01',
                transaction_type: 'emi' as const,
                amount_paid: 8882,
                principal_component: 1799,
                interest_component: 7083,
            },
            {
                loan_id: testLoan.id,
                month_number: 1,
                emi_date: '2024-01-01',
                transaction_type: 'part_payment' as const,
                amount_paid: 50000,
                principal_component: 50000,
                interest_component: 0,
            },
        ];
        await emiTransactionsService.batchSaveTransactions(testLoan.id, mixedTransactions);
        const mixedResult = await emiTransactionsService.fetchTransactionsByLoanId(testLoan.id);
        const emiCount = mixedResult.filter(t => t.transaction_type === 'emi').length;
        const ppCount = mixedResult.filter(t => t.transaction_type === 'part_payment').length;
        console.log(`✅ Mixed transactions created:`);
        console.log(`   EMI transactions: ${emiCount}`);
        console.log(`   Part Payment transactions: ${ppCount}`);
        console.log('');

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await indexedDBService.deleteLoanDetails(testLoan.id);
        await indexedDBService.deleteEmiTransactions(testLoan.id);
        console.log('✅ Cleanup complete\n');

        console.log('🎉 All Part Payment CRUD tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Export for console usage
if (typeof window !== 'undefined') {
    (window as any).testPartPaymentCRUD = testPartPaymentCRUD;
}
