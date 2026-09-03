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
      <div className="w-full max-w-sm p-4">
        <Combobox value={query} onChange={handleSelect}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <ComboboxInput
              placeholder="Ticker Search..."
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pl-8 pr-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {suggestions.length > 0 && (
            <ComboboxOptions
              anchor={{ to: 'bottom start', gap: 4 }}
              className="z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
            >
              {suggestions.map((t) => (
                <ComboboxOption
                  key={t}
                  value={t}
                  className="cursor-pointer rounded-md px-2.5 py-1.5 data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                >
                  {t}
                </ComboboxOption>
              ))}
            </ComboboxOptions>
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
    </>
  )
}
