'use client';

import { useAccount } from '@/lib/hooks/accountContext';
import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

import { Navbar } from '@/components/navbar';

import { PortfolioCashBalance } from "@/components/portfolioCashBalance"
import { PortfolioInvested } from "@/components/portfolioInvested"
import { PortfolioTotalValue } from "@/components/portfolioTotalValue"

export default function PortfolioPage() {
  const { activeAccount } = useAccount();

  return (
    <div>
      <Navbar />

      <main>
        <div className="shell">
          <section className="hero">
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
              <div className="flex w-full max-w-sm flex-col gap-6">
                {activeAccount ? <PortfolioCashBalance accountId={activeAccount.id} /> : <TradingAuthPrompt />}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
