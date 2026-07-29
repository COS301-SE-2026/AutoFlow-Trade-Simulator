'use client';

import { useParams } from 'next/navigation';
import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';
import AssetSummaryBar from '@/components/AssetSummaryBar';
import PriceChart from '@/components/charts/priceChart';
import { Navbar } from '@/components/navbar';
import BuySellForm from '@/components/BuySellForm';
import { useHoldings } from '@/hooks/useHoldings';
import { useAccount } from '@/lib/hooks/accountContext';
import { apiClient } from '@/lib/api';
import { LiveDataGraph } from '@/components/liveDataGraph';
import { useState } from 'react';
import Link from 'next/link';

export default function AssetPage() {
  const params = useParams();
  const iTicker = params?.ticker ? decodeURIComponent(params.ticker as string) : null;
  const ticker = iTicker?.replace('-', '/');

  const [nextTicker, setNextTicker] = useState(ticker);

  const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(ticker || '', '1d');
  const { data: summary, loading: summaryLoading, error: summaryError } = useAssetSummary(ticker || '');

  const { activeAccount } = useAccount();
  const { holdings, refetch: refetchHoldings } = useHoldings(activeAccount?.id ?? null);

  if (!ticker) return <div>Invalid ticker</div>;
  if (pricesLoading || summaryLoading) return <div>Loading...</div>;
  if (pricesError || summaryError) return <div>Error: {pricesError || summaryError}</div>;

  const currentPrice = prices.length > 0
    ? prices[prices.length - 1].close
    : summary?.current_price || 0;

  const accountBalance = activeAccount ? Number.parseFloat(activeAccount.balance) : 0;
  const currentHolding = holdings.find(h => h.ticker === ticker);
  const currentHoldings = currentHolding?.net_quantity || 0;

  const handleBuy = async (quantity: number, orderType: 'market' | 'limit' | 'stop-loss', limitPrice?: number) => {
    if (!activeAccount) {
      alert('No active account is selected');
      return;
    }

    try {
      const response = await apiClient(`/portfolio/accounts/${activeAccount.id}`, {
        method: 'POST',
        body: {
          ticker: ticker,
          direction: 'buy',
          quantity: quantity
        }
      })

      console.log('Buy order executed:', response);
      refetchHoldings();
      alert(`Successfully bought ${quantity} units of ${ticker}`);
    } catch (e: any) {
      alert(`Failed to execute order: ${e.message}`);
    }
  }

  const handleSell = async (quantity: number, orderType: 'market' | 'limit' | 'stop-loss', limitPrice?: number) => {
    if (!activeAccount) {
      alert('No active account is selected');
      return;
    }

    try {
      const response = await apiClient(`/portfolio/accounts/${activeAccount.id}`, {
        method: 'POST',
        body: {
          ticker: ticker,
          direction: 'sell',
          quantity: quantity
        }
      })

      console.log('Sell order executed:', response);
      refetchHoldings();
      alert(`Successfully sold ${quantity} units of ${ticker}`);
    } catch (e: any) {
      alert(`Failed to execute order: ${e.message}`);
    }
  }

  return (
    <div>
      <Navbar />
      <div>
        <h1 className='flex justify-center'>{ticker}</h1>
        <div>
          <input
            type="text"
            placeholder='ticker...'
            value={nextTicker}
            onChange={(e) => {
              if (e.target.value === '') {
                setNextTicker(ticker);
              }
              else {
                setNextTicker(e.target.value);
              }
            }}
          />
          <Link href={`/assets/${nextTicker}`}>Search</Link>
        </div>
        <AssetSummaryBar ticker={ticker} />
        <LiveDataGraph symbol={'AAPL'} />
        <div className='m-4'>
          <BuySellForm
            price={currentPrice}
            accountBalance={accountBalance}
            currentHoldings={currentHoldings}
            onBuy={handleBuy}
            onSell={handleSell} />
        </div>
      </div>
    </div>
  );
}