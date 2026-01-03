/**
 * Test IndexedDB availability and functionality
 */
export async function testIndexedDB(): Promise<{
    available: boolean;
    error?: string;
    details?: any;
}> {
    try {
        // Check if IndexedDB is available
        if (typeof window === "undefined") {
            return {
                available: false,
                error: "Running in server-side environment",
            };
        }

        if (!window.indexedDB) {
            return {
                available: false,
                error: "IndexedDB not supported in this browser",
            };
        }

        // Try to open a test database
        const testDbName = "indexeddb-test";
        const request = indexedDB.open(testDbName, 1);

        return new Promise((resolve) => {
            request.onerror = (event) => {
                const error = (event.target as IDBOpenDBRequest).error;
                resolve({
                    available: false,
                    error: `Failed to open test database: ${error?.message || 'Unknown error'}`,
                    details: error,
                });
            };

            request.onblocked = () => {
                resolve({
                    available: false,
                    error: "IndexedDB is blocked (close other tabs)",
                });
            };

            request.onsuccess = () => {
                const db = request.result;
                db.close();

                // Try to delete the test database
                const deleteRequest = indexedDB.deleteDatabase(testDbName);

                deleteRequest.onsuccess = () => {
                    resolve({
                        available: true,
                    });
                };

                deleteRequest.onerror = () => {
                    resolve({
                        available: true,
                        error: "Database works but couldn't delete test DB",
                    });
                };
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains("test-store")) {
                    db.createObjectStore("test-store");
                }
            };
        });
    } catch (error: any) {
        return {
            available: false,
            error: `Exception: ${error?.message || 'Unknown error'}`,
            details: error,
        };
    }
}
