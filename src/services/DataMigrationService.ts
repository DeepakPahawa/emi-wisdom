import { localStorageService } from './LocalStorageService';
import { LoanDetailsDB, EmiTransaction } from '@/types';

/**
 * DataMigrationService - Handles migration of local data to Supabase after user login
 */

export class DataMigrationService {
    /**
     * Check if there is local data that needs to be migrated
     */
    static async hasLocalDataToMigrate(): Promise<boolean> {
        return await localStorageService.hasLocalData();
    }

    /**
     * Migrate all local data to Supabase
     * @param userId - The authenticated user's ID
     * @returns Success status and any errors
     */
    static async migrateLocalDataToSupabase(userId: string): Promise<{
        success: boolean;
        error?: string;
        migratedLoans?: number;
        migratedTransactions?: number;
    }> {
        try {
            // Get all local data
            const localLoans = await localStorageService.getLoanDetails();

            if (localLoans.length === 0) {
                return { success: true, migratedLoans: 0, migratedTransactions: 0 };
            }

            let totalMigratedTransactions = 0;

            // Migrate each loan
            for (const loan of localLoans) {
                // Add user_id to loan data
                const loanData = {
                    loan_number: loan.loan_number,
                    principal_amount: loan.principal_amount,
                    original_interest_rate: loan.original_interest_rate,
                    current_interest_rate: loan.current_interest_rate,
                    emi_start_date: loan.emi_start_date,
                    loan_tenure_months: loan.loan_tenure_months,
                    bank_name: loan.bank_name,
                    loan_label: loan.loan_label,
                };

                // Save loan to Supabase
                const loanResponse = await fetch('/api/loan-details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loanData),
                });

                if (!loanResponse.ok) {
                    const error = await loanResponse.json();
                    throw new Error(error.error || 'Failed to migrate loan details');
                }

                const loanResult = await loanResponse.json();
                const newLoanId = loanResult.data.id;

                // Get transactions for this loan (if any)
                if (loan.id) {
                    const transactions = await localStorageService.getTransactionsByLoanId(loan.id);

                    // Migrate transactions
                    for (const transaction of transactions) {
                        const transactionData = {
                            loan_id: newLoanId, // Use the new Supabase loan ID
                            emi_date: transaction.emi_date,
                            month_number: transaction.month_number,
                            transaction_type: transaction.transaction_type,
                            amount_paid: transaction.amount_paid,
                            principal_component: transaction.principal_component,
                            interest_component: transaction.interest_component,
                        };

                        const transactionResponse = await fetch('/api/emi-transactions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(transactionData),
                        });

                        if (transactionResponse.ok) {
                            totalMigratedTransactions++;
                        }
                    }
                }
            }

            // Clear local storage after successful migration
            await localStorageService.clearAllData();

            return {
                success: true,
                migratedLoans: localLoans.length,
                migratedTransactions: totalMigratedTransactions,
            };
        } catch (error) {
            console.error('Error migrating local data:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to migrate data',
            };
        }
    }

    /**
     * Get summary of local data for display to user
     */
    static async getLocalDataSummary(): Promise<{
        loanCount: number;
        transactionCount: number;
    }> {
        const loans = await localStorageService.getLoanDetails();
        let totalTransactions = 0;

        for (const loan of loans) {
            if (loan.id) {
                const transactions = await localStorageService.getTransactionsByLoanId(loan.id);
                totalTransactions += transactions.length;
            }
        }

        return {
            loanCount: loans.length,
            transactionCount: totalTransactions,
        };
    }
}

export const dataMigrationService = DataMigrationService;
