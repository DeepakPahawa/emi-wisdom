import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanDetailsDB } from '@/types';
import { loanDetailsService, localStorageService } from '@/services';

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

    // Storage mode
    isUsingLocalStorage: boolean;

    // Actions
    setCurrentLoan: (loan: LoanDetailsDB | null) => void;
    setLoans: (loans: LoanDetailsDB[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    setIsUsingLocalStorage: (isLocal: boolean) => void;

    // API actions
    fetchLoanDetails: (isAuthenticated: boolean) => Promise<void>;
    saveLoanDetails: (loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'>, isAuthenticated: boolean) => Promise<boolean>;
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
            isUsingLocalStorage: false,

            setCurrentLoan: (loan) => set({ currentLoan: loan }),

            setLoans: (loans) => set({ loans }),

            setIsLoading: (loading) => set({ isLoading: loading }),

            setIsSaving: (saving) => set({ isSaving: saving }),

            setError: (error) => set({ error }),

            setIsUsingLocalStorage: (isLocal) => set({ isUsingLocalStorage: isLocal }),

            clearCurrentLoan: () => set({ currentLoan: null }),

            fetchLoanDetails: async (isAuthenticated: boolean) => {
                set({ isLoading: true, error: null });

                try {
                    if (isAuthenticated) {
                        // Use Supabase API via service
                        set({ isUsingLocalStorage: false });
                        console.log('[LoanDetailsStore] Fetching loan details from API, isAuthenticated:', isAuthenticated);

                        const loans = await loanDetailsService.fetchLoanDetails();

                        console.log('[LoanDetailsStore] API response:', {
                            hasData: !!loans,
                            dataLength: loans?.length,
                        });

                        if (loans && loans.length > 0) {
                            // Set all loans
                            set({ loans });

                            // Set the most recent loan as current
                            set({ currentLoan: loans[0] });
                        } else {
                            set({ loans: [], currentLoan: null });
                        }
                    } else {
                        // Use LocalStorage - no API call needed
                        set({ isUsingLocalStorage: true });
                        const loans = await localStorageService.getLoanDetails();

                        if (loans.length > 0) {
                            set({ loans });
                            set({ currentLoan: loans[0] });
                        } else {
                            set({ loans: [], currentLoan: null });
                        }
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

            saveLoanDetails: async (loanData, isAuthenticated: boolean) => {
                set({ isSaving: true, error: null });

                try {
                    if (isAuthenticated) {
                        // Use Supabase API via service
                        set({ isUsingLocalStorage: false });
                        const result = await loanDetailsService.saveLoanDetails(loanData);

                        // Update current loan with the saved data
                        set({ currentLoan: result.data });

                        // Refresh the loans list
                        await get().fetchLoanDetails(isAuthenticated);

                        return true;
                    } else {
                        // Use LocalStorage
                        set({ isUsingLocalStorage: true });
                        const savedLoan = await localStorageService.saveLoanDetails(loanData);

                        // Update current loan with the saved data
                        set({ currentLoan: savedLoan });

                        // Refresh the loans list
                        await get().fetchLoanDetails(isAuthenticated);

                        return true;
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
