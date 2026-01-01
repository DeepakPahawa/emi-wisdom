export interface LoanConfig {
    principal: number;
    interest: number;
    tenure: number;
}

export interface LoanConfigStore extends LoanConfig {
    isInitialized: boolean;
    setPrincipal: (principal: number) => void;
    setInterest: (interest: number) => void;
    setTenure: (tenure: number) => void;
    loadFromStorage: () => Promise<void>;
    setInitialized: (initialized: boolean) => void;
}
