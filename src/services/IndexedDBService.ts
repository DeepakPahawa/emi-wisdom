/**
 * IndexedDB Service
 * Low-level wrapper for IndexedDB operations
 */

import {
    IndexedDBLoanDetails,
    IndexedDBEmiTransaction
} from '@/types';
import {
    generateUUID,
    getCurrentTimestamp,
    isIndexedDBAvailable,
    validateLoanDetails,
    validateEmiTransaction
} from '@/lib/storage-utils';

const DB_NAME = 'emi_hacks_db';
const DB_VERSION = 1;
const LOAN_DETAILS_STORE = 'loan_details';
const EMI_TRANSACTIONS_STORE = 'emi_transactions';

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        if (!isIndexedDBAvailable()) {
            throw new Error('IndexedDB is not available in this browser');
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create loan_details object store
                if (!db.objectStoreNames.contains(LOAN_DETAILS_STORE)) {
                    const loanStore = db.createObjectStore(LOAN_DETAILS_STORE, { keyPath: 'id' });
                    loanStore.createIndex('user_id', 'user_id', { unique: false });
                    loanStore.createIndex('updated_at', 'updated_at', { unique: false });
                }

                // Create emi_transactions object store
                if (!db.objectStoreNames.contains(EMI_TRANSACTIONS_STORE)) {
                    const emiStore = db.createObjectStore(EMI_TRANSACTIONS_STORE, { keyPath: 'id' });
                    emiStore.createIndex('loan_id', 'loan_id', { unique: false });
                    emiStore.createIndex('user_id', 'user_id', { unique: false });
                    emiStore.createIndex('month_number', 'month_number', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Get the database instance
     */
    private async getDB(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }

    // ==================== LOAN DETAILS OPERATIONS ====================

    /**
     * Save loan details to IndexedDB
     */
    async saveLoanDetails(data: Partial<IndexedDBLoanDetails>): Promise<IndexedDBLoanDetails> {
        const db = await this.getDB();

        const loanDetails: IndexedDBLoanDetails = {
            id: data.id || generateUUID(),
            user_id: data.user_id || null,
            loan_number: data.loan_number || '',
            principal_amount: data.principal_amount || 0,
            original_interest_rate: data.original_interest_rate || 0,
            current_interest_rate: data.current_interest_rate || 0,
            emi_start_date: data.emi_start_date || '',
            loan_tenure_months: data.loan_tenure_months || 0,
            bank_name: data.bank_name || '',
            loan_label: data.loan_label || 'Other',
            created_at: data.created_at || getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([LOAN_DETAILS_STORE], 'readwrite');
            const store = transaction.objectStore(LOAN_DETAILS_STORE);
            const request = store.put(loanDetails);

            request.onsuccess = () => resolve(loanDetails);
            request.onerror = () => reject(new Error('Failed to save loan details'));
        });
    }

    /**
     * Get loan details from IndexedDB
     */
    async getLoanDetails(id?: string): Promise<IndexedDBLoanDetails | null> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([LOAN_DETAILS_STORE], 'readonly');
            const store = transaction.objectStore(LOAN_DETAILS_STORE);

            if (id) {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(new Error('Failed to get loan details'));
            } else {
                // Get the first (and typically only) loan details
                const request = store.getAll();
                request.onsuccess = () => {
                    const results = request.result;
                    resolve(results.length > 0 ? results[0] : null);
                };
                request.onerror = () => reject(new Error('Failed to get loan details'));
            }
        });
    }

    /**
     * Get all loan details from IndexedDB
     */
    async getAllLoanDetails(): Promise<IndexedDBLoanDetails[]> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([LOAN_DETAILS_STORE], 'readonly');
            const store = transaction.objectStore(LOAN_DETAILS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get all loan details'));
        });
    }

    /**
     * Update loan details in IndexedDB
     */
    async updateLoanDetails(id: string, data: Partial<IndexedDBLoanDetails>): Promise<IndexedDBLoanDetails> {
        const existing = await this.getLoanDetails(id);
        if (!existing) {
            throw new Error('Loan details not found');
        }

        const updated: IndexedDBLoanDetails = {
            ...existing,
            ...data,
            id,
            updated_at: getCurrentTimestamp(),
        };

        return this.saveLoanDetails(updated);
    }

    /**
     * Delete loan details from IndexedDB
     */
    async deleteLoanDetails(id: string): Promise<void> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([LOAN_DETAILS_STORE], 'readwrite');
            const store = transaction.objectStore(LOAN_DETAILS_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete loan details'));
        });
    }

    // ==================== EMI TRANSACTIONS OPERATIONS ====================

    /**
     * Save EMI transaction to IndexedDB
     */
    async saveEmiTransaction(data: Partial<IndexedDBEmiTransaction>): Promise<IndexedDBEmiTransaction> {
        const db = await this.getDB();

        const transaction: IndexedDBEmiTransaction = {
            id: data.id || generateUUID(),
            loan_id: data.loan_id || '',
            user_id: data.user_id || null,
            month_number: data.month_number || 0,
            emi_date: data.emi_date || '',
            transaction_type: data.transaction_type || 'emi',
            amount_paid: data.amount_paid || 0,
            principal_component: data.principal_component || 0,
            interest_component: data.interest_component || 0,
            created_at: data.created_at || getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
            const store = tx.objectStore(EMI_TRANSACTIONS_STORE);
            const request = store.put(transaction);

            request.onsuccess = () => resolve(transaction);
            request.onerror = () => reject(new Error('Failed to save EMI transaction'));
        });
    }

    /**
     * Save multiple EMI transactions
     */
    async saveEmiTransactions(transactions: Partial<IndexedDBEmiTransaction>[]): Promise<IndexedDBEmiTransaction[]> {
        const db = await this.getDB();
        const results: IndexedDBEmiTransaction[] = [];

        return new Promise((resolve, reject) => {
            const tx = db.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
            const store = tx.objectStore(EMI_TRANSACTIONS_STORE);

            let completed = 0;
            const total = transactions.length;

            if (total === 0) {
                resolve([]);
                return;
            }

            transactions.forEach((data) => {
                const transaction: IndexedDBEmiTransaction = {
                    id: data.id || generateUUID(),
                    loan_id: data.loan_id || '',
                    user_id: data.user_id || null,
                    month_number: data.month_number || 0,
                    emi_date: data.emi_date || '',
                    transaction_type: data.transaction_type || 'emi',
                    amount_paid: data.amount_paid || 0,
                    principal_component: data.principal_component || 0,
                    interest_component: data.interest_component || 0,
                    created_at: data.created_at || getCurrentTimestamp(),
                    updated_at: getCurrentTimestamp(),
                };

                const request = store.put(transaction);

                request.onsuccess = () => {
                    results.push(transaction);
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                };

                request.onerror = () => {
                    reject(new Error('Failed to save EMI transactions'));
                };
            });
        });
    }

    /**
     * Get EMI transactions for a loan
     */
    async getEmiTransactions(loanId: string): Promise<IndexedDBEmiTransaction[]> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([EMI_TRANSACTIONS_STORE], 'readonly');
            const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
            const index = store.index('loan_id');
            const request = index.getAll(loanId);

            request.onsuccess = () => {
                const results = request.result || [];
                // Sort by month_number
                results.sort((a, b) => a.month_number - b.month_number);
                resolve(results);
            };
            request.onerror = () => reject(new Error('Failed to get EMI transactions'));
        });
    }

    /**
     * Get all EMI transactions
     */
    async getAllEmiTransactions(): Promise<IndexedDBEmiTransaction[]> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([EMI_TRANSACTIONS_STORE], 'readonly');
            const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get all EMI transactions'));
        });
    }

    /**
     * Update EMI transaction
     */
    async updateEmiTransaction(id: string, data: Partial<IndexedDBEmiTransaction>): Promise<IndexedDBEmiTransaction> {
        const db = await this.getDB();

        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
            const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (!existing) {
                    reject(new Error('EMI transaction not found'));
                    return;
                }

                const updated: IndexedDBEmiTransaction = {
                    ...existing,
                    ...data,
                    id,
                    updated_at: getCurrentTimestamp(),
                };

                const putRequest = store.put(updated);
                putRequest.onsuccess = () => resolve(updated);
                putRequest.onerror = () => reject(new Error('Failed to update EMI transaction'));
            };

            getRequest.onerror = () => reject(new Error('Failed to get EMI transaction'));
        });
    }

    /**
     * Delete a single EMI transaction by ID
     */
    async deleteEmiTransaction(id: string): Promise<void> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
            const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete EMI transaction'));
        });
    }

    /**
     * Delete EMI transactions for a loan
     */
    async deleteEmiTransactions(loanId: string): Promise<void> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([EMI_TRANSACTIONS_STORE], 'readwrite');
            const store = transaction.objectStore(EMI_TRANSACTIONS_STORE);
            const index = store.index('loan_id');
            const request = index.openCursor(loanId);

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(new Error('Failed to delete EMI transactions'));
        });
    }

    /**
     * Clear all data from IndexedDB
     */
    async clearAll(): Promise<void> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([LOAN_DETAILS_STORE, EMI_TRANSACTIONS_STORE], 'readwrite');

            const loanStore = transaction.objectStore(LOAN_DETAILS_STORE);
            const emiStore = transaction.objectStore(EMI_TRANSACTIONS_STORE);

            const clearLoan = loanStore.clear();
            const clearEmi = emiStore.clear();

            let completed = 0;

            const checkComplete = () => {
                completed++;
                if (completed === 2) {
                    resolve();
                }
            };

            clearLoan.onsuccess = checkComplete;
            clearEmi.onsuccess = checkComplete;

            clearLoan.onerror = () => reject(new Error('Failed to clear loan details'));
            clearEmi.onerror = () => reject(new Error('Failed to clear EMI transactions'));
        });
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
        }
    }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
