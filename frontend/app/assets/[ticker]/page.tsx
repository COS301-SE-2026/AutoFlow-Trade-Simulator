'use client';

import { useParams } from 'next/navigation';
import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';
import AssetSummaryBar from '@/components/AssetSummaryBar';
import PriceChart from '@/components/charts/priceChart';

export default function AssetPage() {
  const params = useParams();
  const ticker = params?.ticker ? decodeURIComponent(params.ticker as string) : null;

  const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(ticker || '', '1d');
  const { data: summary, loading: summaryLoading, error: summaryError } = useAssetSummary(ticker || '');

  if (!ticker) return <div>Invalid ticker</div>;
  if (pricesLoading || summaryLoading) return <div>Loading...</div>;
  if (pricesError || summaryError) return <div>Error: {pricesError || summaryError}</div>;

  return (
    <div>
      <h1>{ticker}</h1>
      <AssetSummaryBar ticker={ticker} />
      <div>
        <PriceChart ticker={ticker} />
      </div>
    </div>
  );
}