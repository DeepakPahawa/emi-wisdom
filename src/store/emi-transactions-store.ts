import { create } from 'zustand';
import { EmiTransaction, CreateEmiTransactionRequest } from '@/types';
import { emiTransactionsService } from '@/services';

interface EmiTransactionsStore {
    // Transactions for the current loan
    transactions: EmiTransaction[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Error state
    error: string | null;

    // Storage mode
    isUsingLocalStorage: boolean;

    // Actions
    setTransactions: (transactions: EmiTransaction[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    setIsUsingLocalStorage: (isLocal: boolean) => void;

    // API actions
    fetchTransactionsByLoanId: (loanId: string, isAuthenticated: boolean) => Promise<void>;
    clearTransactions: () => void;

    // Transaction CRUD operations
    saveTransaction: (transaction: CreateEmiTransactionRequest & { id?: string }) => Promise<{ data: EmiTransaction; isUpdate: boolean }>;
    deleteTransaction: (id: string) => Promise<void>;
    batchSaveTransactions: (loanId: string, transactions: CreateEmiTransactionRequest[]) => Promise<{ count: number; inserted: number; updated: number }>;
    deleteTransactionsFromMonth: (loanId: string, transactionType: 'emi' | 'part_payment', fromMonth: number) => Promise<number>;
}

export const useEmiTransactionsStore = create<EmiTransactionsStore>((set, get) => ({
    transactions: [],
    isLoading: false,
    isSaving: false,
    error: null,
    isUsingLocalStorage: false,

    setTransactions: (transactions) => set({ transactions }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    setIsSaving: (saving) => set({ isSaving: saving }),

    setError: (error) => set({ error }),

    setIsUsingLocalStorage: (isLocal) => set({ isUsingLocalStorage: isLocal }),

    clearTransactions: () => set({ transactions: [] }),

    fetchTransactionsByLoanId: async (loanId: string, isAuthenticated: boolean) => {
        set({ isLoading: true, error: null });

        try {
            // Use emiTransactionsService which automatically routes to IndexedDB or Supabase
            const transactions = await emiTransactionsService.fetchTransactionsByLoanId(loanId);
            set({ transactions, isUsingLocalStorage: !isAuthenticated });
        } catch (error) {
            console.error('Error fetching EMI transactions:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch transactions',
                transactions: []
            });
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Save a single transaction
     */
    saveTransaction: async (transaction) => {
        set({ isSaving: true, error: null });

        try {
            const result = await emiTransactionsService.saveTransaction(transaction);

            // Update local state
            const currentTransactions = get().transactions;
            if (result.isUpdate) {
                // Update existing transaction
                set({
                    transactions: currentTransactions.map(t =>
                        t.id === result.data.id ? result.data : t
                    )
                });
            } else {
                // Add new transaction
                set({
                    transactions: [...currentTransactions, result.data]
                });
            }

            return result;
        } catch (error) {
            console.error('Error saving transaction:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to save transaction'
            });
            throw error;
        } finally {
            set({ isSaving: false });
        }
    },

    /**
     * Delete a single transaction
     */
    deleteTransaction: async (id) => {
        set({ isSaving: true, error: null });

        try {
            await emiTransactionsService.deleteTransaction(id);

            // Update local state
            const currentTransactions = get().transactions;
            set({
                transactions: currentTransactions.filter(t => t.id !== id)
            });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete transaction'
            });
            throw error;
        } finally {
            set({ isSaving: false });
        }
    },

    /**
     * Batch save transactions
     */
    batchSaveTransactions: async (loanId, transactions) => {
        set({ isSaving: true, error: null });

        try {
            const result = await emiTransactionsService.batchSaveTransactions(loanId, transactions);

            // Refresh transactions from server/storage
            await get().fetchTransactionsByLoanId(loanId, true);

            return result;
        } catch (error) {
            console.error('Error batch saving transactions:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to batch save transactions'
            });
            throw error;
        } finally {
            set({ isSaving: false });
        }
    },

    /**
     * Delete transactions from a specific month onwards
     */
    deleteTransactionsFromMonth: async (loanId, transactionType, fromMonth) => {
        set({ isSaving: true, error: null });

        try {
            const deletedCount = await emiTransactionsService.deleteTransactionsFromMonth(
                loanId,
                transactionType,
                fromMonth
            );

            // Update local state
            const currentTransactions = get().transactions;
            set({
                transactions: currentTransactions.filter(
                    t => !(t.month_number >= fromMonth && t.transaction_type === transactionType)
                )
            });

            return deletedCount;
        } catch (error) {
            console.error('Error deleting transactions from month:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete transactions'
            });
            throw error;
        } finally {
            set({ isSaving: false });
        }
    },
}));

