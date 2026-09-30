'use client';

import {useEffect, useMemo, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Search, TrendingUp, TrendingDown} from 'lucide-react';
import {fetchChartBars, fetchTopMovers} from '@/lib/api/assets';
import type {ChartBar} from '@/lib/types/assets';
import {useRouter} from "next/navigation";
import {useRealTimeTicksList} from "@/hooks/useRealTimeTicks";
import Fuse from "fuse.js";

const MOVERS_LIMIT = 8;
const MAX_SEARCH_RESULTS = 5;

type MoverData = {
    ticker: string;
    current_price: number;
    daily_high: number;
    daily_low: number;
    pct_change: number;
    timestamp: string;
};

function buildMoverData(ticker: string, bars: ChartBar[]): MoverData | null {
    // chart_predef returns newest-first; walk oldest-to-newest like the old OHLCV data did.
    const candles = [...bars].reverse().filter((b) => b.close !== null);
    if (candles.length === 0) return null;

    const today = candles[candles.length - 1];
    if (today.close === null || today.high === null || today.low === null) return null;

    const prevBar = candles.length >= 2 ? candles[candles.length - 2] : null;
    const prevClose = prevBar?.close ?? today.open ?? today.close;

    return {
        ticker,
        current_price: today.close,
        daily_high: today.high,
        daily_low: today.low,
        pct_change: prevClose ? ((today.close - prevClose) / prevClose) * 100 : 0,
        timestamp: today.time,
    };
}

function fmt(n: number, decimals = 2): string {
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function TrendIcon({up}: { up: boolean }) {
    const Icon = up ? TrendingUp : TrendingDown;
    return <Icon aria-hidden="true" className="inline-block h-3.5 w-3.5 shrink-0" strokeWidth={2}/>;
}

function RangeBar({low, high, current}: { low: number; high: number; current: number }) {
    const range = high - low;
    const pct = range === 0 ? 50 : Math.min(100, Math.max(0, ((current - low) / range) * 100));
    return (
        <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{fmt(low)}</span>
            <div className="relative flex-1 h-[3px] rounded-full bg-white/[0.08] overflow-visible">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-white/25"
                    style={{width: `${pct}%`}}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-background bg-foreground shadow"
                    style={{left: `${pct}%`}}
                />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{fmt(high)}</span>
        </div>
    );
}

function MoverRow({mover, index, onSelect}: { mover: MoverData; index: number; onSelect: (ticker: string) => void }) {
    const isUp = mover.pct_change >= 0;

    const trendClass = isUp
        ? 'text-[var(--green-light)]'
        : 'text-[#ff6b72]';

    const badgeClass = isUp
        ? 'bg-[rgba(141,198,63,0.12)] text-[var(--green-light)] border-[rgba(141,198,63,0.25)] hover:bg-[rgba(141,198,63,0.12)]'
        : 'bg-[rgba(237,28,36,0.12)] text-[#ff6b72] border-[rgba(237,28,36,0.25)] hover:bg-[rgba(237,28,36,0.12)]';

    return (
        <li
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            style={{animationDelay: `${index * 60}ms`, animationFillMode: 'both'}}
        >
            <button
                type="button"
                onClick={() => onSelect(mover.ticker)}
                className="group flex w-full flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-white/[0.02] px-4 py-3 text-left transition-[background-color,border-color] duration-200 hover:border-[rgba(28,117,188,0.45)] hover:bg-white/[0.04]"
            >
            <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-semibold tracking-widest uppercase text-foreground" translate="no">
          {mover.ticker}
        </span>

                <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {mover.ticker === 'BTC'
                ? `$${fmt(mover.current_price, 0)}`
                : `$${fmt(mover.current_price)}`}
          </span>

                    <Badge
                        variant="outline"
                        className={`gap-1 px-2 py-0.5 text-xs font-mono font-semibold ${badgeClass}`}
                    >
            <span className={trendClass}>
              <TrendIcon up={isUp}/>
            </span>
                        {isUp ? '+' : ''}
                        {fmt(mover.pct_change)}%
                    </Badge>
                </div>
            </div>

            <RangeBar
                low={mover.daily_low}
                high={mover.daily_high}
                current={mover.current_price}
            />
            </button>
        </li>
    );
}

export function TopMovers() {
    const router = useRouter();
    const handleSelectTicker = (ticker: string) => router.push(`/assets/${encodeURIComponent(ticker)}`);

    const [movers, setMovers] = useState<MoverData[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MoverData[] | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const isSearching = query.trim().length > 0;

    const {realTimeTicksList} = useRealTimeTicksList();

    const fuse = useMemo(() => new Fuse(realTimeTicksList, {
        threshold: 0.3,
    }), [realTimeTicksList]);

    const matchedTickers = useMemo(() => {
        if (!isSearching) return [];
        const results = fuse.search(query.trim().toUpperCase());
        return results.map((r) => r.item).slice(0, MAX_SEARCH_RESULTS);
    }, [query, isSearching, fuse]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const movers = await fetchTopMovers(MOVERS_LIMIT);

                if (cancelled) return;

                setMovers(movers);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load movers');
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isSearching) {
            setSearchResults(null);
            return;
        }

        let cancelled = false;

        async function search() {
            setSearchLoading(true);
            try {
                const results = await Promise.all(
                    matchedTickers.map((ticker) =>
                        fetchChartBars(ticker, '1d')
                            .then((bars) => buildMoverData(ticker, bars))
                            .catch(() => null),
                    ),
                );

                if (cancelled) return;

                const valid = results.filter((r): r is MoverData => r !== null);
                setSearchResults(valid);
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        }

        search();
        return () => {
            cancelled = true;
        };
    }, [matchedTickers, isSearching]);

    const displayedMovers = isSearching ? searchResults : movers;
    const displayedLoading = isSearching ? searchLoading || searchResults === null : movers === null;
    const latestTimestamp = displayedMovers?.[0]?.timestamp;

    return (
        <Card className="w-full max-w-md border-[var(--border)] bg-[rgba(14,14,22,0.75)]">
            <CardHeader className="pb-3">
                <div className="relative mt-2">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        type="search"
                        aria-label="Search tickers"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Search tickers…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        className="h-9 w-full pl-8"
                    />
                </div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    {isSearching ? (
                        'Search Results'
                    ) : (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[var(--green-light)] opacity-75"/>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--green-light)]"/>
                            </span>
                            Top Movers Today
                        </>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent>
                {isSearching && matchedTickers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matching tickers.</p>
                ) : !isSearching && error ? (
                    <p role="alert" className="text-sm text-[#ff6b72]">{error}</p>
                ) : displayedLoading ? (
                    <ul className="flex flex-col gap-2">
                        {Array.from({length: isSearching ? matchedTickers.length : MOVERS_LIMIT}).map((_, i) => (
                            <li
                                key={i}
                                className="h-[62px] rounded-xl border border-[var(--border)] bg-white/[0.03] animate-pulse"
                            />
                        ))}
                    </ul>
                ) : displayedMovers === null || displayedMovers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {isSearching ? 'No data available for matching tickers.' : 'No data available.'}
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {displayedMovers.map((m, i) => (
                            <MoverRow key={m.ticker} mover={m} index={i} onSelect={handleSelectTicker}/>
                        ))}
                    </ul>
                )}

                {latestTimestamp && (
                    <p className="mt-3 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                        Last updated{' '}
                        {new Date(latestTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}