'use client';

import { useState, useEffect } from 'react';
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
import { apiClient } from '@/lib/api';
import { MoveLeft, Play, ChevronsRight, Pause, Check } from 'lucide-react';

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

interface SimulationCreateRequest {
    symbols: string[];
    allocations: Record<string, number>;
    start_date: string;
    end_date: string;
    initial_balance: string;
}

interface SimulationAppendRequest {
    simulation_id: number;
    actions: {
        type: string;
        symbol: string;
        qty: number;
        timestamp: string;
        meta?: string[];
    }[];
}

interface SimulationResponse {
    simulation_id: number;
    status: string;
    positions: string[];
    nav: string;
}

interface SimulationFinishResponse {
    simulation_id: number;
    status: string;
    start_date: string;
    end_date: string;
    initial_balance: string;
    summary: {
        final_balance: string;
        returns_pct: string;
        max_drawdown: string;
        trades_count: number;
        per_symbol_results: Record<string, {
            final_value: string;
            returns_pct: string;
        }>;
    };
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
        <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Data: {data.date}</p>
        <p style={{ margin: '2px 0', fontSize: '12px'}}>Price {data.price}</p>
      </div>
    );
  }
  return null;
};

export function EventSimulator({ event, onBack }: { event: EventDefinition; onBack: () => void }) {

    const { data: prices, loading: pricesLoading, error: pricesError } = usePrices(event.ticker, '1d');

    const [simId, setSimId] = useState<number | null>(null);
    const [dayIndex, setDayIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [finalSummary, setFinalSummary] = useState<SimulationFinishResponse | null>(null);

    const allPrices = prices.map(p => p.close)
    const allDates = prices.map(d => new Date(d.timestamp).toLocaleDateString())

    const chartData = allPrices.slice(0, dayIndex + 1).map((p, i) => ({
        date: allDates[i],
        price: p,
    }))

    const startDate = `${event.startYear}-${String(event.startMonth)}-${String(event.startDay)}`;
    const endDate = new Date(event.startYear, event.startMonth, event.startDay + event.tradingDays).toISOString().split('T')[0];

    useEffect(() => {
        const initialize = async () => {
            try {
                const body: SimulationCreateRequest = {
                    symbols: [event.ticker],
                    allocations: { [event.ticker]: 1 },
                    start_date: startDate,
                    end_date: endDate,
                    initial_balance: String(event.initialBalance ?? 10000),
                };
                const res = await apiClient('/simulation/practice/simulate', {
                    method: 'POST',
                    body,
                }) as SimulationResponse;
                setSimId(res.simulation_id);
            } catch (e) {
                console.error('Failed to create simulation', e);
            }
        };
        if (prices.length > 0) initialize();
    }, [prices, event, startDate, endDate]);

    useEffect(() => {
        if (!isPlaying || dayIndex >= allPrices.length) {
            setIsPlaying(false);
            return;
        } 
        const id = setInterval(() => setDayIndex(d => Math.min(d + 1, allPrices.length)), 2000);
        return () => clearInterval(id);
    }, [isPlaying, dayIndex, allPrices.length]);

    const finish = async () => {
        if (!simId) return;
        try {
            const res = await apiClient(`/simulation/practice/simulate/${simId}/finish`, {
                method: 'POST',
            }) as SimulationFinishResponse;
            setFinalSummary(res);
        } catch (e) {
            console.error('Simulation finish failed.', e);
        }
    }

    if (pricesLoading) return <div className='bg-green-950 p-6 white'>Loading market data...</div>
    if (pricesError) return <div className='bg-red-950 p-6 white'>Error loading historical event data: {pricesError}</div>

    if (finalSummary) {
        const { summary } = finalSummary;
        return (
            <div className='p-6'>
                <div className='text-white font-bold text-xl'>
                    Simulation Finished
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <span>Final Balance: {parseFloat(summary.final_balance).toFixed(2)}</span>
                    <span>Return: {parseFloat(summary.returns_pct)}%</span>
                    <span>Drawdown: {parseFloat(summary.max_drawdown).toFixed(2)}%</span>
                    <span>Trades: {summary.trades_count}</span>
                </div>
                <button
                    type='button'
                    onClick={onBack} 
                    className='px-4 py-2 bg-blue-900 text-white rounded-xl'
                >
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className='flex flex-col'>
            <div className='flex justify-between items-center gap-3'>
                <button
                    type='button'
                    onClick={onBack} 
                    className='text-sm text-grey-200 hover:text-white-100 p-4'
                >
                    <div className='flex items-center gap-3'>
                        <MoveLeft /> 
                        <span>Back</span>
                    </div>
                </button>

                <button
                    type='button'
                    onClick={() => {setIsPlaying(b => !b)}}
                    className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm'
                >
                    <div className='flex items-center gap-3'>
                        {isPlaying ? <><Pause /> Pause</> : <><Play /> Play</>}
                    </div>
                </button>

                <button
                    type='button'
                    onClick={() => {setDayIndex(d => Math.min(d + 1, allPrices.length))}}
                    className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm'
                >
                    <div className='flex items-center gap-3'>
                        <ChevronsRight />
                        <span className='text-white'>Skip Forward</span>
                    </div>
                </button>

                <button
                    type='button'
                    onClick={finish}
                    className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm'
                >
                    <div className='flex items-center gap-3'>
                        <Check />
                        <span className='text-white'>View Simulation Summary</span>
                    </div>
                </button>
            </div>
            <div style={{ width: '100%', height: '250px'}}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                    <defs>
                        <linearGradient id={`grad-${event.id}`} x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.8} />
                            <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
                    <XAxis dataKey="date" stroke="#ffffff" tick={{ fontSize: 10 }}/>
                    <YAxis domain={['auto', 'auto']} stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} />
                    <Tooltip
                        cursor={{ stroke: '#9ca3af' }}
                        content={<CustomTooltip />}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke='var(--blue)'
                        strokeWidth={4}
                        fill={`url(#grad-${event.id})`}
                        dot={false}
                        activeDot={{ r: 4, stroke: '#1c75bc' }}
                    />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}