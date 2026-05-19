'use client';

import { useParams } from 'next/navigation';
import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';

export default function AssetPage() {
  const params = useParams();
  const ticker = params?.ticker as string;

  const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(ticker, '1d');
  const { data: summary, loading: summaryLoading, error: summaryError } = useAssetSummary(ticker);

  if (pricesLoading || summaryLoading) return (<div>Loading...</div>);
  if (pricesError || summaryError) return (<div>Error: {pricesError || summaryError}</div>);

  return (
    <div>
      <h1>{ticker}</h1>
    </div>
  );
}