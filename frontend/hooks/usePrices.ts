import { useState, useEffect } from 'react';
import { fetchChartBars, fetchRealTimeTicks } from '@/lib/api/assets';
import { ApiError } from '@/lib/api';
import type { ChartBar, ChartInterval, OHLCV, RealTimeTick } from '@/lib/types/assets';

const INTRADAY_INTERVAL_MS: Record<string, number> = {
  '1min': 60_000,
  '5min': 5 * 60_000,
  '15min': 15 * 60_000,
  '30min': 30 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
};

const CHART_INTERVALS: ChartInterval[] = ['1d', '1w', '1m', '6m', '1y'];

function isChartInterval(timeframe: string): timeframe is ChartInterval {
  return (CHART_INTERVALS as string[]).includes(timeframe);
}


function aggregateTicks(
  ticks: RealTimeTick[],
  symbol: string,
  timeframe: string,
): OHLCV[] {
  const bucketMs = INTRADAY_INTERVAL_MS[timeframe] ?? INTRADAY_INTERVAL_MS['1h'];

  const sorted = [...ticks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const bars: OHLCV[] = [];
  let current: OHLCV | null = null;
  let currentBucket = Number.NaN;

  for (const tick of sorted) {
    const time = new Date(tick.timestamp).getTime();
    if (Number.isNaN(time)) continue;

    const bucket = Math.floor(time / bucketMs) * bucketMs;

    if (!current || bucket !== currentBucket) {
      current = {
        timestamp: new Date(bucket).toISOString(),
        symbol,
        interval: timeframe,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      };
      currentBucket = bucket;
      bars.push(current);
      continue;
    }

    current.high = Math.max(current.high, tick.price);
    current.low = Math.min(current.low, tick.price);
    current.close = tick.price;
    current.volume += tick.volume;
  }

  return bars;
}


function toOHLCV(bars: ChartBar[], symbol: string, interval: ChartInterval): OHLCV[] {
  return bars
    .filter(
      (bar): bar is ChartBar & { open: number; high: number; low: number; close: number } =>
        bar.open !== null && bar.high !== null && bar.low !== null && bar.close !== null,
    )
    .map((bar) => ({
      timestamp: bar.time,
      symbol,
      interval,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }))
    .reverse();
}

export function usePrices(ticker: string, timeframe: string, count?: number) {
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setLoading(false);
      setData([]);
      return;
    }

    let cancelled = false;

    const getPrices = async () => {
      setLoading(true);
      setError(null);

      const symbol = ticker.toUpperCase();

      try {
        const bars = isChartInterval(timeframe)
          ? toOHLCV(await fetchChartBars(ticker, timeframe), symbol, timeframe)
          : aggregateTicks(await fetchRealTimeTicks(ticker), symbol, timeframe);

        if (cancelled) return;
        setData(count !== undefined ? bars.slice(-count) : bars);
      } catch (e) {
        if (cancelled) return;

        if (e instanceof ApiError && e.status === 401) {
          setData([]);
        } else if (e instanceof Error) {
          setError(e.message);
          setData([]);
        } else {
          setError('Failed to fetch prices');
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getPrices();

    return () => {
      cancelled = true;
    };
  }, [ticker, timeframe, count]);

  return { data, loading, error };
}
