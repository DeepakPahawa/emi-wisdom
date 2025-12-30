/**
 * Unified Storage Service
 * Automatically routes operations to IndexedDB (offline) or Supabase (authenticated)
 */

import { supabase } from '@/lib/supabaseClient';
import { indexedDBService } from './IndexedDBService';
import {
    LoanDetailsDB,
    IndexedDBLoanDetails,
    IndexedDBEmiTransaction,
    StorageBackend,
    SyncResult
} from '@/types';
import { getCurrentTimestamp, isMoreRecent } from '@/lib/storage-utils';

class StorageService {
    private currentBackend: StorageBackend = 'indexeddb';

    /**
     * Initialize the storage service
     */
    async init(): Promise<void> {
        try {
            await indexedDBService.init();
            await this.detectBackend();
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            this.currentBackend = 'memory';
        }
    }

    /**
     * Detect which storage backend to use based on auth state
     */
    private async detectBackend(): Promise<StorageBackend> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            this.currentBackend = session ? 'supabase' : 'indexeddb';
            return this.currentBackend;
        } catch (error) {
            console.error('Failed to detect backend:', error);
            this.currentBackend = 'indexeddb';
            return 'indexeddb';
        }
    }

    /**
     * Get current storage backend
     */
    async getBackend(): Promise<StorageBackend> {
        return this.detectBackend();
    }

    /**
     * Check if user is authenticated
     */
    private async isAuthenticated(): Promise<boolean> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return !!session;
        } catch {
            return false;
        }
    }

    // ==================== LOAN DETAILS OPERATIONS ====================

    /**
     * Save loan details to appropriate storage backend
     */
    async saveLoanDetails(data: Partial<LoanDetailsDB>): Promise<LoanDetailsDB> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();

            const loanData = {
                ...data,
                user_id: user?.id,
                updated_at: getCurrentTimestamp(),
            };

            if (data.id) {
                // Update existing
                const { data: updated, error } = await supabase
                    .from('loan_details')
                    .update(loanData)
                    .eq('id', data.id)
                    .select()
                    .single();

                if (error) throw error;
                return updated;
            } else {
                // Create new
                const { data: created, error } = await supabase
                    .from('loan_details')
                    .insert([{ ...loanData, created_at: getCurrentTimestamp() }])
                    .select()
                    .single();

                if (error) throw error;
                return created;
            }
        } else {
            // Save to IndexedDB
            const indexedData: Partial<IndexedDBLoanDetails> = {
                id: data.id,
                user_id: null,
                loan_number: data.loan_number || '',
                principal_amount: data.principal_amount || 0,
                original_interest_rate: data.original_interest_rate || 0,
                current_interest_rate: data.current_interest_rate || 0,
                emi_start_date: data.emi_start_date || '',
                loan_tenure_months: data.loan_tenure_months || 0,
                bank_name: data.bank_name || '',
                loan_label: data.loan_label || 'Other',
            };

            const saved = await indexedDBService.saveLoanDetails(indexedData);
            return saved as unknown as LoanDetailsDB;
        }
    }

    /**
     * Get loan details from appropriate storage backend
     */
    async getLoanDetails(id?: string): Promise<LoanDetailsDB | null> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            // Get from Supabase
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase
                .from('loan_details')
                .select('*')
                .eq('user_id', user?.id);

            if (id) {
                query = query.eq('id', id);
            }

            const { data, error } = await query.single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            return data;
        } else {
            // Get from IndexedDB
            const data = await indexedDBService.getLoanDetails(id);
            return data as unknown as LoanDetailsDB;
        }
    }

    /**
     * Update loan details
     */
    async updateLoanDetails(id: string, data: Partial<LoanDetailsDB>): Promise<LoanDetailsDB> {
        return this.saveLoanDetails({ ...data, id });
    }

    /**
     * Delete loan details
     */
    async deleteLoanDetails(id: string): Promise<void> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            const { error } = await supabase
                .from('loan_details')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } else {
            await indexedDBService.deleteLoanDetails(id);
        }
    }

    // ==================== EMI TRANSACTIONS OPERATIONS ====================

    /**
     * Save EMI transactions
     */
    async saveEmiTransactions(loanId: string, transactions: Partial<IndexedDBEmiTransaction>[]): Promise<void> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();

            const supabaseTransactions = transactions.map(t => ({
                loan_id: loanId,
                user_id: user?.id,
                month_number: t.month_number,
                emi_date: t.emi_date,
                transaction_type: t.transaction_type || 'emi',
                amount_paid: t.amount_paid || 0,
                principal_component: t.principal_component || 0,
                interest_component: t.interest_component || 0,
                created_at: t.created_at || getCurrentTimestamp(),
                updated_at: getCurrentTimestamp(),
            }));

            // Delete existing transactions for this loan
            await supabase
                .from('emi_transactions')
                .delete()
                .eq('loan_id', loanId);

            // Insert new transactions
            const { error } = await supabase
                .from('emi_transactions')
                .insert(supabaseTransactions);

            if (error) throw error;
        } else {
            // Save to IndexedDB
            const indexedTransactions = transactions.map(t => ({
                ...t,
                loan_id: loanId,
                user_id: null,
            }));

            // Delete existing transactions for this loan
            await indexedDBService.deleteEmiTransactions(loanId);

            // Save new transactions
            await indexedDBService.saveEmiTransactions(indexedTransactions);
        }
    }

    /**
     * Get EMI transactions for a loan
     */
    async getEmiTransactions(loanId: string): Promise<IndexedDBEmiTransaction[]> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            // Get from Supabase
            const { data, error } = await supabase
                .from('emi_transactions')
                .select('*')
                .eq('loan_id', loanId)
                .order('month_number', { ascending: true });

            if (error) throw error;
            return data as unknown as IndexedDBEmiTransaction[];
        } else {
            // Get from IndexedDB
            return indexedDBService.getEmiTransactions(loanId);
        }
    }

    /**
     * Update a single EMI transaction
     */
    async updateEmiTransaction(id: string, data: Partial<IndexedDBEmiTransaction>): Promise<void> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            const { error } = await supabase
                .from('emi_transactions')
                .update({
                    ...data,
                    updated_at: getCurrentTimestamp(),
                })
                .eq('id', id);

            if (error) throw error;
        } else {
            await indexedDBService.updateEmiTransaction(id, data);
        }
    }

    /**
     * Delete EMI transactions for a loan
     */
    async deleteEmiTransactions(loanId: string): Promise<void> {
        const isAuth = await this.isAuthenticated();

        if (isAuth) {
            const { error } = await supabase
                .from('emi_transactions')
                .delete()
                .eq('loan_id', loanId);

            if (error) throw error;
        } else {
            await indexedDBService.deleteEmiTransactions(loanId);
        }
    }

    // ==================== SYNC OPERATIONS ====================

    /**
     * Sync data from IndexedDB to Supabase (called on sign-in)
     * Uses smart merge strategy: keep most recent data based on timestamps
     */
    async syncToSupabase(): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            recordsSynced: 0,
            errors: [],
        };

        try {
            const isAuth = await this.isAuthenticated();
            if (!isAuth) {
                result.errors.push('User not authenticated');
                return result;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                result.errors.push('User not found');
                return result;
            }

            // Get data from IndexedDB
            const localLoanDetails = await indexedDBService.getAllLoanDetails();
            const localTransactions = await indexedDBService.getAllEmiTransactions();

            // Sync loan details with smart merge
            for (const localLoan of localLoanDetails) {
                try {
                    // Check if loan exists in Supabase
                    const { data: remoteLoan } = await supabase
                        .from('loan_details')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (remoteLoan) {
                        // Smart merge: keep most recent
                        if (isMoreRecent(localLoan.updated_at, remoteLoan.updated_at)) {
                            // Local is more recent, update Supabase
                            const { error } = await supabase
                                .from('loan_details')
                                .update({
                                    loan_number: localLoan.loan_number,
                                    principal_amount: localLoan.principal_amount,
                                    original_interest_rate: localLoan.original_interest_rate,
                                    current_interest_rate: localLoan.current_interest_rate,
                                    emi_start_date: localLoan.emi_start_date,
                                    loan_tenure_months: localLoan.loan_tenure_months,
                                    bank_name: localLoan.bank_name,
                                    loan_label: localLoan.loan_label,
                                    updated_at: localLoan.updated_at,
                                })
                                .eq('id', remoteLoan.id);

                            if (error) {
                                result.errors.push(`Failed to update loan: ${error.message}`);
                            } else {
                                result.recordsSynced++;
                            }
                        }
                        // If remote is more recent, keep it (do nothing)
                    } else {
                        // No remote loan, create new
                        const { error } = await supabase
                            .from('loan_details')
                            .insert([{
                                user_id: user.id,
                                loan_number: localLoan.loan_number,
                                principal_amount: localLoan.principal_amount,
                                original_interest_rate: localLoan.original_interest_rate,
                                current_interest_rate: localLoan.current_interest_rate,
                                emi_start_date: localLoan.emi_start_date,
                                loan_tenure_months: localLoan.loan_tenure_months,
                                bank_name: localLoan.bank_name,
                                loan_label: localLoan.loan_label,
                                created_at: localLoan.created_at,
                                updated_at: localLoan.updated_at,
                            }]);

                        if (error) {
                            result.errors.push(`Failed to create loan: ${error.message}`);
                        } else {
                            result.recordsSynced++;
                        }
                    }
                } catch (error: any) {
                    result.errors.push(`Error syncing loan: ${error.message}`);
                }
            }

            // Sync EMI transactions
            if (localTransactions.length > 0) {
                try {
                    // Get the loan_id from Supabase (it might be different from IndexedDB)
                    const { data: remoteLoan } = await supabase
                        .from('loan_details')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();

                    if (remoteLoan) {
                        const supabaseTransactions = localTransactions.map(t => ({
                            loan_id: remoteLoan.id,
                            user_id: user.id,
                            month_number: t.month_number,
                            emi_date: t.emi_date,
                            transaction_type: t.transaction_type,
                            amount_paid: t.amount_paid,
                            principal_component: t.principal_component,
                            interest_component: t.interest_component,
                            created_at: t.created_at,
                            updated_at: t.updated_at,
                        }));

                        // Delete existing transactions
                        await supabase
                            .from('emi_transactions')
                            .delete()
                            .eq('loan_id', remoteLoan.id);

                        // Insert synced transactions
                        const { error } = await supabase
                            .from('emi_transactions')
                            .insert(supabaseTransactions);

                        if (error) {
                            result.errors.push(`Failed to sync transactions: ${error.message}`);
                        } else {
                            result.recordsSynced += localTransactions.length;
                        }
                    }
                } catch (error: any) {
                    result.errors.push(`Error syncing transactions: ${error.message}`);
                }
            }

            result.success = result.errors.length === 0;
            return result;
        } catch (error: any) {
            result.errors.push(`Sync failed: ${error.message}`);
            return result;
        }
    }

    /**
     * Clear local IndexedDB storage
     */
    async clearLocalStorage(): Promise<void> {
        await indexedDBService.clearAll();
    }
}

// Export singleton instance
export const storageService = new StorageService();
