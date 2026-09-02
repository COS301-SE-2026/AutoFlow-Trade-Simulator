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
            // price and volume are Decimal on the backend, so they arrive as JSON
            // strings — Recharts needs real numbers to build a domain.
            setRealTimeTicks(response.points.map((p: { timestamp: string, price: string, volume: string }) => ({
                timestamp: p.timestamp,
                price: Number(p.price),
                volume: Number(p.volume),
            })));
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

export function useRealTimeTicksList() {
    const [realTimeTicksList, setRealTimeTicksList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/real_time/list`);
            setRealTimeTicksList(response.symbols);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setRealTimeTicksList([]);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetch(); }, [fetch]);

    return { realTimeTicksList, loading, error, refetch: fetch }
}