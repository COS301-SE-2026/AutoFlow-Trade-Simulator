'use client';

import { useAccount } from '@/lib/hooks/accountContext';

import { Navbar } from '@/components/navbar';

import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

import { LiveDataGraph } from '@/components/liveDataGraph';

export default function MarketsPage() {
  const { activeAccount } = useAccount();

  return (
    <div>
      <Navbar />
      <main>
        <div className="shell">
          <section className="hero">
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
              <div className="flex w-full max-w-sm flex-col gap-6">
                <LiveDataGraph symbol={'AAPL'} />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
