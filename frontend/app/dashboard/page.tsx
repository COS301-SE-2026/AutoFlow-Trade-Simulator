'use client';

import { usePrices } from '@/hooks/usePrices';
import { useAssetSummary } from '@/hooks/useAssetSummary';
import AssetSummaryBar from '@/components/AssetSummaryBar';
import PriceChart from '@/components/charts/priceChart';
import { TopMovers } from '@/components/topMovers';
import { Skeleton } from '@/components/ui/skeleton';
import {useAccount} from "@/lib/hooks/accountContext";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {TransactionLog} from "@/components/TransactionLog";
import {TradingAuthPrompt} from "@/components/tradingAuthPrompt";
import {HoldingsSummary} from "@/components/HoldingsSummary";
import {Navbar} from '@/components/navbar';

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
    const {activeAccount} = useAccount();

    if (!ticker) return <PageError message="Invalid ticker" />;
    if (pricesLoading || summaryLoading) return <PageSkeleton />;
    if (pricesError || summaryError) return <PageError message={pricesError || summaryError || 'Unknown error'} />;

    return (
        <div>
            <Navbar />
            <div className="flex min-h-screen bg-background">
                <aside
                    className="hidden lg:flex flex-col w-80 shrink-0 border-r border-border/60 p-4 gap-0 overflow-y-auto">
                    <TopMovers/>
                </aside>

                <main className="flex-1 flex flex-col gap-5 p-6 min-w-0">

                    <TickerHeader ticker={ticker}/>

                    <div className="w-full">
                        <AssetSummaryBar ticker={ticker}/>
                    </div>

                    <div className="h-[500px] rounded-xl border border-border/60 bg-card overflow-hidden">
                        <PriceChart ticker={ticker}/>
                    </div>

                    <div className="lg:hidden">
                        <TopMovers/>
                    </div>

                </main>
            </div>
            <div className="w-full mt-6">
                <Tabs defaultValue="Transactions" className="w-full flex flex-col">   {/* ← added flex flex-col */}
                    <div className="border-b border-border/60">
                        <TabsList className="inline-flex h-9 items-center gap-0 bg-transparent p-0 rounded-none">
                            {(['Transactions', 'Holdings', 'Report'] as const).map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="inline-flex items-center justify-center h-9 px-4 bg-transparent border-0 rounded-none font-mono text-xs uppercase tracking-widest text-muted-foreground border-b-2 border-transparent -mb-px
                       data-[state=active]:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value="Transactions" className="w-full mt-4">
                        {activeAccount ? <TransactionLog accountId={activeAccount.id} /> : <TradingAuthPrompt />}
                    </TabsContent>

                    <TabsContent value="Holdings" className="w-full mt-4">
                        {activeAccount ? <HoldingsSummary accountId={activeAccount.id} /> : <TradingAuthPrompt />}
                    </TabsContent>

                    <TabsContent value="Report" className="w-full mt-4">
                        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border/60 text-muted-foreground font-mono text-xs tracking-widest uppercase">
                            Placeholder for Report
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}