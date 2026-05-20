'use client';

import { useParams } from 'next/navigation';
import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';
import AssetSummaryBar from '@/components/AssetSummaryBar';
import PriceChart from '@/components/charts/priceChart';
import { TopMovers } from '@/components/topMovers';
import { Skeleton } from '@/components/ui/skeleton';

function PageSkeleton() {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/60 p-4 gap-3">
                <Skeleton className="h-6 w-32 mb-2" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
            </aside>

            <main className="flex-1 flex flex-col gap-4 p-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="flex-1 w-full rounded-xl min-h-[400px]" />
            </main>
        </div>
    );
}

function PageError({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-destructive">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="10" cy="14" r="0.75" fill="currentColor" />
                    </svg>
                </div>
                <p className="font-mono text-sm text-destructive">{message}</p>
            </div>
        </div>
    );
}

function TickerHeader({ ticker }: { ticker: string }) {
    return (
        <div className="flex items-baseline gap-3 pb-4 border-b border-border/40">
            <h1 className="font-mono text-2xl font-bold tracking-widest uppercase text-foreground">
                {ticker}
            </h1>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
        NASDAQ
      </span>
        </div>
    );
}

export default function Dashboard() {
    const ticker = 'AAPL';

    const { loading: pricesLoading, error: pricesError } = usePrices(ticker || '', '1d');
    const { loading: summaryLoading, error: summaryError } = useAssetSummary(ticker || '');

    if (!ticker) return <PageError message="Invalid ticker" />;
    if (pricesLoading || summaryLoading) return <PageSkeleton />;
    if (pricesError || summaryError) return <PageError message={pricesError || summaryError || 'Unknown error'} />;

    return (
        <div className="flex min-h-screen bg-background">

            <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/60 p-4 gap-0 overflow-y-auto">
                <TopMovers />
            </aside>

            <main className="flex-1 flex flex-col gap-5 p-6 min-w-0">

                <TickerHeader ticker={ticker} />

                <div className="w-full">
                    <AssetSummaryBar ticker={ticker} />
                </div>

                <div className="h-[500px] rounded-xl border border-border/60 bg-card overflow-hidden">
                    <PriceChart ticker={ticker} />
                </div>

                <div className="lg:hidden">
                    <TopMovers />
                </div>

            </main>
        </div>
    );
}