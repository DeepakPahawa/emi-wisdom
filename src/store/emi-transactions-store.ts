import { create } from 'zustand';
import { EmiTransaction } from '@/types';

interface EmiTransactionsStore {
    // Transactions for the current loan
    transactions: EmiTransaction[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Error state
    error: string | null;

    // Actions
    setTransactions: (transactions: EmiTransaction[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;

    // API actions
    fetchTransactionsByLoanId: (loanId: string) => Promise<void>;
    clearTransactions: () => void;
}

export const useEmiTransactionsStore = create<EmiTransactionsStore>((set) => ({
    transactions: [],
    isLoading: false,
    isSaving: false,
    error: null,

    setTransactions: (transactions) => set({ transactions }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    setIsSaving: (saving) => set({ isSaving: saving }),

    setError: (error) => set({ error }),

    clearTransactions: () => set({ transactions: [] }),

    fetchTransactionsByLoanId: async (loanId: string) => {
        set({ isLoading: true, error: null });

        try {
            const response = await fetch(`/api/emi-transactions?loan_id=${loanId}`);
            const result = await response.json();

            if (response.ok && result.data) {
                set({ transactions: result.data });
            } else {
                set({
                    transactions: [],
                    error: result.error || 'Failed to fetch transactions'
                });
            }
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
}));
