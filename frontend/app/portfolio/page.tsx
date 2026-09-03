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

  const [ticker, setTicker] = useState<string | null>('AAPL');

  const selectedHolding = holdings.find(h => h.ticker === ticker) ?? null;

  return (
    <>
      <Navbar />
      <div className="grid w-full grid-cols-1 gap-6 p-4 md:grid-cols-3">
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
            onSelectAction={(selected) => setTicker(selected)}
          />
        ) : <TradingAuthPrompt />}
        <AssetSummaryBar ticker={ticker || 'AAPL'} holding={selectedHolding} />
      </div>
    </>
  )
}
