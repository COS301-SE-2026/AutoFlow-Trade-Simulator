'use client';

import { apiClient, ApiError } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface RealTimeTicks {
    timestamp: string,
    price: number,
    volume: number,
}

export function useRealTimeTicks(symbol: string | null) {
    const [realTimeTicks, setRealTimeTicks] = useState<RealTimeTicks[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/real_time/points/${symbol}`);
            setRealTimeTicks(response.points);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setRealTimeTicks([]);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [symbol]);
    useEffect(() => { fetch(); }, [fetch]);

    return { realTimeTicks, loading, error, refetch: fetch }
}