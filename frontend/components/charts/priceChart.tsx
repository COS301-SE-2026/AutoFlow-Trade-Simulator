'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
        <p className="text-muted-foreground">OPEN: R{data.open.toFixed(2)}</p>
        <p className="text-muted-foreground">HIGH: R{data.high.toFixed(2)}</p>
        <p className="text-muted-foreground">LOW: R{data.low.toFixed(2)}</p>
        <p className="text-muted-foreground">CLOSE: R{data.close.toFixed(2)}</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text)" />
                <YAxis domain={['auto', 'auto']} stroke="var(--text)" tickFormatter={(v) => `R${v}`} width={70} />
                <Tooltip
                  cursor={{ stroke: 'var(--muted)' }}
                  content={<CustomTooltip />}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--purple)"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 2, stroke: 'var(--blue)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )
        }
      </>
  );
}