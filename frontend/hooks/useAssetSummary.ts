import { useState, useEffect } from 'react';
import { fetchAssetSummary } from '@/lib/api/assets';
import { ApiError } from '@/lib/api';
import type { AssetSummary } from '@/lib/types/assets';

export function useAssetSummary(ticker: string) {
  const [data, setData] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker)
    {
      setLoading(false);
      setData(null);
      return;
    }

    const getSummary = async () => {
      setLoading(true);
      setError(null);

      try 
      {
        const result = await fetchAssetSummary(ticker);
        setData(result);
      } 
      catch (e) 
      {
        if (e instanceof ApiError && e.status === 401) 
        {
          setData(null);
        } 
        else if (e instanceof Error) 
        {
          setError(e.message);
        } 
        else 
        {
          setError('Failed to fetch asset summary');
        }
        setData(null);
      } 
      finally 
      {
        setLoading(false);
      }
    };

    getSummary();
  }, [ticker]);

  return { data, loading, error };
}