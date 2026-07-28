'use client';

import { apiClient, ApiError } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface StrategySummary {
    id: number,
    name: string,
    level: string,
    category: string,
    description: string
}

const MOCK_STRATEGIES: StrategySummary[] = [
    { id: 1, name: 'Dollar-Cost Averaging', level: 'Beginner', category: 'Investing', description: 'Invest a fixed dollar amount at regular intervals regardless of price.' },
    { id: 2, name: 'Covered Call', level: 'Intermediate', category: 'Options', description: 'Generate income by selling call options on shares you already own.' },
    { id: 3, name: 'Iron Condor', level: 'Advanced', category: 'Options', description: 'Profit when an underlying asset stays within a defined price range.' },
    { id: 4, name: 'Momentum Trading', level: 'Intermediate', category: 'Technical', description: 'Buy assets trending strongly upward and sell those trending down.' },
    { id: 5, name: 'Pairs Trading', level: 'Advanced', category: 'Quantitative', description: 'Market-neutral strategy exploiting temporary divergences between two correlated assets.' },
    { id: 6, name: 'Protective Put', level: 'Beginner', category: 'Options', description: 'Buy a put option on a stock you own to insure against a significant decline.' },
];

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

    return { strategies, loading, error, refetch: fetch }
}