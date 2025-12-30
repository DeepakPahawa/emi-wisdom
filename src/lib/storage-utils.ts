/**
 * Storage utility functions for IndexedDB and data management
 */

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Check if IndexedDB is available in the browser
 */
export function isIndexedDBAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
    } catch (e) {
        return false;
    }
}

/**
 * Validate loan details data
 */
export function validateLoanDetails(data: any): boolean {
    return (
        data &&
        typeof data.principal_amount === 'number' &&
        data.principal_amount > 0 &&
        typeof data.interest_rate === 'number' &&
        data.interest_rate >= 0 &&
        typeof data.loan_tenure_months === 'number' &&
        data.loan_tenure_months > 0 &&
        typeof data.emi_start_date === 'string'
    );
}

/**
 * Validate EMI transaction data
 */
export function validateEmiTransaction(data: any): boolean {
    return (
        data &&
        typeof data.loan_id === 'string' &&
        typeof data.month_number === 'number' &&
        data.month_number > 0 &&
        typeof data.emi_date === 'string' &&
        typeof data.principal_paid === 'number' &&
        typeof data.interest_paid === 'number' &&
        typeof data.part_payment === 'number' &&
        typeof data.remaining_balance === 'number'
    );
}

/**
 * Compare timestamps to determine which is more recent
 * Returns true if timestamp1 is more recent than timestamp2
 */
export function isMoreRecent(timestamp1: string, timestamp2: string): boolean {
    return new Date(timestamp1) > new Date(timestamp2);
}

/**
 * Sanitize data for storage (remove undefined values)
 */
export function sanitizeData<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach((key) => {
        if (sanitized[key] === undefined) {
            delete sanitized[key];
        }
    });
    return sanitized;
}
