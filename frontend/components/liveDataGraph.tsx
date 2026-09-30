'use client';
import { useRealTimeTicks } from '@/hooks/useRealTimeTicks';
import { useEffect, useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className='rounded-lg border border-white/10 bg-[#12121c] px-3 py-2 text-xs shadow-lg'>
                {data.price !== undefined && <p className='tabular-nums mb-0.5 font-semibold'>Price {Number(data.price).toFixed(2)}</p>}
                <p className='tabular-nums text-white/60'>volume: {data.volume}</p>
            </div>
        );
    }
    return null;
};

export function LiveDataGraph({ symbol }: { symbol: string | null }) {
    const { realTimeTicks, loading, error, refetch } = useRealTimeTicks(symbol);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
            setLastUpdated(new Date());
        }, (300000));
        return () => clearInterval(interval);
    }, [refetch])

    if (loading) return <div aria-busy='true' className='h-[250px] w-full animate-pulse rounded-2xl bg-white/[0.03]'><span className='sr-only'>Loading...</span></div>;
    if (error) return <p role='alert' className='rounded-2xl border border-[var(--border)] p-6 text-sm text-[#ff6b72]'>{error}</p>;

    if (!realTimeTicks || realTimeTicks.length === 0) {
        return (
            <div className='flex h-[250px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center'>
                <p className='text-sm text-white/75'>No live price data yet</p>
                <p className='mt-1 text-xs text-[var(--muted)]'>The chart will update automatically every 5 minutes.</p>
            </div>
        );
    }

    return (
        <div className='w-full rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4'>
            <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={realTimeTicks}
                        margin={{ top: 5, right: 16, left: 4, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id={`grad-${'price'}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.4} />
                                <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 10 }} />
                        <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.25)' }}
                            content={<CustomTooltip />}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            name="Price"
                            stroke='#1c75bc'
                            strokeWidth={2.5}
                            fill={`url(#grad-${'price'})`}
                            dot={false}
                            activeDot={{ r: 5, stroke: '#1c75bc', fill: '#12121c', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <p className='tabular-nums mt-2 text-right text-[10px] text-white/40'>
                Time vs Price · updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
}
