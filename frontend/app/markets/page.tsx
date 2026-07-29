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
      <div className=''>
        <LiveDataGraph symbol={'AAPL'} />
      </div>
    </div>
  )
}
