import { LoanConfig } from "@/types";

const DB_NAME = "emi-hacks-db";
const DB_VERSION = 1;
const STORE_NAME = "loan-config";
const CONFIG_KEY = "current-loan-config";

/**
 * Initialize IndexedDB database
 */
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("IndexedDB is not available in server-side rendering"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error("Failed to open IndexedDB"));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

/**
 * Save loan configuration to IndexedDB
 */
export const saveLoanConfig = async (config: LoanConfig): Promise<void> => {
    try {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(config, CONFIG_KEY);

            request.onsuccess = () => {
                console.log("✅ Loan config saved to IndexedDB:", config);
                resolve();
            };

            request.onerror = () => {
                reject(new Error("Failed to save loan config"));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error("Error saving to IndexedDB:", error);
        throw error;
    }
};

/**
 * Load loan configuration from IndexedDB
 */
export const loadLoanConfig = async (): Promise<LoanConfig | null> => {
    try {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(CONFIG_KEY);

            request.onsuccess = () => {
                const config = request.result as LoanConfig | undefined;
                if (config) {
                    console.log("✅ Loan config loaded from IndexedDB:", config);
                    resolve(config);
                } else {
                    console.log("ℹ️ No saved loan config found in IndexedDB");
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error("Failed to load loan config"));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error("Error loading from IndexedDB:", error);
        return null;
    }
};
