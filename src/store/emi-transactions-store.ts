import { create } from 'zustand';
import { EmiTransaction } from '@/types';
import { localStorageService } from '@/services/LocalStorageService';

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
}

export const useEmiTransactionsStore = create<EmiTransactionsStore>((set) => ({
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
            if (isAuthenticated) {
                // Use Supabase API
                set({ isUsingLocalStorage: false });
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
            } else {
                // Use LocalStorage - no API call needed
                set({ isUsingLocalStorage: true });
                const transactions = await localStorageService.getTransactionsByLoanId(loanId);
                set({ transactions });
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

