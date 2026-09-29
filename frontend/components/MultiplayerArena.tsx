'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { calc_greeks, calc_realized_volatility } from '@/lib/greeks';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { MoveLeft, TrendingUp, TrendingDown } from 'lucide-react';
import TradeConfirmModal from './TradeConfirmModal';

interface EventDefinition {
    id: string;
    title: string;
    ticker: string;
    company: string;
    sector: string;
    period: string;
    narrative: string;
    context: string;
    timeframe: string;
    startYear: number;
    startMonth: number;
    startDay: number;
    tradingDays: number;
    initialBalance: number;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                backgroundColor: '#414042',
                border: '1px solid #ffffff4b',
                padding: '8px',
                borderRadius: '4px',
            }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Data: {data.date}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>Price {data.price}</p>
            </div>
        );
    }
    return null;
};

export function MultiplayerArena({
    event,
    onBack,
}: Readonly<{
    event: EventDefinition;
    onBack: () => void
}>) {
    const [pendingTrade, setPendingTrade] = useState<{ type: 'buy' | 'sell' } | null>(null);

    const [shares, setShares] = useState(0);
    const [qty, setQty] = useState('1');
    const [cash, setCash] = useState(event.initialBalance);
    const [trades, setTrades] = useState<any[]>([]);
    const [tradeError, setTradeError] = useState<string | null>(null);

    const onBackRef = useRef(onBack);
    useEffect(() => { onBackRef.current = onBack; }, [onBack]);

    const prevQty = useRef(qty);

    const prevTradesLength = useRef(trades.length);

    const startDate = `${event.startYear}-${String(event.startMonth).padStart(2, '0')}-${String(event.startDay).padStart(2, '0')}`;
    const endDate = new Date(event.startYear, event.startMonth - 1, event.startDay + event.tradingDays * 2).toISOString().split('T')[0];

    const startDateObj = useMemo(() => new Date(startDate), [startDate]);
    const endDateObj = useMemo(() => new Date(endDate), [endDate]);

    const currentPrice = allPrices[dayIndex] ?? "0";
    const portfolioValue = cash + shares * Number.parseFloat(currentPrice);
    const totalProfit = portfolioValue - event.initialBalance;
    const startPrice = allPrices[0];
    const profitPct = ((totalProfit / event.initialBalance) * 100);
    const priceChangePct = startPrice ? (((Number.parseFloat(currentPrice) - Number.parseFloat(startPrice)) / Number.parseFloat(startPrice)) * 100) : 0;

    const total = Number.parseFloat(qty) > 0 ? Number.parseFloat(qty) * Number.parseFloat(currentPrice) : 0;

    return (
        <div className='flex flex-col p-4 h-full'>
            <div className='flex justify-between items-center gap-3'>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={onBack}
                        className='text-sm text-gray-200 hover:text-white-100 p-4'
                    >
                        <div className='flex items-center gap-3'>
                            <MoveLeft />
                            <span>Back</span>
                        </div>
                    </button>
                    <span className='font-bold text-blue-400'>{event.ticker}</span>
                    <span className='font-semibold'>{event.title}</span>
                </div>
            </div>

            <div className='flex gap-4 flex-1 min-h-0'>
                <div
                    className='flex-1 rounded-xl border border-[var(--border)] p-4'
                >
                    <div className='flex justify-between'>
                        <div className='text-lg font-bold'>{allDates[dayIndex]}</div>
                        <div className='text-xl font-bold'>COST: R{Number.parseFloat(currentPrice).toFixed(2)}</div>
                        <div className={`text-sm flex items-center gap-1 ${priceChangePct >= 0 ? 'text-[var(--green)]' : 'text-[var(--orange)]'}`}>
                            {priceChangePct >= 0 ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                            {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </div>
                    </div>
                    <div style={{ width: '100%', height: '85%' }}>
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
                                <XAxis dataKey="date" stroke="#ffffff" tick={{ fontSize: 10 }} />
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
                    <div className='mt-2 mb-3 h-1 bg-gray-800 rounded-full'>
                        <div className='h-full bg-[var(--blue)] rounded-full' style={{ width: `${((dayIndex + 1) / allPrices.length) * 100}%` }}></div>
                    </div>
                    <div className='text-xs mt-1'>Day {dayIndex + 1} of {allPrices.length}</div>
                </div>

                <div className='w-64 space-y-4'>
                    <div
                        className='p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]'
                    >
                        <div className='font-bold mb-3 justify-center'>PORTFOLIO</div>
                        <div className='flex justify-between'>
                            <span>Cash</span>
                            <span className='text-lg font-bold text-[var(--green)]'>R {cash.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>{event.ticker}</span>
                            <span>{shares} sh</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Total</span>
                            <span className='text-lg font-bold text-[var(--green)]'>R {portfolioValue.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Profit & Loss</span>
                            <span className={`${totalProfit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                R{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                    <div className={`rounded-xl border border-[var(--border)] p-4 bg-[var(--background)]}`}>
                        <div className='text-xs font-bold mb-2'>TRADE AT {Number.parseFloat(currentPrice).toFixed(2)} / sh</div>
                        <input
                            type='number'
                            min="1"
                            step='1'
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            onBlur={() => {
                                const n = Number.parseFloat(qty);
                                if (Number.isNaN(n) || n < 1) setQty('1');
                            }}
                            placeholder='Quantity'
                            className='w-full bg-gray-800 border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm text-center mb-2'
                        />
                        {total > 0 && (
                            <div className='text-xs mb-2 mt-2 text-center'>
                                Cost:<span className='font-bold text-lg'> R{total.toFixed(2)}</span>
                            </div>
                        )}
                        {tradeError && (
                            <div className='text-xs mb-2 mt-2 text-[var(--red)]'>
                                {tradeError}
                            </div>
                        )}
                        <div className='flex gap-2 justify-evenly'>
                            <button
                                id='tut-buy'
                                type='button'
                                className='w-full py-1.5 px-3 rounded-xl bg-[var(--green)] border-[var(--border)]'
                                onClick={() => setPendingTrade({ type: 'buy' })}
                            >
                                Buy
                            </button>
                            <button
                                type='button'
                                className='w-full py-1.5 px-3 rounded-xl bg-[var(--red)] border-[var(--border)]'
                                onClick={() => setPendingTrade({ type: 'sell' })}
                            >
                                Sell
                            </button>
                            {pendingTrade && (
                                <TradeConfirmModal
                                    side={pendingTrade.type}
                                    quantity={Number.parseFloat(qty)}
                                    price={Number.parseFloat(currentPrice)}
                                    onConfirm={() => { execute(pendingTrade.type); setPendingTrade(null) }}
                                    onCancel={() => { setPendingTrade(null) }} orderType="market"
                                />
                            )}
                        </div>
                    </div>

                    <div className='rounded-xl border border-[var(--border)] bg-[var(--background)] p-3'>
                        History
                        {trades.length === 0 ? <p>No trades</p> : [...trades].reverse().map((t, i) => (
                            <div key={"n" + i} className='flex items-center gap-2 mb-1'>
                                <span className={`font-bold ${t.type === 'buy' ? 'text-[var(--green)]' : 'text-[var(--orange)]'}`} >{t.type === 'buy' ? '↑' : '↓'}</span>
                                <span className='text-xs'>{t.type.toUpperCase()} {t.qty} @ R{Number.parseFloat(t.price).toFixed(2)} ON {t.date}</span>
                            </div>
                        ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}