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
      <div style={{
        backgroundColor: '#414042',
        border: '1px solid #ffffff4b',
        padding: '8px',
        borderRadius: '4px',
      }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>{data.name}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>OPEN: R{data.open.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>HIGH: R{data.high.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>LOW: R{data.low.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>CLOSE: R{data.close.toFixed(2)}</p>
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

  //console.log('usePrices data:', data);
  //console.log('usePrices loading:', loading);
  //console.log('usePrices error:', error);

  const chartData = data.map((item) => ({
    ...item,
    name: item.timestamp.split('T')[0],
  }));
 
    return (
      <>
        <div className='flex flex-row justify-evenly mt-5 mb-5 card'>
          <Label className='text'>Select Chart Timeframe:</Label>
          <Button className='bg-(--accent) button secondary' onClick={() => setTimeframe('daily')}>Daily</Button>
          <Button className='button secondary' onClick={() => setTimeframe('weekly')}>Weekly</Button>
          <Button className='button secondary' onClick={() => setTimeframe('monthly')}>Monthly</Button>
        </div>
        {
          loading ? (<ChartSkeleton />)
          : (
          <ResponsiveContainer width="100%" aspect={1.618}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" tickFormatter={(v) => `R${v}`} width={70} />
              <Tooltip
                cursor={{ stroke: '#9ca3af' }}
                content={<CustomTooltip />}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#6950a1"
                strokeWidth={4}
                dot={{ fill: '#6950a1' }}
                activeDot={{ r: 8, stroke: '#1c75bc' }}
              />
            </LineChart>
          </ResponsiveContainer>
          )
        }
      </>
  );
}