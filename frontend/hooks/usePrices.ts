import { useState, useEffect } from 'react';
import { fetchAssetPrices } from '@/lib/api/assets';
import { ApiError } from '@/lib/api';
import type { OHLCV } from '@/lib/types/assets';

export function usePrices(ticker: string, timeframe: string, count?: number) {
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker)
    {
      setLoading(false);
      setData([]);
      return;
    }

    if(!count) {
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
        if (e instanceof ApiError && e.status === 401) 
        {
          setData([]);
        } 
        else if (e instanceof Error) 
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
    
  }

  const getPrices = async () => {
    setLoading(true);
    setError(null);
    
    try 
    {
      const result = await fetchAssetPrices(ticker, timeframe, count);
      setData(result);
    } 
    catch (e) 
    {
      if (e instanceof ApiError && e.status === 401) 
      {
        setData([]);
      } 
      else if (e instanceof Error) 
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
  
  getPrices();
  

  }, [ticker, timeframe, count]);

  return { data, loading, error };
}