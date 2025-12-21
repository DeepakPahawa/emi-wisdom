import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanDetailsDB } from '@/types';

interface LoanDetailsStore {
    // Current loan details from database
    currentLoan: LoanDetailsDB | null;

    // All loans (for future multi-loan support)
    loans: LoanDetailsDB[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Error state
    error: string | null;

    // Actions
    setCurrentLoan: (loan: LoanDetailsDB | null) => void;
    setLoans: (loans: LoanDetailsDB[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;

    // API actions
    fetchLoanDetails: () => Promise<void>;
    saveLoanDetails: (loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
    clearCurrentLoan: () => void;
}

export const useLoanDetailsStore = create<LoanDetailsStore>()(
    persist(
        (set, get) => ({
            currentLoan: null,
            loans: [],
            isLoading: false,
            isSaving: false,
            error: null,

            setCurrentLoan: (loan) => set({ currentLoan: loan }),

            setLoans: (loans) => set({ loans }),

            setIsLoading: (loading) => set({ isLoading: loading }),

            setIsSaving: (saving) => set({ isSaving: saving }),

            setError: (error) => set({ error }),

            clearCurrentLoan: () => set({ currentLoan: null }),

            fetchLoanDetails: async () => {
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch('/api/loan-details');
                    const result = await response.json();

                    if (response.ok && result.data && result.data.length > 0) {
                        // Set all loans
                        set({ loans: result.data });

                        // Set the most recent loan as current
                        set({ currentLoan: result.data[0] });
                    } else {
                        set({ loans: [], currentLoan: null });
                    }
                } catch (error) {
                    console.error('Error fetching loan details:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch loan details',
                        loans: [],
                        currentLoan: null
                    });
                } finally {
                    set({ isLoading: false });
                }
            },

            saveLoanDetails: async (loanData) => {
                set({ isSaving: true, error: null });

                try {
                    const response = await fetch('/api/loan-details', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(loanData),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // Update current loan with the saved data
                        set({ currentLoan: result.data });

                        // Refresh the loans list
                        await get().fetchLoanDetails();

                        return true;
                    } else {
                        set({ error: result.error || 'Failed to save loan details' });
                        return false;
                    }
                } catch (error) {
                    console.error('Error saving loan details:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save loan details'
                    });
                    return false;
                } finally {
                    set({ isSaving: false });
                }
            },
        }),
        {
            name: 'loan-details-storage', // unique name for localStorage
            partialize: (state) => ({
                // Only persist currentLoan, not loading states or errors
                currentLoan: state.currentLoan,
            }),
        }
    )
);
