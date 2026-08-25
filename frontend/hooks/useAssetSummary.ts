import { useState, useEffect } from 'react';
import { fetchRealTimeTicks } from '@/lib/api/assets';
import { ApiError } from '@/lib/api';
import type { AssetSummary, RealTimeTick } from '@/lib/types/assets';

function summariseTicks(ticker: string, ticks: RealTimeTick[]): AssetSummary | null {
  if (ticks.length === 0) return null;

  const sorted = [...ticks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const latest = sorted[sorted.length - 1];

  return {
    ticker: ticker.toUpperCase(),
    current_price: latest.price,
    daily_high: Math.max(...sorted.map((tick) => tick.price)),
    daily_low: Math.min(...sorted.map((tick) => tick.price)),
    open_price: sorted[0].price,
    timestamp: latest.timestamp,
  };
}

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

    let cancelled = false;

    const getSummary = async () => {
      setLoading(true);
      setError(null);

      try
      {
        const ticks = await fetchRealTimeTicks(ticker);
        if (cancelled) return;
        setData(summariseTicks(ticker, ticks));
      }
      catch (e)
      {
        if (cancelled) return;

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
        if (!cancelled) setLoading(false);
      }
    };

    getSummary();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  return { data, loading, error };
}
