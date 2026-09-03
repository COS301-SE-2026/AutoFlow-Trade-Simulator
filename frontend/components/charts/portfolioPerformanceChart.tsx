'use client';

import { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';

type Timeframe = '1W' | '1M' | '3M' | 'All';

const TIMEFRAME_DAYS: Record<Timeframe, number | null> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    'All': null,
};

function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const point = payload[0].payload;
        return (
            <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                <p className="mb-1 text-muted-foreground">{point.date}</p>
                <p className="font-semibold">{fmt(point.value)}</p>
            </div>
        );
    }
    return null;
};

interface PortfolioPerformanceChartProps {
    accountId: number | null;
}

export function PortfolioPerformanceChart({ accountId }: PortfolioPerformanceChartProps) {
    const { points, loading, error } = usePortfolioHistory(accountId);
    const [timeframe, setTimeframe] = useState<Timeframe>('1M');

    const chartData = useMemo(() => {
        const days = TIMEFRAME_DAYS[timeframe];
        const sliced = days ? points.slice(-days) : points;
        return sliced.map((p) => ({ date: p.date, value: p.total_value }));
    }, [points, timeframe]);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Portfolio Performance</CardTitle>
                <div className="flex gap-1">
                    {(Object.keys(TIMEFRAME_DAYS) as Timeframe[]).map((tf) => (
                        <Button
                            key={tf}
                            type="button"
                            size="sm"
                            variant={timeframe === tf ? 'default' : 'ghost'}
                            onClick={() => setTimeframe(tf)}
                        >
                            {tf}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <p className="text-sm text-destructive font-mono">{error}</p>
                ) : loading ? (
                    <div className="h-[240px] w-full animate-pulse rounded-xl bg-muted/40" />
                ) : chartData.length < 2 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                        Make a trade to start tracking your portfolio&apos;s performance.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="gradPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                                width={70}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--muted-foreground)' }} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="var(--blue)"
                                strokeWidth={2.5}
                                fill="url(#gradPortfolioValue)"
                                dot={false}
                                activeDot={{ r: 4, stroke: 'var(--blue)' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
