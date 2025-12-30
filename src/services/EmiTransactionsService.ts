import { EmiTransaction, CreateEmiTransactionRequest, IndexedDBEmiTransaction } from '@/types';
import { storageService } from './StorageService';

/**
 * EmiTransactionsService - Handles all operations related to EMI transactions
 * Automatically uses IndexedDB (offline) or Supabase (authenticated)
 */

interface ApiResponse<T> {
    message: string;
    data?: T;
    error?: string;
    details?: string;
    isUpdate?: boolean;
    count?: number;
    inserted?: number;
    updated?: number;
}

class EmiTransactionsService {
    /**
     * Fetch all transactions for a specific loan
     */
    async fetchTransactionsByLoanId(loanId: string): Promise<EmiTransaction[]> {
        try {
            const transactions = await storageService.getEmiTransactions(loanId);

            // Convert IndexedDB format to EmiTransaction format
            return transactions.map(t => ({
                id: t.id,
                user_id: t.user_id || undefined,
                loan_id: t.loan_id,
                month_number: t.month_number,
                emi_date: t.emi_date,
                transaction_type: t.transaction_type,
                amount_paid: t.amount_paid,
                principal_component: t.principal_component,
                interest_component: t.interest_component,
                created_at: t.created_at,
                updated_at: t.updated_at,
            }));
        } catch (error) {
            console.error('[EmiTransactionsService] Error fetching transactions:', error);
            throw error;
        }
    }

    /**
     * Fetch transactions by month number
     */
    async fetchTransactionsByMonth(loanId: string, monthNumber: number): Promise<EmiTransaction[]> {
        try {
            const allTransactions = await this.fetchTransactionsByLoanId(loanId);
            return allTransactions.filter(t => t.month_number === monthNumber);
        } catch (error) {
            console.error('[EmiTransactionsService] Error fetching transactions by month:', error);
            throw error;
        }
    }

    /**
     * Create or update a single transaction
     */
    async saveTransaction(transaction: CreateEmiTransactionRequest & { id?: string }): Promise<{
        data: EmiTransaction;
        isUpdate: boolean;
    }> {
        try {
            const isUpdate = !!transaction.id;

            // Get existing transactions
            const existingTransactions = await storageService.getEmiTransactions(transaction.loan_id);

            // Create the transaction object
            const newTransaction: Partial<IndexedDBEmiTransaction> = {
                id: transaction.id,
                loan_id: transaction.loan_id,
                month_number: transaction.month_number,
                emi_date: transaction.emi_date,
                transaction_type: transaction.transaction_type,
                amount_paid: transaction.amount_paid,
                principal_component: transaction.principal_component,
                interest_component: transaction.interest_component,
            };

            // Update or add the transaction
            let updatedTransactions: Partial<IndexedDBEmiTransaction>[];
            if (isUpdate) {
                updatedTransactions = existingTransactions.map(t =>
                    t.id === transaction.id ? { ...t, ...newTransaction } : t
                );
            } else {
                updatedTransactions = [...existingTransactions, newTransaction];
            }

            // Save all transactions
            await storageService.saveEmiTransactions(transaction.loan_id, updatedTransactions);

            return {
                data: newTransaction as EmiTransaction,
                isUpdate,
            };
        } catch (error) {
            console.error('[EmiTransactionsService] Error saving transaction:', error);
            throw error;
        }
    }

    /**
     * Batch create/update multiple transactions
     */
    async batchSaveTransactions(loanId: string, transactions: CreateEmiTransactionRequest[]): Promise<{
        count: number;
        inserted: number;
        updated: number;
    }> {
        try {
            const indexedTransactions: Partial<IndexedDBEmiTransaction>[] = transactions.map(t => ({
                loan_id: loanId,
                month_number: t.month_number,
                emi_date: t.emi_date,
                transaction_type: t.transaction_type,
                amount_paid: t.amount_paid,
                principal_component: t.principal_component,
                interest_component: t.interest_component,
            }));

            await storageService.saveEmiTransactions(loanId, indexedTransactions);

            return {
                count: transactions.length,
                inserted: transactions.length,
                updated: 0,
            };
        } catch (error) {
            console.error('[EmiTransactionsService] Error batch saving transactions:', error);
            throw error;
        }
    }

    /**
     * Update a transaction by ID
     */
    async updateTransaction(id: string, updateData: Partial<EmiTransaction>): Promise<EmiTransaction> {
        try {
            await storageService.updateEmiTransaction(id, updateData as Partial<IndexedDBEmiTransaction>);

            // Return the updated transaction (we'd need to fetch it)
            // For now, return the update data with the id
            return { id, ...updateData } as EmiTransaction;
        } catch (error) {
            console.error('[EmiTransactionsService] Error updating transaction:', error);
            throw error;
        }
    }

    /**
     * Delete transactions for a loan
     */
    async deleteTransactions(loanId: string): Promise<void> {
        try {
            await storageService.deleteEmiTransactions(loanId);
        } catch (error) {
            console.error('[EmiTransactionsService] Error deleting transactions:', error);
            throw error;
        }
    }

    /**
     * Delete transactions from a specific month onwards
     */
    async deleteTransactionsFromMonth(
        loanId: string,
        transactionType: 'emi' | 'part_payment',
        fromMonth: number
    ): Promise<number> {
        try {
            const allTransactions = await storageService.getEmiTransactions(loanId);

            // Filter out transactions from the specified month onwards with the specified type
            const remainingTransactions = allTransactions.filter(
                t => !(t.month_number >= fromMonth && t.transaction_type === transactionType)
            );

            const deletedCount = allTransactions.length - remainingTransactions.length;

            // Save the remaining transactions
            await storageService.saveEmiTransactions(loanId, remainingTransactions);

            return deletedCount;
        } catch (error) {
            console.error('[EmiTransactionsService] Error deleting transactions from month:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const emiTransactionsService = new EmiTransactionsService();
