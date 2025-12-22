import { LoanDetailsDB, EmiTransaction } from '@/types';

/**
 * LocalStorageService - Handles offline data storage using IndexedDB with LocalStorage fallback
 * This service provides CRUD operations for loan details and EMI transactions when the user is not authenticated
 */

const DB_NAME = 'emi-hacks-db';
const DB_VERSION = 1;
const LOAN_DETAILS_STORE = 'loan_details';
const EMI_TRANSACTIONS_STORE = 'emi_transactions';

// Fallback to LocalStorage keys
const LS_LOAN_DETAILS_KEY = 'emi-hacks-loan-details';
const LS_EMI_TRANSACTIONS_KEY = 'emi-hacks-emi-transactions';

class LocalStorageService {
    private db: IDBDatabase | null = null;
    private useIndexedDB = true;

    /**
     * Initialize IndexedDB
     */
    async init(): Promise<void> {
        if (typeof window === 'undefined') {
            this.useIndexedDB = false;
            return;
        }

        if (!window.indexedDB) {
            console.warn('IndexedDB not available, falling back to LocalStorage');
            this.useIndexedDB = false;
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.useIndexedDB = false;
                resolve();
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.useIndexedDB = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create loan_details store
                if (!db.objectStoreNames.contains(LOAN_DETAILS_STORE)) {
                    const loanStore = db.createObjectStore(LOAN_DETAILS_STORE, {
                        keyPath: 'id',
                        autoIncrement: false,
                    });
                    loanStore.createIndex('loan_number', 'loan_number', { unique: true });
                    loanStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // Create emi_transactions store
                if (!db.objectStoreNames.contains(EMI_TRANSACTIONS_STORE)) {
                    const transactionStore = db.createObjectStore(EMI_TRANSACTIONS_STORE, {
                        keyPath: 'id',
                        autoIncrement: false,
                    });
                    transactionStore.createIndex('loan_id', 'loan_id', { unique: false });
                    transactionStore.createIndex('month_number', 'month_number', { unique: false });
                    transactionStore.createIndex('transaction_type', 'transaction_type', { unique: false });
                }
            };
        });
    }

    /**
     * Generate a unique ID for offline records
     */
    private generateId(): string {
        return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ==================== LOAN DETAILS METHODS ====================

    /**
     * Get all loan details (returns array, most recent first)
     */
    async getLoanDetails(): Promise<LoanDetailsDB[]> {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([LOAN_DETAILS_STORE], 'readonly');
                const store = transaction.objectStore(LOAN_DETAILS_STORE);
                const request = store.getAll();

                request.onsuccess = () => {
                    const loans = request.result as LoanDetailsDB[];
                    // Sort by created_at descending
                    loans.sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    });
                    resolve(loans);
                };

                request.onerror = () => {
                    console.error('Error fetching loan details from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const data = localStorage.getItem(LS_LOAN_DETAILS_KEY);
            if (data) {
                try {
                    const loans = JSON.parse(data) as LoanDetailsDB[];
                    return Array.isArray(loans) ? loans : [];
                } catch (error) {
                    console.error('Error parsing loan details from LocalStorage:', error);
                    return [];
                }
            }
            return [];
        }
    }

    /**
     * Get a single loan by loan_number
     */
    async getLoanByNumber(loanNumber: string): Promise<LoanDetailsDB | null> {
        const loans = await this.getLoanDetails();
        return loans.find(loan => loan.loan_number === loanNumber) || null;
    }

    /**
     * Save or update loan details
     */
    async saveLoanDetails(loan: Omit<LoanDetailsDB, 'id' | 'created_at' | 'updated_at'>): Promise<LoanDetailsDB> {
        await this.init();

        // Check if loan already exists
        const existingLoan = await this.getLoanByNumber(loan.loan_number);

        const now = new Date().toISOString();
        const loanData: LoanDetailsDB = {
            ...loan,
            id: existingLoan?.id || this.generateId(),
            created_at: existingLoan?.created_at || now,
            updated_at: now,
        };

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([LOAN_DETAILS_STORE], 'readwrite');
                const store = transaction.objectStore(LOAN_DETAILS_STORE);
                const request = store.put(loanData);

                request.onsuccess = () => {
                    resolve(loanData);
                };

                request.onerror = () => {
                    console.error('Error saving loan details to IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const loans = await this.getLoanDetails();
            const index = loans.findIndex(l => l.loan_number === loan.loan_number);

            if (index >= 0) {
                loans[index] = loanData;
            } else {
                loans.unshift(loanData);
            }

            localStorage.setItem(LS_LOAN_DETAILS_KEY, JSON.stringify(loans));
            return loanData;
        }
    }

    /**
     * Delete loan details by loan_number
     */
    async deleteLoanDetails(loanNumber: string): Promise<void> {
        await this.init();

        const existingLoan = await this.getLoanByNumber(loanNumber);
        if (!existingLoan?.id) {
            return;
        }

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([LOAN_DETAILS_STORE], 'readwrite');
                const store = transaction.objectStore(LOAN_DETAILS_STORE);
                const request = store.delete(existingLoan.id!);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting loan details from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const loans = await this.getLoanDetails();
            const filtered = loans.filter(l => l.loan_number !== loanNumber);
            localStorage.setItem(LS_LOAN_DETAILS_KEY, JSON.stringify(filtered));
        }
    }

    // ==================== EMI TRANSACTIONS METHODS ====================

    /**
     * Get all transactions for a specific loan
     */
    async getTransactionsByLoanId(loanId: string): Promise<EmiTransaction[]> {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([EMI_TRANSACTIONS_STORE], 'readonly');
                const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
                const index = store.index('loan_id');
                const request = index.getAll(loanId);

                request.onsuccess = () => {
                    resolve(request.result as EmiTransaction[]);
                };

                request.onerror = () => {
                    console.error('Error fetching transactions from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const data = localStorage.getItem(LS_EMI_TRANSACTIONS_KEY);
            if (data) {
                try {
                    const transactions = JSON.parse(data) as EmiTransaction[];
                    return transactions.filter(t => t.loan_id === loanId);
                } catch (error) {
                    console.error('Error parsing transactions from LocalStorage:', error);
                    return [];
                }
            }
            return [];
        }
    }

    /**
     * Get a specific transaction by loan_id, month_number, and transaction_type
     */
    async getTransaction(
        loanId: string,
        monthNumber: number,
        transactionType: 'emi' | 'part_payment'
    ): Promise<EmiTransaction | null> {
        const transactions = await this.getTransactionsByLoanId(loanId);
        return transactions.find(
            t => t.month_number === monthNumber && t.transaction_type === transactionType
        ) || null;
    }

    /**
     * Save or update a transaction
     */
    async saveTransaction(transaction: Omit<EmiTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<EmiTransaction> {
        await this.init();

        if (!transaction.loan_id) {
            throw new Error('loan_id is required for saving transaction');
        }

        // Check if transaction already exists
        const existingTransaction = await this.getTransaction(
            transaction.loan_id,
            transaction.month_number,
            transaction.transaction_type
        );

        const now = new Date().toISOString();
        const transactionData: EmiTransaction = {
            ...transaction,
            id: existingTransaction?.id || this.generateId(),
            created_at: existingTransaction?.created_at || now,
            updated_at: now,
        };

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const txn = this.db!.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
                const store = txn.objectStore(EMI_TRANSACTIONS_STORE);
                const request = store.put(transactionData);

                request.onsuccess = () => {
                    resolve(transactionData);
                };

                request.onerror = () => {
                    console.error('Error saving transaction to IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const data = localStorage.getItem(LS_EMI_TRANSACTIONS_KEY);
            let transactions: EmiTransaction[] = [];

            if (data) {
                try {
                    transactions = JSON.parse(data);
                } catch (error) {
                    console.error('Error parsing transactions from LocalStorage:', error);
                }
            }

            const index = transactions.findIndex(
                t => t.loan_id === transaction.loan_id &&
                    t.month_number === transaction.month_number &&
                    t.transaction_type === transaction.transaction_type
            );

            if (index >= 0) {
                transactions[index] = transactionData;
            } else {
                transactions.push(transactionData);
            }

            localStorage.setItem(LS_EMI_TRANSACTIONS_KEY, JSON.stringify(transactions));
            return transactionData;
        }
    }

    /**
     * Delete a transaction by ID
     */
    async deleteTransaction(id: string): Promise<void> {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
                const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting transaction from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            const data = localStorage.getItem(LS_EMI_TRANSACTIONS_KEY);
            if (data) {
                try {
                    const transactions = JSON.parse(data) as EmiTransaction[];
                    const filtered = transactions.filter(t => t.id !== id);
                    localStorage.setItem(LS_EMI_TRANSACTIONS_KEY, JSON.stringify(filtered));
                } catch (error) {
                    console.error('Error deleting transaction from LocalStorage:', error);
                }
            }
        }
    }

    /**
     * Delete transactions by loan_id, transaction_type, and from_month onwards
     */
    async deleteTransactionsFromMonth(
        loanId: string,
        transactionType: 'emi' | 'part_payment',
        fromMonth: number
    ): Promise<number> {
        await this.init();

        const transactions = await this.getTransactionsByLoanId(loanId);
        const toDelete = transactions.filter(
            t => t.transaction_type === transactionType && t.month_number >= fromMonth
        );

        for (const transaction of toDelete) {
            if (transaction.id) {
                await this.deleteTransaction(transaction.id);
            }
        }

        return toDelete.length;
    }

    /**
     * Check if there is any local data stored
     */
    async hasLocalData(): Promise<boolean> {
        const loans = await this.getLoanDetails();
        return loans.length > 0;
    }

    /**
     * Clear all local data (useful for testing or data migration)
     */
    async clearAllData(): Promise<void> {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction(
                    [LOAN_DETAILS_STORE, EMI_TRANSACTIONS_STORE],
                    'readwrite'
                );

                const loanStore = transaction.objectStore(LOAN_DETAILS_STORE);
                const transactionStore = transaction.objectStore(EMI_TRANSACTIONS_STORE);

                loanStore.clear();
                transactionStore.clear();

                transaction.oncomplete = () => {
                    resolve();
                };

                transaction.onerror = () => {
                    console.error('Error clearing IndexedDB:', transaction.error);
                    reject(transaction.error);
                };
            });
        } else {
            // Fallback to LocalStorage
            localStorage.removeItem(LS_LOAN_DETAILS_KEY);
            localStorage.removeItem(LS_EMI_TRANSACTIONS_KEY);
        }
    }
}

// Export a singleton instance
export const localStorageService = new LocalStorageService();
