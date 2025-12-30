import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanDetailsDB, StorageBackend } from '@/types';
import { loanDetailsService } from '@/services';
import { storageService } from '@/services/StorageService';

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

    // Storage backend
    storageBackend: StorageBackend;

    // Sync state
    isSyncing: boolean;
    lastSyncedAt: string | null;

    // Actions
    setCurrentLoan: (loan: LoanDetailsDB | null) => void;
    setLoans: (loans: LoanDetailsDB[]) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    setStorageBackend: (backend: StorageBackend) => void;
    setIsSyncing: (syncing: boolean) => void;
    setLastSyncedAt: (timestamp: string | null) => void;

    // API actions (no longer need isAuthenticated param - handled by StorageService)
    fetchLoanDetails: () => Promise<void>;
    saveLoanDetails: (loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<boolean>;
    clearCurrentLoan: () => void;
    syncToSupabase: () => Promise<void>;
}

export const useLoanDetailsStore = create<LoanDetailsStore>()(
    persist(
        (set, get) => ({
            currentLoan: null,
            loans: [],
            isLoading: false,
            isSaving: false,
            error: null,
            storageBackend: 'indexeddb',
            isSyncing: false,
            lastSyncedAt: null,

            setCurrentLoan: (loan) => set({ currentLoan: loan }),

            setLoans: (loans) => set({ loans }),

            setIsLoading: (loading) => set({ isLoading: loading }),

            setIsSaving: (saving) => set({ isSaving: saving }),

            setError: (error) => set({ error }),

            setStorageBackend: (backend) => set({ storageBackend: backend }),

            setIsSyncing: (syncing) => set({ isSyncing: syncing }),

            setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),

            clearCurrentLoan: () => set({ currentLoan: null }),

            fetchLoanDetails: async () => {
                set({ isLoading: true, error: null });

                try {
                    // Detect and set current backend
                    const backend = await storageService.getBackend();
                    set({ storageBackend: backend });

                    console.log('[LoanDetailsStore] Fetching loan details, backend:', backend);

                    const loan = await loanDetailsService.fetchLoanDetails();

                    console.log('[LoanDetailsStore] Fetched loan:', {
                        hasData: !!loan,
                    });

                    if (loan) {
                        set({ currentLoan: loan, loans: [loan] });
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
                    // Detect and set current backend
                    const backend = await storageService.getBackend();
                    set({ storageBackend: backend });

                    console.log('[LoanDetailsStore] Saving loan details, backend:', backend);

                    const result = await loanDetailsService.saveLoanDetails(loanData);

                    // Update current loan with the saved data
                    set({ currentLoan: result.data });

                    // Refresh the loans list
                    await get().fetchLoanDetails();

                    return true;
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

            syncToSupabase: async () => {
                set({ isSyncing: true, error: null });

                try {
                    const result = await storageService.syncToSupabase();

                    if (result.success) {
                        set({ lastSyncedAt: new Date().toISOString() });

                        // Refresh loan details after sync
                        await get().fetchLoanDetails();
                    } else {
                        set({ error: result.errors.join(', ') });
                    }
                } catch (error) {
                    console.error('Error syncing to Supabase:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to sync to Supabase'
                    });
                } finally {
                    set({ isSyncing: false });
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
