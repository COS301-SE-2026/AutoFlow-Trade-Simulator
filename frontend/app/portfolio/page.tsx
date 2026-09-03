'use client';

import React, { useMemo, useState } from 'react'

import { useAccount } from '@/lib/hooks/accountContext';

import { Navbar } from '@/components/navbar';

import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

import { PortfolioCashBalance } from "@/components/portfolioCashBalance"
import { PortfolioInvested } from "@/components/portfolioInvested"
import { PortfolioTotalValue } from "@/components/portfolioTotalValue"

import { HoldingsSummary } from "@/components/HoldingsSummary";

import AssetSummaryBar from '@/components/AssetSummaryBar';

import { useRealTimeTicksList } from '@/hooks/useRealTimeTicks';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';

import PriceChart from '@/components/charts/priceChart';
import { PortfolioPerformanceChart } from '@/components/charts/portfolioPerformanceChart';
import { useHoldings } from '@/hooks/useHoldings';

export default function PortfolioPage() {
  const { activeAccount } = useAccount();
  const { realTimeTicksList, loading, error } = useRealTimeTicksList();
  const { holdings, loading: holdingsLoading, error: holdingsError } = useHoldings(activeAccount?.id ?? null)

  const [query, setQuery] = useState('');
  const [ticker, setTicker] = useState<string | null>('AAPL');

  const fuse = useMemo(() => new Fuse(realTimeTicksList, {
    threshold: 0.3,
    includeScore: true,
  }), [realTimeTicksList]);

  const suggestions = useMemo(() => {
    if (query.trim().length == 0) {
      return [];
    }

    const results = fuse.search(query.trim().toUpperCase());
    return results.map(r => r.item).slice(0, 10);
  }, [query, fuse]);

  const handleSelect = (value: string | null) => {
    if (!value) return;

    setTicker(value);
    setQuery('');
  }
  const selectedHolding = holdings.find(h => h.ticker === ticker) ?? null;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading tickers</div>;

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', }}>
        <Combobox value={query} onChange={handleSelect}>
          <div className='flex gap-2'>
            <Search />
            <ComboboxInput
              placeholder={'Ticker Search...'}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
            />
          </div>
          {suggestions.length > 0 ? (
            <ComboboxOptions anchor={{ to: 'bottom start' }} style={{ position: 'absolute', background: '#171620' }}>
              {suggestions.map((ticker) => (
                <ComboboxOption key={ticker} value={ticker} className='px-2 py-2' style={{ background: '#171620' }}>
                  {ticker}
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          ) : (
            <></>
          )}
        </Combobox>
      </div>


      <div className="flex w-full gap-6 p-4">
        {activeAccount ? (
          <>
            <PortfolioCashBalance accountId={activeAccount.id} />
            <PortfolioInvested accountId={activeAccount.id} />
            <PortfolioTotalValue accountId={activeAccount.id} />
          </>
        ) :
          <TradingAuthPrompt />
        }
      </div>
      {activeAccount && (
        <div className="w-full p-4">
          <PortfolioPerformanceChart accountId={activeAccount.id} />
        </div>
      )}
      <div className="flex w-full gap-6 p-4">
        {activeAccount ? (
          <HoldingsSummary
            holdings={holdings}
            loading={holdingsLoading}
            error={holdingsError}
            selectedTicker={ticker}
            onSelectAction={(selected) => { setTicker(selected); setQuery(''); }}
          />
        ) : <TradingAuthPrompt />}
        <AssetSummaryBar ticker={ticker || 'AAPL'} holding={selectedHolding} />
      </div>
      <div className="overflow-hidden p-3">
        <div className='bg-card rounded-xl border-border/60 p-3'>
          <PriceChart ticker={ticker || 'AAPL'} />
        </div>
      </div>
    </>
  )
}
