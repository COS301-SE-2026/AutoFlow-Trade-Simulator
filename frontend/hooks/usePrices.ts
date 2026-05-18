import { useState, useEffect } from 'react';

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Timeframe = 'daily' | 'weekly' | 'monthly';

const MOCK_DATA: Record<Timeframe, OHLCV[]> = {
  daily: 
  [
    { date: '2024-01-01', open: 1860, high: 1905, low: 1842, close: 1887, volume: 1000000 },
    { date: '2024-01-02', open: 1887, high: 1950, low: 1875, close: 1932, volume: 1200000 },
    { date: '2024-01-03', open: 1932, high: 1948, low: 1901, close: 1914, volume: 950000  },
    { date: '2024-01-04', open: 1914, high: 1988, low: 1910, close: 1975, volume: 1150000 },
    { date: '2024-01-05', open: 1975, high: 2021, low: 1968, close: 2008, volume: 1300000 },
    { date: '2024-01-06', open: 2008, high: 2065, low: 1997, close: 2047, volume: 1400000 },
    { date: '2024-01-07', open: 2047, high: 2059, low: 1983, close: 1998, volume: 1100000 },
  ],
  weekly: 
  [
    { date: '2023-10-02', open: 1720, high: 1810, low: 1700, close: 1785, volume: 6500000 },
    { date: '2023-10-09', open: 1785, high: 1860, low: 1770, close: 1843, volume: 7100000 },
    { date: '2023-10-16', open: 1843, high: 1900, low: 1820, close: 1876, volume: 6800000 },
    { date: '2023-10-23', open: 1876, high: 1950, low: 1855, close: 1932, volume: 7400000 },
    { date: '2023-10-30', open: 1932, high: 1980, low: 1910, close: 1965, volume: 6900000 },
    { date: '2023-11-06', open: 1965, high: 2030, low: 1950, close: 2010, volume: 7600000 },
  ],
  monthly: 
  [
    { date: '2023-07-01', open: 1500, high: 1620, low: 1480, close: 1590, volume: 28000000 },
    { date: '2023-08-01', open: 1590, high: 1700, low: 1560, close: 1672, volume: 30000000 },
    { date: '2023-09-01', open: 1672, high: 1750, low: 1640, close: 1715, volume: 27000000 },
    { date: '2023-10-01', open: 1715, high: 1820, low: 1695, close: 1800, volume: 31000000 },
    { date: '2023-11-01', open: 1800, high: 1920, low: 1780, close: 1895, volume: 33000000 },
    { date: '2023-12-01', open: 1895, high: 2010, low: 1870, close: 1998, volume: 35000000 },
  ],
};

export function usePrices(ticker: string, timeframe: Timeframe)
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
};