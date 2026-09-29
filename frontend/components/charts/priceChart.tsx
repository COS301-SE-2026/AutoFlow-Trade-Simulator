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
import { Button } from '../ui/button';
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
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
        <p className="mb-1">{data.name}</p>
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
  <div style={{
    width: '100%',
    aspectRatio: '1.618',
    borderRadius: '8px',
    background: 'var(--accent-light)'
  }}>
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
  }));
 
    return (
      <>
        <div className='flex flex-row justify-evenly gap-2'>
          <Label className='text'>Select Chart Timeframe:</Label>
          <Button
            type='button'
            variant={timeframe === 'daily' ? 'default' : 'ghost'}
            onClick={() => setTimeframe('daily')}
          >
            Daily
          </Button>
          <Button
            type='button'
            variant={timeframe === 'weekly' ? 'default' : 'ghost'}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </Button>
          <Button
            type='button'
            variant={timeframe === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </Button>
        </div>
        {
          loading ? (<ChartSkeleton />)
          : (
          <div style={{width:'100%', height:"400px", padding:"20px"}}>
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
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={false}
                  />
                  <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      width={70}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--muted)' }} />
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
          </div>
          )
        }
      </>
  );
}