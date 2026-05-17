"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { fetchAllInternationalAccounts, createAccount } from "../api/accounts";
import type { InternationalAccount } from "../types/accounts";
import type { Currency } from "../types/currencies";

type AccountContextType = {
    accounts: InternationalAccount[] | null;
    isLoading: boolean;
    error: string | null;
    create: (currencyCode: Currency, initialBalance: number) => Promise<void>;
    update: (updated: InternationalAccount) => void;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<InternationalAccount[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllInternationalAccounts()
            .then(setAccounts)
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    async function create(currencyCode: Currency, initialBalance: number) {
        const newAccount = await createAccount(currencyCode, initialBalance);
        setAccounts((prev) => (prev ? [...prev, newAccount] : [newAccount]));
    }

    function update(updated: InternationalAccount) {
        setAccounts((prev) =>
            prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : [updated]
        );
    }

    return (
        <AccountContext.Provider value={{ accounts, isLoading, error, create, update }}>
    {children}
    </AccountContext.Provider>
    );
}

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used within AccountProvider");
    return ctx;
}