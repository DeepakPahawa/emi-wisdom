import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanDetailsDB, LoanDetails } from '@/types';
import { indexedDBService } from '@/services/IndexedDBService';

interface LoanDetailsStore {
    // Current loan details from IndexedDB (source of truth)
    currentLoan: LoanDetailsDB | null;

    // All loans (for future multi-loan support)
    loans: LoanDetailsDB[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Error state
    error: string | null;

    // Derived getters
    getLoanConfig: () => LoanDetails;

    // Actions
    setCurrentLoan: (loan: LoanDetailsDB | null) => void;
    setLoans: (loans: LoanDetailsDB[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;

    // Update loan configuration (principal, rate, tenure)
    updateLoanConfig: (config: { principal: number; rate: number; durationMonths: number }) => Promise<boolean>;

    // IndexedDB actions
    fetchLoanDetails: () => Promise<void>;
    saveLoanDetails: (loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<boolean>;
    clearCurrentLoan: () => void;
}

// Default loan configuration
const DEFAULT_LOAN_CONFIG: LoanDetails = {
    principal: 5000000,
    rate: 7.5,
    durationMonths: 240,
    startDate: new Date(),
};

export const useLoanDetailsStore = create<LoanDetailsStore>()(
    persist(
        (set, get) => ({
            currentLoan: null,
            loans: [],
            isLoading: false,
            isSaving: false,
            error: null,

            // Derive LoanDetails from currentLoan or use defaults
            getLoanConfig: () => {
                const { currentLoan } = get();

                if (currentLoan) {
                    return {
                        principal: currentLoan.principal_amount,
                        rate: currentLoan.current_interest_rate,
                        durationMonths: currentLoan.loan_tenure_months,
                        startDate: new Date(currentLoan.emi_start_date),
                    };
                }

                return DEFAULT_LOAN_CONFIG;
            },

            setCurrentLoan: (loan) => set({ currentLoan: loan }),

            setLoans: (loans) => set({ loans }),

            setIsLoading: (loading) => set({ isLoading: loading }),

            setIsSaving: (saving) => set({ isSaving: saving }),

            setError: (error) => set({ error }),

            clearCurrentLoan: () => set({ currentLoan: null }),

            // Update just the loan configuration (principal, rate, tenure)
            updateLoanConfig: async (config) => {
                const { currentLoan } = get();

                const loanData = {
                    id: currentLoan?.id,
                    user_id: currentLoan?.user_id || null,
                    loan_number: currentLoan?.loan_number || '',
                    principal_amount: config.principal,
                    original_interest_rate: currentLoan?.original_interest_rate || config.rate,
                    current_interest_rate: config.rate,
                    emi_start_date: currentLoan?.emi_start_date || new Date().toISOString().split('T')[0],
                    loan_tenure_months: config.durationMonths,
                    bank_name: currentLoan?.bank_name || '',
                    loan_label: currentLoan?.loan_label || 'Other',
                };

                return get().saveLoanDetails(loanData);
            },

            fetchLoanDetails: async () => {
                set({ isLoading: true, error: null });

                try {
                    console.log('[LoanDetailsStore] Fetching loan details from IndexedDB');

                    const loan = await indexedDBService.getLoanDetails();

                    console.log('[LoanDetailsStore] Fetched loan:', {
                        hasData: !!loan,
                    });

                    if (loan) {
                        set({ currentLoan: loan, loans: [loan] });
                    } else {
                        set({ loans: [], currentLoan: null });
                    }
                } catch (error) {
                    console.error('[LoanDetailsStore] Error fetching loan details:', error);
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
                    console.log('[LoanDetailsStore] Saving loan details to IndexedDB');

                    // Save to IndexedDB
                    const savedLoan = await indexedDBService.saveLoanDetails({
                        id: loanData.id,
                        user_id: loanData.user_id || null,
                        loan_number: loanData.loan_number || '',
                        principal_amount: loanData.principal_amount,
                        original_interest_rate: loanData.original_interest_rate,
                        current_interest_rate: loanData.current_interest_rate,
                        emi_start_date: loanData.emi_start_date,
                        loan_tenure_months: loanData.loan_tenure_months,
                        bank_name: loanData.bank_name || '',
                        loan_label: loanData.loan_label || 'Other',
                    });

                    // Update current loan with the saved data
                    set({ currentLoan: savedLoan, loans: [savedLoan] });

                    console.log('[LoanDetailsStore] Loan details saved successfully');

                    return true;
                } catch (error) {
                    console.error('[LoanDetailsStore] Error saving loan details:', error);
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
