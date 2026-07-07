'use client';

import { useAssetSummary } from '../hooks/useAssetSummary';
import { usePrices } from '@/hooks/usePrices';

interface SummaryBarProps {
  ticker: string;
}

export default function AssetSummaryBar({ ticker }: SummaryBarProps) {
  const { data, loading } = useAssetSummary(ticker);
  const { data: prices } = usePrices(ticker, '1d');

  if (loading)
  {
    return <div className="card">Loading summary...</div>;
  }

  if (!data)
  {
    return <div className="card">No summary data available</div>;
  }

  const openPrice = prices && prices.length > 0 ? prices[0].open : null;
  const priceColor = openPrice && data.current_price > openPrice ? 'text-green-600' : 'text-red-600';

  return (
    <div className="card p-6">
      <div className="flex flex-row gap-6 justify-evenly">
        <div>
          <p className="text-sm text">Ticker</p>
          <p className="text-2xl text">{data.ticker}</p>
        </div>
        <div>
          <p className="text-sm">Current Price</p>
          <p className={`text-2xl ${priceColor}`}>{data.current_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm">Daily High</p>
          <p className="text-2xl">{data.daily_high.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm">Daily Low</p>
          <p className="text-2xl">{data.daily_low.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}