'use client';

import { useAccount } from '@/lib/hooks/accountContext';

import { Navbar } from '@/components/navbar';

import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

import { PortfolioCashBalance } from "@/components/portfolioCashBalance"
import { PortfolioInvested } from "@/components/portfolioInvested"
import { PortfolioTotalValue } from "@/components/portfolioTotalValue"

import { HoldingsSummary } from "@/components/HoldingsSummary";

import AssetSummaryBar from '@/components/AssetSummaryBar';

export default function PortfolioPage() {
  const { activeAccount } = useAccount();

  return (
    <>
      <Navbar />
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
      {activeAccount ? <HoldingsSummary accountId={activeAccount.id} /> : <TradingAuthPrompt />}
      <AssetSummaryBar ticker={'AAPL'} />
    </>
  )
}
