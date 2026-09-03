'use client';
import { useHoldings, type HoldingsWithCurrPrice } from '@/hooks/useHoldings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';

type HoldingCardData =
    {
        asset_id: number;
        ticker: string;
        net_quantity: number;
        average_cost: number;
        current_price: number | null;
        unrealised_pnl: number | null;
        pct_change: number | null;
    };

function buildHoldingCardData(h: HoldingsWithCurrPrice): HoldingCardData {
    const costBasis = h.average_cost * h.net_quantity;
    const pct_change =
        h.unrealised_pnl === null || costBasis === 0
            ? null
            : (h.unrealised_pnl / Math.abs(costBasis)) * 100;

    return { ...h, pct_change };
}

function fmt(n: number, decimals = 2): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, })
}


type TrendIconProps = {
    up: boolean;
}

function TrendIcon({ up }: TrendIconProps) {
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

type CostRangeBarProps = {
    avgCost: number;
    current: number;
}

function CostRangeBar({ avgCost, current }: CostRangeBarProps) {
    const low = Math.min(avgCost, current);
    const high = Math.max(avgCost, current);
    const range = high - low;
    const pct = range === 0 ? 50 : ((current - low) / range) * 100;
    return (
        <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] text-muted-foreground">avg {fmt(avgCost)}</span>
            <div className="relative flex-1 h-[3px] rounded-full bg-muted overflow-visible">
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-background bg-foreground shadow"
                    style={{ left: `${pct}%` }}
                />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">now {fmt(current)}</span>
        </div>
    );
}

type HoldingRowProps = {
    holding: HoldingCardData;
    index: number;
    active: boolean;
    onSelectAction: (ticker: string) => void;
}

function HoldingRow({ holding, index, active, onSelectAction }: HoldingRowProps) {
    const hasLivePrice = holding.current_price !== null && holding.pct_change !== null;
    const isUp = hasLivePrice && holding.pct_change! >= 0;

    const trendClass = isUp ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
    const badgeClass = isUp
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10';

    return (
        <li
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
        >
            <button
                type="button"
                onClick={() => onSelectAction(holding.ticker)}
                aria-pressed={active}
                className={`group flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:border-border hover:bg-accent/40 hover:shadow-sm ${active ? 'border-primary bg-accent/30' : 'border-border/60 bg-card'
                    }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-semibold tracking-widest uppercase text-foreground">
                            {holding.ticker}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">{holding.net_quantity} shares</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasLivePrice ? (
                            <>
                                <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                                    ${fmt(holding.current_price!)}
                                </span>
                                <Badge variant="outline" className={`gap-1 px-2 py-0.5 text-xs font-mono font-semibold ${badgeClass}`}>
                                    <span className={trendClass}><TrendIcon up={isUp} /></span>
                                    {isUp ? '+' : ''}{fmt(holding.pct_change!)}%
                                </Badge>
                            </>
                        ) : (
                            <Badge variant="outline" className="px-2 py-0.5 text-xs font-mono text-muted-foreground">
                                No live price
                            </Badge>
                        )}
                    </div>
                </div>

                {hasLivePrice && <CostRangeBar avgCost={holding.average_cost} current={holding.current_price!} />}
            </button>
        </li>
    );
}
type HoldingProps = {
    holdings: HoldingsWithCurrPrice[];
    loading: boolean;
    error: string | null;
    onSelectAction?: (ticker: string) => void;
    selectedTicker?: string | null;
}


export function HoldingsSummary({ holdings, loading, error, onSelectAction = () => { }, selectedTicker = null }: HoldingProps) {
    const cardData = holdings.map(buildHoldingCardData);
    return (
        <Card className='w-full max-w-md'>
            <CardHeader className='pb-3'>
                <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Holdings
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <p className="text-sm text-destructive font-mono">{error}</p>
                ) : loading ? (
                    <ul className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <li key={i} className="h-[62px] rounded-xl border border-border/40 bg-muted/40 animate-pulse" />
                        ))}
                    </ul>
                ) : cardData.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-mono">No holdings.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {cardData.map((h, i) => (
                            <HoldingRow
                                key={h.asset_id}
                                holding={h}
                                index={i}
                                active={h.ticker === selectedTicker}
                                onSelectAction={onSelectAction}
                            />
                        ))}
                    </ul>
                )}
            </CardContent>

        </Card>

    );
}
