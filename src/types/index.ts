export interface LoanConfig {
    principal: number;
    interest: number;
    tenure: number;
    emiStartDate?: Date | string; // Optional EMI start date
}

export interface EmiTransaction {
    month: number;
    paidEmi: number;
    partPayment: number;
}

export interface LoanConfigStore extends LoanConfig {
    isInitialized: boolean;
    isLoading: boolean;
    emiStartDate?: Date | string;
    transactions: Record<number, EmiTransaction>; // month number -> transaction
    setPrincipal: (principal: number, markInitialized?: boolean) => void;
    setInterest: (interest: number, markInitialized?: boolean) => void;
    setTenure: (tenure: number, markInitialized?: boolean) => void;
    setEmiStartDate: (date: Date | string, markInitialized?: boolean) => void;
    updateTransaction: (month: number, paidEmi: number, partPayment: number) => void;
    updateBulkTransactions: (updates: Array<{ month: number; paidEmi: number; partPayment: number }>) => void;
    loadFromStorage: () => Promise<void>;
    setInitialized: (initialized: boolean) => void;
}
