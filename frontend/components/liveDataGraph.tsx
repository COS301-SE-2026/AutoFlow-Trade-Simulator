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
    Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                backgroundColor: '#414042',
                border: '1px solid #ffffff4b',
                padding: '8px',
                borderRadius: '4px',
            }}>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>volume: {data.volume}</p>
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
    }, [])

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={realTimeTicks}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                    <defs>
                        <linearGradient id={`grad-${'price'}`} x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor={'var(--blue)'} stopOpacity={0.8} />
                            <stop offset='95%' stopColor={'var(--blue)'} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
                    <XAxis dataKey="timestamp" stroke="#ffffff" tick={{ fontSize: 10 }} label={{ value: 'Time' }} />
                    <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} label={{ value: 'Price' }} />
                    <Tooltip
                        cursor={{ stroke: '#9ca3af' }}
                        content={<CustomTooltip />}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={'var(--blue)'}
                        strokeWidth={4}
                        fill={`url(#grad-${'price'})`}
                        dot={false}
                        activeDot={{ r: 8, stroke: '#1c75bc' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}