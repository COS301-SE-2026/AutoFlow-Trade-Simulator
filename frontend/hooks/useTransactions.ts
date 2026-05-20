'use client';

import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface Transactions {
    account_id: number,
    account_currency_code: string,
    asset_ticker: string,
    asset_id: number,
    direction: string,
    quantity: number,
    price_at_execution: number,
    executed_at: string
}

export function useTransactions(account_id: number | null) {
    const [transactions, setTransactions] = useState<Transactions[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!account_id) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/portfolio/accounts/${account_id}/transactions`);
            setTransactions(response.transactions ?? response);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [account_id]);
    useEffect(() => { fetch(); }, [fetch]);
    return { transactions, loading, error, refetch: fetch }
}