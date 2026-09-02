'use client';

import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {fetchTopMovers} from '@/lib/api/assets';

const MOVERS_LIMIT = 8;

type MoverData = {
    ticker: string;
    current_price: number;
    daily_high: number;
    daily_low: number;
    pct_change: number;
    timestamp: string;
};

function fmt(n: number, decimals = 2): string {
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function TrendIcon({up}: { up: boolean }) {
    return up ? (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="inline-block shrink-0"
        >
            <polyline
                points="1,11 5,5 8,8 13,2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="9,2 13,2 13,6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ) : (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="inline-block shrink-0"
        >
            <polyline
                points="1,3 5,9 8,6 13,12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="9,12 13,12 13,8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function RangeBar({low, high, current}: { low: number; high: number; current: number }) {
    const range = high - low;
    const pct = range === 0 ? 50 : Math.min(100, Math.max(0, ((current - low) / range) * 100));
    return (
        <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] text-muted-foreground">{fmt(low)}</span>
            <div className="relative flex-1 h-[3px] rounded-full bg-muted overflow-visible">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-border"
                    style={{width: `${pct}%`}}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-background bg-foreground shadow"
                    style={{left: `${pct}%`}}
                />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{fmt(high)}</span>
        </div>
    );
}

function MoverRow({mover, index}: { mover: MoverData; index: number }) {
    const isUp = mover.pct_change >= 0;

    const trendClass = isUp
        ? 'text-emerald-500 dark:text-emerald-400'
        : 'text-rose-500 dark:text-rose-400';

    const badgeClass = isUp
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10';

    return (
        <li
            className="group flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all duration-200 hover:border-border hover:bg-accent/40 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2"
            style={{animationDelay: `${index * 60}ms`, animationFillMode: 'both'}}
        >
            <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-semibold tracking-widest uppercase text-foreground">
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
        </li>
    );
}

export function TopMovers() {
    const [movers, setMovers] = useState<MoverData[] | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const latestTimestamp = movers?.[0]?.timestamp;

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
          </span>
                    Top Movers Today
                </CardTitle>
            </CardHeader>

            <CardContent>
                {error ? (
                    <p className="text-sm text-destructive font-mono">{error}</p>
                ) : movers === null ? (
                    <ul className="flex flex-col gap-2">
                        {Array.from({length: MOVERS_LIMIT}).map((_, i) => (
                            <li
                                key={i}
                                className="h-[62px] rounded-xl border border-border/40 bg-muted/40 animate-pulse"
                            />
                        ))}
                    </ul>
                ) : movers.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-mono">No data available.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {movers.map((m, i) => (
                            <MoverRow key={m.ticker} mover={m} index={i}/>
                        ))}
                    </ul>
                )}

                {latestTimestamp && (
                    <p className="mt-3 text-right font-mono text-[10px] text-muted-foreground">
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