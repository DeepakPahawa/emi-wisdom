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
    emiStartDate?: Date | string;
    transactions: Record<number, EmiTransaction>; // month number -> transaction
    setPrincipal: (principal: number) => void;
    setInterest: (interest: number) => void;
    setTenure: (tenure: number) => void;
    setEmiStartDate: (date: Date | string) => void;
    updateTransaction: (month: number, paidEmi: number, partPayment: number) => void;
    loadFromStorage: () => Promise<void>;
    setInitialized: (initialized: boolean) => void;
}
