import { EmiTransaction, CreateEmiTransactionRequest } from '@/types';

/**
 * EmiTransactionsService - Handles all API calls related to EMI transactions
 * This service acts as an intermediary between components/stores and the API routes
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
    private readonly baseUrl = '/api/emi-transactions';

    /**
     * Fetch all transactions for a specific loan
     */
    async fetchTransactionsByLoanId(loanId: string): Promise<EmiTransaction[]> {
        try {
            const response = await fetch(`${this.baseUrl}?loan_id=${encodeURIComponent(loanId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<EmiTransaction[]> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.data || [];
        } catch (error) {
            console.error('[EmiTransactionsService] Error fetching transactions:', error);
            throw error;
        }
    }

    /**
     * Fetch transactions by month number
     */
    async fetchTransactionsByMonth(monthNumber: number): Promise<EmiTransaction[]> {
        try {
            const response = await fetch(`${this.baseUrl}?month_number=${monthNumber}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<EmiTransaction[]> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.data || [];
        } catch (error) {
            console.error('[EmiTransactionsService] Error fetching transactions by month:', error);
            throw error;
        }
    }

    /**
     * Create or update a single transaction
     */
    async saveTransaction(transaction: CreateEmiTransactionRequest): Promise<{
        data: EmiTransaction;
        isUpdate: boolean;
    }> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction),
            });

            const result: ApiResponse<EmiTransaction> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            if (!result.data) {
                throw new Error('No data returned from server');
            }

            return {
                data: result.data,
                isUpdate: result.isUpdate || false,
            };
        } catch (error) {
            console.error('[EmiTransactionsService] Error saving transaction:', error);
            throw error;
        }
    }

    /**
     * Batch create/update multiple transactions
     */
    async batchSaveTransactions(transactions: CreateEmiTransactionRequest[]): Promise<{
        count: number;
        inserted: number;
        updated: number;
    }> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactions }),
            });

            const result: ApiResponse<void> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return {
                count: result.count || 0,
                inserted: result.inserted || 0,
                updated: result.updated || 0,
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
            const response = await fetch(this.baseUrl, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, ...updateData }),
            });

            const result: ApiResponse<EmiTransaction> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            if (!result.data) {
                throw new Error('No data returned from server');
            }

            return result.data;
        } catch (error) {
            console.error('[EmiTransactionsService] Error updating transaction:', error);
            throw error;
        }
    }

    /**
     * Delete a single transaction by ID
     */
    async deleteTransaction(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<void> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('[EmiTransactionsService] Error deleting transaction:', error);
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
            const params = new URLSearchParams({
                loan_id: loanId,
                transaction_type: transactionType,
                from_month: fromMonth.toString(),
            });

            const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<void> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.count || 0;
        } catch (error) {
            console.error('[EmiTransactionsService] Error deleting transactions from month:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const emiTransactionsService = new EmiTransactionsService();
