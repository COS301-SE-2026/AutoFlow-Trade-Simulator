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
import { ApiError } from "../api";
import {useAuth} from "@/lib/hooks/useAuth";

type AccountContextType = {
    accounts: InternationalAccount[] | null;
    activeAccount: InternationalAccount | null;
    isLoading: boolean;
    error: string | null;
    create: (currencyCode: Currency, initialBalance: number) => Promise<void>;
    update: (updated: InternationalAccount) => void;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);
const activeAccountKey = 'activeAccountId';

export function AccountProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();

    const [accounts, setAccounts] = useState<InternationalAccount[] | null>(null);
    const [activeAccount, setActiveAccount] = useState<InternationalAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
        if (!token) {
            setAccounts(null);
            setActiveAccount(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        fetchAllInternationalAccounts()
            .then((fetchedAccounts) => {
                setAccounts(fetchedAccounts);
                if (fetchedAccounts.length > 0) {
                    const savedId = sessionStorage.getItem(activeAccountKey);
                    const savedAccount = savedId
                        ? fetchedAccounts.find((a) => a.id === Number(savedId))
                        : null;
                    setActiveAccount(savedAccount ?? fetchedAccounts[0]);
                }
            })
            .catch((err) => {
                if (err instanceof ApiError && err.status === 401) {
                    setAccounts(null);
                    setActiveAccount(null);
                } else {
                    setError(err.message);
                }
            })
            .finally(() => setIsLoading(false));
    }, [token]);

    async function create(currencyCode: Currency, initialBalance: number) {
        const newAccount = await createAccount(currencyCode, initialBalance);
        setAccounts((prev) => (prev ? [...prev, newAccount] : [newAccount]));
        update(newAccount);
    }

    function update(updated: InternationalAccount) {
        setAccounts((prev) =>
            prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : [updated]
        );
        setActiveAccount(updated);
        sessionStorage.setItem(activeAccountKey, String(updated.id));
        window.location.reload();
    }

    return (
        <AccountContext.Provider value={{ accounts, activeAccount, isLoading, error, create, update }}>
    {children}
    </AccountContext.Provider>
    );
}

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used within AccountProvider");
    return ctx;
}