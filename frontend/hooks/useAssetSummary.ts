import { useState, useEffect } from 'react';
import { fetchAssetSummary } from '@/lib/api/assets';
import type { AssetSummary } from '@/lib/types/assets';

export function useAssetSummary(ticker: string) {
  const [data, setData] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        if (e instanceof Error) 
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

    if (ticker) 
    {
      getSummary();
    }
  }, [ticker]);

  return { data, loading, error };
}