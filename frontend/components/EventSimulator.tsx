'use client';

import { useState } from 'react';
import { usePrices } from '@/hooks/usePrices'
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

interface EventDefinition {
    id: string;
    title: string;
    ticker: string;
    company: string;
    sector: string;
    period: string;
    narrative: string;
    context: string;
    timeframe: string; // 3m or 1y or maybe even 1m for some event.
    startYear: number;
    startMonth: number;
    startDay: number;
    tradingDays: number;
    initialBalance: number;
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
        <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>x: {data.x}</p>
        <p style={{ margin: '2px 0', fontSize: '12px'}}>y: {data.y.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

export function EventSimulator({ event, onBack }: { event: EventDefinition; onBack: () => void }) {

    const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(event.ticker, '1d');

    const chartData = prices.map(d => d.close);

    return (
        <div style={{ width: '100%', height: '250px'}}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                <defs>
                    <linearGradient id={`sim-grad`} x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.8} />
                        <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
                <XAxis dataKey="date" stroke="#ffffff" tick={{ fontSize: 10 }}/>
                <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} />
                <Tooltip
                    cursor={{ stroke: '#9ca3af' }}
                    content={<CustomTooltip />}
                />
                <Area
                    type="monotone"
                    dataKey="price"
                    stroke='var(--blue)'
                    strokeWidth={4}
                    fill={`url(#sim-grad)`}
                    dot={false}
                    activeDot={{ r: 8, stroke: '#1c75bc' }}
                />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}