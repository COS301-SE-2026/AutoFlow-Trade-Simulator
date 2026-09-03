'use client';

import { HoldingsWithCurrPrice } from '@/hooks/useHoldings';
import { useAssetSummary } from '../hooks/useAssetSummary';
import PriceChart from '@/components/charts/priceChart';

interface SummaryBarProps {
  ticker: string;
  holding?: HoldingsWithCurrPrice | null;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AssetSummaryBar({ ticker, holding = null }: SummaryBarProps) {
  const { data, loading } = useAssetSummary(ticker);

  const openPrice = data?.open_price ?? null;
  const dayChangePct = data && openPrice ? ((data.current_price - openPrice) / openPrice) * 100 : null;
  const priceColor = dayChangePct !== null && dayChangePct >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="card p-6 w-full flex-1">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading summary...</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No summary data available</p>
      ) : (
        <>
          <div className="flex flex-row gap-6 justify-evenly">
            <div>
              <p className="text-sm text">Ticker</p>
              <p className="text-2xl text">{data.ticker}</p>
            </div>
            <div>
              <p className="text-sm">Current Price</p>
              <p className={`text-2xl ${priceColor}`}>{data.current_price.toFixed(2)}</p>
              {dayChangePct !== null && (
                <p className={`text-sm ${priceColor}`}>
                  {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}% today
                </p>
              )}
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

          {holding && (
            <div className="flex flex-row gap-6 justify-evenly mt-4 pt-4 border-t border-border/60">
              <div>
                <p className="text-sm">Shares Owned</p>
                <p className="text-xl">{holding.net_quantity}</p>
              </div>
              <div>
                <p className="text-sm">Avg. Cost</p>
                <p className="text-xl">{fmt(holding.average_cost)}</p>
              </div>
              <div>
                <p className="text-sm">Total Value</p>
                <p className="text-xl">{fmt(holding.net_quantity * data.current_price)}</p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 pt-4 border-t border-border/60">
        <PriceChart ticker={ticker} />
      </div>
    </div>
  );
}
