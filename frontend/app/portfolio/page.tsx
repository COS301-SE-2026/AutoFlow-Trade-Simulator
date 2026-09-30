'use client';

import React, { useState } from 'react'

import { useAccount } from '@/lib/hooks/accountContext';

import { Navbar } from '@/components/navbar';

import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

import { PortfolioCashBalance } from "@/components/portfolioCashBalance"
import { PortfolioInvested } from "@/components/portfolioInvested"
import { PortfolioTotalValue } from "@/components/portfolioTotalValue"

import { HoldingsSummary } from "@/components/HoldingsSummary";

import AssetSummaryBar from '@/components/AssetSummaryBar';

import { PortfolioPerformanceChart } from '@/components/charts/portfolioPerformanceChart';
import { useHoldings } from '@/hooks/useHoldings';

export default function PortfolioPage() {
  const { activeAccount } = useAccount();
  const { holdings, loading: holdingsLoading, error: holdingsError } = useHoldings(activeAccount?.id ?? null)

  const [ticker, setTicker] = useState<string | null>(null);

  const selectedHolding = holdings.find(h => h.ticker === ticker) ?? null;

  return (
    <>
      <Navbar />
      <h1 className="sr-only">Portfolio</h1>
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-5 px-4 pt-6 pb-16 md:grid-cols-3 md:px-6">
        {activeAccount ? (
          <>
            <PortfolioCashBalance accountId={activeAccount.id} />
            <PortfolioInvested accountId={activeAccount.id} />
            <PortfolioTotalValue accountId={activeAccount.id} />

            <div className="w-full min-w-0 md:col-span-3">
              <PortfolioPerformanceChart accountId={activeAccount.id} />
            </div>
            <div className="flex w-full min-w-0 flex-col gap-5 md:col-span-3 lg:flex-row">
              <HoldingsSummary
                holdings={holdings}
                loading={holdingsLoading}
                error={holdingsError}
                selectedTicker={ticker}
                onSelectAction={(selected) => setTicker(selected)}
              />
            </div>
            <div className='flex w-full p-4'>
              <AssetSummaryBar ticker={ticker} holding={selectedHolding} />
            </div>

          </>
        ) :
          <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 md:col-span-3">
            <TradingAuthPrompt />
          </div>}
      </div>
    </>
  )
}
