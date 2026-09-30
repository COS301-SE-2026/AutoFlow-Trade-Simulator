'use client';

import { useParams } from 'next/navigation';
import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';
import { Navbar } from '@/components/navbar';
import BuySellForm from '@/components/BuySellForm';
import { useHoldings } from '@/hooks/useHoldings';
import { useAccount } from '@/lib/hooks/accountContext';
import { apiClient } from '@/lib/api';
import { LiveDataGraph } from '@/components/liveDataGraph';
import { useState } from 'react';
import Toast from '@/components/Toast';
import { TopMovers } from '@/components/topMovers';
import { PageError } from '@/components/PageError';
import { Skeleton } from '@/components/ui/skeleton';

function AssetSkeleton() {
  return (
    <>
      <Navbar />
      <div aria-busy='true' aria-label='Loading…' className='flex min-h-[calc(100dvh-4rem)]'>
        <aside className='hidden lg:flex flex-col w-100 shrink-0 border-r border-[var(--border)] p-4 gap-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-xl' />
          ))}
        </aside>
        <main className='flex-1 flex flex-col gap-5 p-6 min-w-0'>
          <span className='sr-only'>Loading...</span>
          <Skeleton className='h-8 w-28' />
          <Skeleton className='h-[380px] w-full rounded-2xl' />
          <Skeleton className='h-56 w-full rounded-2xl' />
        </main>
      </div>
    </>
  );
}

export default function AssetPage() {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const params = useParams();
  const iTicker = params?.ticker ? decodeURIComponent(params.ticker as string) : null;
  const ticker = iTicker?.replace('-', '/');

  const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(ticker || '', '1d');
  const { data: summary, loading: summaryLoading, error: summaryError } = useAssetSummary(ticker || '');

  const { activeAccount, refetchAccounts } = useAccount();
  const { holdings, refetch: refetchHoldings } = useHoldings(activeAccount?.id ?? null);

  if (!ticker) return <PageError message='Invalid ticker' />;
  if (pricesLoading || summaryLoading) return <AssetSkeleton />;
  if (pricesError || summaryError) return <PageError message={`Error: ${pricesError || summaryError}`} />;

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
      setToast({ message: 'No active account is selected', type: 'warning' });
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
      setToast({ message: `Successfully bought ${quantity} units of ${ticker}`, type: 'success' });
    } catch (e: any) {
      setToast({ message: `Failed to execute order: ${e.message}`, type: 'error' });
    }
  }

  const handleSell = async (quantity: number, orderType: 'market' | 'limit' | 'stop-loss' = 'market', limitPrice?: number) => {
    if (!activeAccount) {
      setToast({ message: 'No active account is selected', type: 'warning' });
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
      setToast({ message: `Successfully sold ${quantity} units of ${ticker}`, type: 'success' });
    } catch (e: any) {
      setToast({ message: `Failed to execute order: ${e.message}`, type: 'error' });
    }
  }

  return (
    <div>
      <Navbar />

      <div className='flex min-h-[calc(100dvh-4rem)]'>
        <aside className='hidden lg:flex flex-col w-100 shrink-0 border-r border-[var(--border)] p-4 overflow-y-auto'>
          <TopMovers />
        </aside>

        <main className='flex-1 flex flex-col gap-5 p-6 min-w-0'>
          <div className='flex justify-evenly' aria-live='polite'>
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </div>

          <div>
            <h1 className='font-mono text-2xl font-bold uppercase tracking-widest' translate='no'>{ticker}</h1>
          </div>

          <div>
            <LiveDataGraph symbol={ticker} />
          </div>

          <div>
            <BuySellForm
              price={currentPrice}
              accountBalance={accountBalance}
              currentHoldings={currentHoldings}
              onBuy={handleBuy}
              onSell={handleSell}
            />
          </div>
        </main>
      </div>
    </div>
  );
}