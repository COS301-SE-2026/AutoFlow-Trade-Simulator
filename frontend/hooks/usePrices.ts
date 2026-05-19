import { useState, useEffect } from 'react';
import { fetchAssetPrices } from '@/lib/api/assets';
import type { OHLCV } from '@/lib/types/assets';

export function usePrices(ticker: string, timeframe: string) {
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPrices = async () => {
      setLoading(true);
      setError(null);

      try 
      {
        const result = await fetchAssetPrices(ticker, timeframe);
        setData(result);
      } 
      catch (e) 
      {
        if (e instanceof Error) 
        {
          setError(e.message);
        } 
        else 
        {
          setError('Failed to fetch prices');
        }
        setData([]);
      } 
      finally 
      {
        setLoading(false);
      }
    };

    if (ticker) 
    {
      getPrices();
    }
  }, [ticker, timeframe]);

  return { data, loading, error };
}