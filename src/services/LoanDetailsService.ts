import { LoanDetailsDB, CreateLoanDetailsRequest } from '@/types';

/**
 * LoanDetailsService - Handles all API calls related to loan details
 * This service acts as an intermediary between components/stores and the API routes
 */

interface ApiResponse<T> {
    message: string;
    data?: T;
    error?: string;
    details?: string;
    isUpdate?: boolean;
}

class LoanDetailsService {
    private readonly baseUrl = '/api/loan-details';

    /**
     * Fetch all loan details for the authenticated user
     */
    async fetchLoanDetails(): Promise<LoanDetailsDB[]> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<LoanDetailsDB[]> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.data || [];
        } catch (error) {
            console.error('[LoanDetailsService] Error fetching loan details:', error);
            throw error;
        }
    }

    /**
     * Fetch a specific loan by loan number
     */
    async fetchLoanByNumber(loanNumber: string): Promise<LoanDetailsDB | null> {
        try {
            const response = await fetch(`${this.baseUrl}?loan_number=${encodeURIComponent(loanNumber)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<LoanDetailsDB[]> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.data && result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            console.error('[LoanDetailsService] Error fetching loan by number:', error);
            throw error;
        }
    }

    /**
     * Fetch a specific loan by ID
     */
    async fetchLoanById(id: string): Promise<LoanDetailsDB | null> {
        try {
            const response = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: ApiResponse<LoanDetailsDB[]> = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            return result.data && result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            console.error('[LoanDetailsService] Error fetching loan by ID:', error);
            throw error;
        }
    }

    /**
     * Create or update loan details
     */
    async saveLoanDetails(loanData: CreateLoanDetailsRequest): Promise<{
        data: LoanDetailsDB;
        isUpdate: boolean;
    }> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loanData),
            });

            const result: ApiResponse<LoanDetailsDB> = await response.json();

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
            console.error('[LoanDetailsService] Error saving loan details:', error);
            throw error;
        }
    }

    /**
     * Delete loan details by ID
     */
    async deleteLoanDetails(id: string): Promise<void> {
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
            console.error('[LoanDetailsService] Error deleting loan details:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const loanDetailsService = new LoanDetailsService();
