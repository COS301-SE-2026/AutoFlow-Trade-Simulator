'use client';

import { apiClient, ApiError } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

export interface PortfolioHistoryPoint {
    date: string;
    total_value: number;
}

export function usePortfolioHistory(accountId: number | null) {
    const [points, setPoints] = useState<PortfolioHistoryPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!accountId) {
            setPoints([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/portfolio/accounts/${accountId}/history`);
            setPoints(response.points);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setPoints([]);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => { fetch(); }, [fetch]);

    return { points, loading, error, refetch: fetch };
}
