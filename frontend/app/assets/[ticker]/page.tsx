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
import { TickerSearch } from '@/components/TickerSearch';
import Link from 'next/link';
import Toast from '@/components/Toast';


export default function AssetPage() {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  const params = useParams();
  const iTicker = params?.ticker ? decodeURIComponent(params.ticker as string) : null;
  const ticker = iTicker?.replace('-', '/');

  const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(ticker || '', '1d');
  const { data: summary, loading: summaryLoading, error: summaryError } = useAssetSummary(ticker || '');

  const { activeAccount, refetchAccounts } = useAccount();
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

  const refreshAccountData = async () => {
    await refetchHoldings();
    await refetchAccounts();
  }

  const handleBuy = async (quantity: number, orderType: 'market' | 'limit' | 'stop-loss' = 'market', limitPrice?: number) => {
    if (!activeAccount) {
      setToast({ message:'No active account is selected', type:'warning' });
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

      //console.log('Buy order executed:', response);

      await refreshAccountData();
      setToast({ message:`Successfully bought ${quantity} units of ${ticker}`, type:'success' });
    } catch (e: any) {
      setToast({ message:`Failed to execute order: ${e.message}`, type:'error' });
    }
  }

  const handleSell = async (quantity: number, orderType: 'market' | 'limit' | 'stop-loss' = 'market', limitPrice?: number) => {
    if (!activeAccount) {
      setToast({ message:'No active account is selected', type:'warning' });
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

      //console.log('Sell order executed:', response);

      await refreshAccountData();
      setToast({ message:`Successfully sold ${quantity} units of ${ticker}`, type: 'success'});
    } catch (e: any) {
      setToast({ message:`Failed to execute order: ${e.message}`, type: 'error'});
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className='flex justify-evenly'>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ textAlign: 'center' }}>{ticker}</h1>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <TickerSearch />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <LiveDataGraph symbol={ticker} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <BuySellForm
            price={currentPrice}
            accountBalance={accountBalance}
            currentHoldings={currentHoldings}
            onBuy={handleBuy}
            onSell={handleSell}
          />
        </div>
      </div>
    </div>
  );
}