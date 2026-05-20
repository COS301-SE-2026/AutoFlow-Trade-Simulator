"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { fetchAssetPrices, fetchAssetSummary } from "../api/assets";
import type { OHLCV, AssetSummary } from "../types/assets";

type PriceContextType =
{
    ticker: string | null;
    timeframe: '1d' | '1w' | '1m';
    prices: OHLCV[] | null;
    summary: AssetSummary | null;
    isLoading: boolean;
    error: string | null;
    setTicker: (ticker: string) => void;
    setTimeframe: (timeframe: '1d' | '1w' | '1m') => void;
};

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode })
{
    const [ticker, setTickerState] = useState<string | null>(null);
    const [timeframe, setTimeframeState] = useState<'1d' | '1w' | '1m'>('1d');
    const [prices, setPrices] = useState<OHLCV[] | null>(null);
    const [summary, setSummary] = useState<AssetSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker)
        {
            setPrices(null);
            setSummary(null);
            return;
        }
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try
            {
                const priceData = await fetchAssetPrices(ticker, timeframe);
                setPrices(priceData);
            }
            catch (e)
            {
                if (e instanceof Error)
                {
                    setError(e.message);
                }
                else
                {
                    setError('Failed to load prices');
                }
                setPrices(null);
            }

            try
            {
                const summaryData = await fetchAssetSummary(ticker);
                setSummary(summaryData);
            }
            catch (e)
            {
                if (e instanceof Error)
                {
                    setError(e.message);
                }
                else
                {
                    setError('Failed to load summary');
                }
                setSummary(null);
            }

            setIsLoading(false);
        };

        loadData();
    }, [ticker, timeframe]);

    const setTicker = (newTicker: string) =>
    {
        setTickerState(newTicker);
    };

    const setTimeframe = (newTimeframe: '1d' | '1w' | '1m') =>
    {
        setTimeframeState(newTimeframe);
    };

    return (
        <PriceContext.Provider
            value={{
                ticker,
                timeframe,
                prices,
                summary,
                isLoading,
                error,
                setTicker,
                setTimeframe,
            }}
        >
            {children}
        </PriceContext.Provider>
    );
}

export function usePrice()
{
    const ctx = useContext(PriceContext);
    if (!ctx) throw new Error("usePrice must be used within PriceProvider");
    return ctx;
}
