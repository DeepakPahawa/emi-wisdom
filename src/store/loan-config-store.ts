import { create } from "zustand";
import { LoanConfigStore } from "@/types";
import { loadLoanConfig } from "@/lib/indexeddb-service";

// Default values
const DEFAULT_PRINCIPAL = 1000000; // ₹10 lakhs
const DEFAULT_INTEREST = 8.5; // 8.5%
const DEFAULT_TENURE = 240; // 20 years (240 months)

export const useLoanConfigStore = create<LoanConfigStore>((set) => ({
    // State
    principal: DEFAULT_PRINCIPAL,
    interest: DEFAULT_INTEREST,
    tenure: DEFAULT_TENURE,
    isInitialized: false,

    // Actions
    setPrincipal: (principal: number) => {
        set({ principal, isInitialized: true });
    },

    setInterest: (interest: number) => {
        set({ interest, isInitialized: true });
    },

    setTenure: (tenure: number) => {
        set({ tenure, isInitialized: true });
    },

    setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
    },

    loadFromStorage: async () => {
        try {
            const savedConfig = await loadLoanConfig();

            if (savedConfig) {
                set({
                    principal: savedConfig.principal,
                    interest: savedConfig.interest,
                    tenure: savedConfig.tenure,
                    isInitialized: true,
                });
            } else {
                // No saved config, use defaults
                set({ isInitialized: true });
            }
        } catch (error) {
            console.error("Error loading from storage:", error);
            // On error, still mark as initialized with defaults
            set({ isInitialized: true });
        }
    },
}));
