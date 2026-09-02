'use client';

import { apiClient, ApiError } from "@/lib/api";
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

    current_price: number | null,
    unrealised_pnl: number | null
}

export interface RealTimeDataPoint {
    timestamp: string
    price: number
    volume: number
}

export interface RealTimeDataResponse {
    points: RealTimeDataPoint[]
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
                    try {
                        const summary: RealTimeDataResponse = await apiClient(`/real_time/points/${h.ticker}`);
                        const latest = summary.points.reduce<RealTimeDataPoint | null>((max, p) =>
                            !max || p.timestamp > max.timestamp ? p : max, null);

                        if (!latest) {
                            return { ...h, current_price: null, unrealised_pnl: null };
                        }

                        return {
                            ...h,
                            current_price: latest.price,
                            unrealised_pnl: (latest.price - h.average_cost) * h.net_quantity,
                        };
                    } catch {
                        return { ...h, current_price: null, unrealised_pnl: null };
                    }
                })
            );

            setHoldings(holdingsWithPrice);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setHoldings([]);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [account_id]);
    useEffect(() => { fetch(); }, [fetch]);
    return { holdings, loading, error, refetch: fetch }
}
