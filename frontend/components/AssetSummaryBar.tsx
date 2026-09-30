'use client';

import { HoldingsWithCurrPrice } from '@/hooks/useHoldings';
import { useAssetSummary } from '../hooks/useAssetSummary';
import PriceChart from '@/components/charts/priceChart';

interface SummaryBarProps {
  ticker: string | null;
  holding?: HoldingsWithCurrPrice | null;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AssetSummaryBar({ ticker, holding = null }: SummaryBarProps) {
  const { data, loading, error } = useAssetSummary(ticker);

  const openPrice = data?.open_price ?? null;
  const dayChangePct = data && openPrice ? ((data.current_price - openPrice) / openPrice) * 100 : null;
  const priceColor = dayChangePct !== null && dayChangePct >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]';

  const stat = (label: string, value: React.ReactNode, sub?: React.ReactNode, cls = '') => (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-white/50">{label}</dt>
      <dd className={`tabular mt-1 truncate text-2xl font-semibold ${cls}`}>{value}</dd>
      {sub}
    </div>
  );

  return (
    <div className="w-full min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5">
      {!ticker ? (
        <p className='text-sm text-muted-foreground'>Select a holding to view its summary</p>
      ) : loading ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-7 w-24 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))}
          <span className="sr-only">Loading summary...</span>
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No summary data available</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stat('Ticker', <span translate="no">{data.ticker}</span>)}
            {stat(
              'Current Price',
              data.current_price.toFixed(2),
              dayChangePct !== null && (
                <p className={`tabular mt-0.5 text-sm ${priceColor}`}>
                  {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}% today
                </p>
              ),
              priceColor,
            )}
            {stat('Daily High', data.daily_high.toFixed(2))}
            {stat('Daily Low', data.daily_low.toFixed(2))}
          </dl>

          {holding && (
            <dl className="mt-5 grid grid-cols-3 gap-6 border-t border-[var(--border)] pt-5">
              <div>
                <dt className="text-xs font-medium text-white/50">Shares Owned</dt>
                <dd className="tabular mt-1 text-xl font-semibold">{holding.net_quantity}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-white/50">Avg. Cost</dt>
                <dd className="tabular mt-1 text-xl font-semibold">{fmt(holding.average_cost)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-white/50">Total Value</dt>
                <dd className="tabular mt-1 text-xl font-semibold">{fmt(holding.net_quantity * data.current_price)}</dd>
              </div>
            </dl>
          )}
        </>
      )}

      {ticker && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <PriceChart ticker={ticker} />
        </div>
      )}
    </div>
  );
}
