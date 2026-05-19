'use client';

import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface Holdings {
    asset_id: number,
    ticker: string,
    net_quantity: number,
    average_cost: number
}

export function useHoldings(account_id: number | null) {
    const [Holdings, setHoldings] = useState<Holdings[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!account_id) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/portfolio/accounts/${account_id}/holdings`);
            setHoldings(response.Holdings ?? response);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [account_id]);
    useEffect(() => { fetch(); }, [fetch]);
    return { Holdings, loading, error, refetch: fetch }
}