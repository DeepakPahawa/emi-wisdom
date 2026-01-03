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
    emiStartDate: new Date(),
    transactions: {},
    isInitialized: false,
    isLoading: false,

    // Actions
    setPrincipal: (principal: number, markInitialized = true) => {
        set({ principal, ...(markInitialized && { isInitialized: true }) });
    },

    setInterest: (interest: number, markInitialized = true) => {
        set({ interest, ...(markInitialized && { isInitialized: true }) });
    },

    setTenure: (tenure: number, markInitialized = true) => {
        set({ tenure, ...(markInitialized && { isInitialized: true }) });
    },

    setEmiStartDate: (date: Date | string, markInitialized = true) => {
        set({ emiStartDate: date, ...(markInitialized && { isInitialized: true }) });
    },

    updateTransaction: (month: number, paidEmi: number, partPayment: number) => {
        set((state) => ({
            transactions: {
                ...state.transactions,
                [month]: { month, paidEmi, partPayment },
            },
        }));
    },

    setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
    },

    loadFromStorage: async () => {
        set({ isLoading: true });
        try {
            const savedConfig = await loadLoanConfig();

            if (savedConfig) {
                // Ensure emiStartDate is properly converted to Date if it's a string
                const emiStartDate = savedConfig.emiStartDate
                    ? (typeof savedConfig.emiStartDate === 'string'
                        ? new Date(savedConfig.emiStartDate)
                        : savedConfig.emiStartDate)
                    : new Date();

                console.log("📥 Loading saved config from IndexedDB:", savedConfig);

                set({
                    principal: savedConfig.principal,
                    interest: savedConfig.interest,
                    tenure: savedConfig.tenure,
                    emiStartDate,
                    isInitialized: true,
                    isLoading: false,
                });
            } else {
                console.log("ℹ️ No saved config found, using defaults");
                // No saved config, use defaults
                set({ isInitialized: true, isLoading: false });
            }
        } catch (error) {
            console.error("❌ Error loading from storage:", error);
            // On error, still mark as initialized with defaults
            set({ isInitialized: true, isLoading: false });
        }
    },
}));
