import { LoanDetailsDB, CreateLoanDetailsRequest } from '@/types';
import { storageService } from './StorageService';

/**
 * LoanDetailsService - Handles all operations related to loan details
 * Automatically uses IndexedDB (offline) or Supabase (authenticated)
 */

interface ApiResponse<T> {
    message: string;
    data?: T;
    error?: string;
    details?: string;
    isUpdate?: boolean;
}

class LoanDetailsService {
    /**
     * Fetch loan details for the current user
     */
    async fetchLoanDetails(): Promise<LoanDetailsDB | null> {
        try {
            const loanDetails = await storageService.getLoanDetails();
            return loanDetails;
        } catch (error) {
            console.error('[LoanDetailsService] Error fetching loan details:', error);
            throw error;
        }
    }

    /**
     * Fetch a specific loan by ID
     */
    async fetchLoanById(id: string): Promise<LoanDetailsDB | null> {
        try {
            const loanDetails = await storageService.getLoanDetails(id);
            return loanDetails;
        } catch (error) {
            console.error('[LoanDetailsService] Error fetching loan by ID:', error);
            throw error;
        }
    }

    /**
     * Create or update loan details
     */
    async saveLoanDetails(loanData: CreateLoanDetailsRequest & { id?: string }): Promise<{
        data: LoanDetailsDB;
        isUpdate: boolean;
    }> {
        try {
            const isUpdate = !!loanData.id;
            const saved = await storageService.saveLoanDetails(loanData);

            return {
                data: saved,
                isUpdate,
            };
        } catch (error) {
            console.error('[LoanDetailsService] Error saving loan details:', error);
            throw error;
        }
    }

    /**
     * Delete loan details by ID
     */
    async deleteLoanDetails(id: string): Promise<void> {
        try {
            await storageService.deleteLoanDetails(id);
        } catch (error) {
            console.error('[LoanDetailsService] Error deleting loan details:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const loanDetailsService = new LoanDetailsService();
