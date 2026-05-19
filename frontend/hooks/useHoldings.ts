'use client';

import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface Holdings {
    asset_id: number,
    ticker: string,
    net_quantity: number,
    average_cost: number
}

export interface HoldingsWithCurrPrice {
    asset_id: number,
    ticker: string,
    net_quantity: number,
    average_cost: number,

    current_price: number,
    unrealised_pnl: number
}

export function useHoldings(account_id: number | null) {
    const [holdings, setHoldings] = useState<HoldingsWithCurrPrice[]>([]);
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

            const holdingsWithPrice = await Promise.all(
                response.holdings.map(async (h: Holdings) => {
                    const summary = await apiClient(`/market-data/assets/${h.ticker}/summary`);
                    return {
                        ...h,
                        current_price: summary.current_price,
                        unrealised_pnl: (summary.current_price - h.average_cost) * h.net_quantity,
                    };
                })
            );

            setHoldings(holdingsWithPrice);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [account_id]);
    useEffect(() => { fetch(); }, [fetch]);
    return { holdings, loading, error, refetch: fetch }
}