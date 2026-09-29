'use client';

import { useState, useEffect, useId } from 'react';
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
import type { UseMultiplayerMatch } from '@/hooks/useMultiplayerMatch';

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
                <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Data: {data.day}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>Price {data.price}</p>
            </div>
        );
    }
    return null;
};

export function MultiplayerArena({
    m,
    onBack,
}: Readonly<{
    m: UseMultiplayerMatch;
    onBack: () => void
}>) {
    const gradId = useId().replace(/:/, '');

    const [pendingTrade, setPendingTrade] = useState<{ type: 'buy' | 'sell' } | null>(null);
    const [qty, setQty] = useState('1');

    const [chartData, setChartData] = useState<{ day: number; price: number }[]>([]);
    useEffect(() => {
        if (!m.day) {
            return;
        }
        setChartData((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.day === m.day!.day_index) return prev;
            return [...prev, { day: m.day!.day_index, price: m.day!.bar.close }];
        });
    }, [m.day?.day_index]);

    if (!m.day || !m.match) {
        return null;
    }

    const cash = m.day.cash_balance;
    const shares = m.day.position_qty;
    const currentPrice = m.day.bar.close;
    const portfolioValue = cash + shares * currentPrice;
    const totalProfit = portfolioValue - m.match.initial_balance;
    const profitPct = (totalProfit / m.match.initial_balance) * 100;
    const progressPct = ((m.day.day_index + 1) / m.match.total_days) * 100;

    const qtyNum = Number.parseFloat(qty) || 0;
    const total = qtyNum * currentPrice;

    const handleConfirm = () => {
        if (!pendingTrade) {
            return;
        }
        if (pendingTrade.type === 'buy') {
            m.buy(qtyNum);
        } else {
            m.sell(qtyNum);
        }
        setPendingTrade(null);
    }

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
                    <span className='font-bold text-blue-400'>{m.match.symbol}</span>
                    <span className='font-semibold'>
                        Day {m.day.day_index + 1} of {m.match.total_days}
                    </span>
                </div>
            </div>

            <div className='flex gap-4 flex-1 min-h-0'>
                <div
                    className='flex-1 rounded-xl border border-[var(--border)] p-4'
                >
                    <div className='flex justify-between'>
                        <div className='text-lg font-bold'>{m.day.date}</div>
                        <div className='text-xl font-bold'>COST: R{currentPrice.toFixed(2)}</div>
                        {/* <div className={`text-sm flex items-center gap-1 ${priceChangePct >= 0 ? 'text-[var(--green)]' : 'text-[var(--orange)]'}`}>
                            {priceChangePct >= 0 ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                            {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </div> */}
                    </div>
                    <div style={{ width: '100%', height: '85%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id={`grad-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.8} />
                                        <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
                                <XAxis dataKey="day" stroke="#ffffff" tick={{ fontSize: 10 }} />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    stroke="#ffffff"
                                    tickFormatter={(v) => v.toFixed(2)}
                                    width={55}
                                    tick={{ fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ stroke: '#9ca3af' }}
                                    content={<CustomTooltip />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke='var(--blue)'
                                    strokeWidth={4}
                                    fill={`url(#grad-${gradId})`}
                                    dot={false}
                                    activeDot={{ r: 4, stroke: '#1c75bc' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-2 mb-3 h-1 bg-gray-800 rounded-full'>
                        <div
                            className='h-full bg-[var(--blue)] rounded-full'
                            style={{ width: `${progressPct}%` }}></div>
                    </div>
                </div>

                <div className='w-64 space-y-4'>
                    {/* side bar */}

                    {m.day.qte && (
                        <>
                            <div className="p-3 rounded-xl border border-[var(--orange)] bg-[var(--background)] space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--orange)] uppercase tracking-wider">
                                    <span>Quick Question</span>
                                    <span className="text-gray-400 font-normal">{m.day.qte.timeout_seconds}s</span>
                                </div>
                                <p className="text-sm font-semibold">{m.day.qte.prompt}</p>
                                <div className="flex flex-col gap-1.5">
                                    {m.day.qte.options.map((option) => (
                                        <button
                                            key={option}
                                            type='button'
                                            disabled={m.actionSettled}
                                            onClick={() => { m.answerQte(option) }}
                                            className='text-left text-xs rounded-lg px-3 py-2 disabled:opacity-50 bg-gray-800/60 border border-gray-700/50'>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                        <div className="font-bold mb-3">PORTFOLIO</div>
                        <div className="flex justify-between">
                            <span>Cash</span>
                            <span className="text-lg font-bold text-[var(--green)]">$ {cash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{m.match.symbol}</span>
                            <span>{shares}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total</span>
                            <span className="text-lg font-bold text-[var(--green)]">${portfolioValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Profit &amp; Loss</span>
                            <span className={totalProfit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}>${totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--background)]">
                        <div className="text-xs font-bold mb-2">
                            TRADE AT {currentPrice.toFixed(2)} / sh
                        </div>
                        <input
                            type='number'
                            min={1}
                            step={1}
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            onBlur={() => {
                                const n = Number.parseFloat(qty);
                                if (Number.isNaN(n) || n < 1) {
                                    setQty('1');
                                }
                            }}
                            placeholder='Quantity'
                            className='w-full bg-gray-800 border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm text-center mb-2'
                        />
                        {total > 0 && (
                            <>
                                <div className="text-xs mb-2 mt-2 text-center">
                                    Cost: <span> ${total.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                        {m.error && (
                            <>
                                <div className="text-xs mb-2 mt-2 text-[var(--red)]">
                                    {m.error}
                                </div>
                            </>
                        )}
                        <div className="flex gap-2 justify-evenly">
                            <button
                                type='button'
                                disabled={m.actionSettled}
                                className='w-full py-1.5 px-3 rounded-xl bg-[var(--green)] border-[var(--border)] disabled:opacity-50'
                                onClick={() => setPendingTrade({ type: 'buy' })}
                            >
                                Buy
                            </button>
                            <button
                                type='button'
                                disabled={m.actionSettled}
                                className='w-full py-1.5 px-3 rounded-xl bg-[var(--red)] border-[var(--border)] disabled:opacity-50'
                                onClick={() => setPendingTrade({ type: 'sell' })}
                            >
                                Sell
                            </button>
                            {pendingTrade && (
                                <TradeConfirmModal
                                    side={pendingTrade?.type}
                                    quantity={qtyNum}
                                    price={currentPrice}
                                    onConfirm={handleConfirm}
                                    onCancel={() => setPendingTrade(null)}
                                    orderType='market'
                                />
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                        <div className="text-xs font-bold mb-2">Opponent Activity</div>
                        {m.lastOpponentAction ? (
                            <>
                                <div className="text-xs rounded-lg px-3 py-2 bg-gray-800/60 border border-gray-700/50">
                                    {m.lastOpponentAction.action === 'buy' ? 'Bought' : 'Sold'}{' '}
                                    x{m.lastOpponentAction.qty} {m.match.symbol}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs text-gray-500 text-center py-2">
                                    Watching for moves…
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}