'use client';
import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface Reports {
    id: number,
    report_id: number,
    ticker: string,
    open_price: string,
    close_price: string,
    pct_change: number,
    period_high: string,
    period_low: string
}

export function useReports() {
    const [reports, setReports] = useState<Reports[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/reports/`);
            setReports(response);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createReport = async (period: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/reports/`, {
                method: "POST",
                body: { period }
            });
            setReports(prev => [...prev, response]);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, [fetchReports]);

    return { reports, loading, error, refetch: fetchReports, createReport }
}