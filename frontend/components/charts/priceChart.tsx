'use client';

import { useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { Label } from '../ui/label';
import { usePrices } from '@/hooks/usePrices';

type Timeframe = 'daily' | 'weekly' | 'monthly';
 
interface PriceChartProps {
  ticker: string;
}
 
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length)
  {
    const data = payload[0].payload;
    return (
      <div className="tabular-nums rounded-lg border border-white/10 bg-[#12121c] px-3 py-2 text-xs shadow-lg">
        <p className="mb-1 font-semibold">{data.name}</p>
        <p className="text-muted-foreground">OPEN: {data.open.toFixed(2)}</p>
        <p className="text-muted-foreground">HIGH: {data.high.toFixed(2)}</p>
        <p className="text-muted-foreground">LOW: {data.low.toFixed(2)}</p>
        <p className="text-muted-foreground">CLOSE: {data.close.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const ChartSkeleton = () => (
  <div aria-busy="true" className="mt-4 flex h-[360px] w-full items-center justify-center rounded-xl bg-white/[0.03] text-sm text-white/40 motion-safe:animate-pulse">
    Loading...
  </div>
);

const TIMEFRAMES: Timeframe[] = ['daily', 'weekly', 'monthly'];
 
export default function PriceChart({ ticker }: PriceChartProps) {

  const timeframeMap: Record<Timeframe, string> = {
    daily: '1d',
    weekly: '1w',
    monthly: '1m',
  };

  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const { data, loading, error } = usePrices(ticker, timeframeMap[timeframe]);

  const chartData = data.map((item) => ({
    ...item,
    name: item.timestamp.split('T')[0],
    value: item.close,
  }));
 
    return (
      <>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <Label id='timeframe-label' className='text-sm font-medium text-white/70'>Select Chart Timeframe:</Label>
          <div role='group' aria-labelledby='timeframe-label' className='inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1'>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type='button'
                aria-pressed={timeframe === tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                  timeframe === tf ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/55 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        {
          loading ? (<ChartSkeleton />)
          : (
          <div className="mt-4 h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 16, left: 4, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c75bc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1c75bc" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} width={70} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.25)' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1c75bc"
                  strokeWidth={2.5}
                  fill="url(#gradPortfolioValue)"
                  dot={false}
                  activeDot={{ r: 5, stroke: '#1c75bc', fill: '#12121c', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )
        }
      </>
  );
}