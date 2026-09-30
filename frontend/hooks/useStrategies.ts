'use client';

import { apiClient, ApiError } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface StrategySummary {
    id: number,
    name: string,
    level: string,
    category: string,
    description: string,
    unlocked: boolean,
}

export interface StrategyDetail extends StrategySummary {
    steps: string[],
    pros: string[],
    cons: string[]
}

export function useStrategies() {
    const [strategies, setStrategies] = useState<StrategySummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/simulation/strategies`);
            setStrategies(response.strategies);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setStrategies([]);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetch(); }, [fetch]);

    const fetchDetail = useCallback(async (id: number): Promise<StrategyDetail> => {
        return apiClient(`/simulation/strategies/${id}`);
    }, []);

    return { strategies, loading, error, refetch: fetch, fetchDetail }
}