import { useState, useEffect } from 'react';

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const MOCK_DATA: Record<'daily', OHLCV[]> = {
  daily: 
  [
    { date: '2024-01-01', open: 1860, high: 1905, low: 1842, close: 1887, volume: 1000000 },
    { date: '2024-01-02', open: 1887, high: 1950, low: 1875, close: 1932, volume: 1200000 },
    { date: '2024-01-03', open: 1932, high: 1948, low: 1901, close: 1914, volume: 950000  },
    { date: '2024-01-04', open: 1914, high: 1988, low: 1910, close: 1975, volume: 1150000 },
    { date: '2024-01-05', open: 1975, high: 2021, low: 1968, close: 2008, volume: 1300000 },
    { date: '2024-01-06', open: 2008, high: 2065, low: 1997, close: 2047, volume: 1400000 },
    { date: '2024-01-07', open: 2047, high: 2059, low: 1983, close: 1998, volume: 1100000 },
  ]
};

export function useAssetSummary(ticker: string, timeframe: 'daily')
{
    const [data, setData] = useState<OHLCV[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        
        const timer = setTimeout(() => { //setData hook replace with endpoint
            setData(MOCK_DATA[timeframe]);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
        }, [ticker, timeframe]);
    return { data, loading };
}