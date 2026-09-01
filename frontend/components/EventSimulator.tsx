'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { apiClient } from '@/lib/api';
import { startSimulation } from '@/lib/api/assets';
import type { SimCreateResponse, OHLCVBar } from '@/lib/types/assets';
import { MoveLeft, Play, ChevronsRight, Pause, Check, TrendingUp, TrendingDown, Gauge, RotateCcw } from 'lucide-react';
import TradeConfirmModal from './TradeConfirmModal';
import { Button } from '@/components/ui/button';
import { useNews } from '@/hooks/useNews';
import {NewsTicker} from "@/components/news/newsScroll";

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

export function EventSimulator({ event, onBack }: Readonly<{ event: EventDefinition; onBack: () => void }>) {

    const [simData, setSimData] = useState<SimCreateResponse | null>(null);
    const [dayIndex, setDayIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [finalSummary, setFinalSummary] = useState<SimulationFinishResponse | null>(null);
    const [pendingTrade, setPendingTrade] = useState<{ type: 'buy' | 'sell' } | null>(null);

    const [shares, setShares] = useState(0);
    const [qty, setQty] = useState('1');
    const [cash, setCash] = useState(event.initialBalance);
    const [trades, setTrades] = useState<any[]>([]);
    const [tradeError, setTradeError] = useState<string | null>(null);
    const [strikeManuallySet, setStrikeManuallySet] = useState(false);

    const [speed, setSpeed] = useState(1);

    const startDate = `${event.startYear}-${String(event.startMonth).padStart(2, '0')}-${String(event.startDay).padStart(2, '0')}`;
    const endDate = new Date(event.startYear, event.startMonth - 1, event.startDay + event.tradingDays * 2).toISOString().split('T')[0];

    const startDateObj = useMemo(() => new Date(startDate), [startDate]);
    const endDateObj = useMemo(() => new Date(endDate), [endDate]);

    const { newsItems, error: newsError } = useNews(
        event.ticker,
        startDateObj,
        endDateObj,
    );

    useEffect(() => {
        const initialize = async () => {
            try {
                const res = await startSimulation(
                    [event.ticker],
                    { [event.ticker]: 0 },
                    startDate,
                    endDate,
                    String(event.initialBalance),
                );
                setSimData(res);
            } catch (e) {
                console.error('Failed to create simulation', e);
            }
        };
        initialize();
    }, [event, startDate, endDate]);

    const { allPrices, allDates, allTimestamps } = useMemo(() => {
        const prices: string[] = [];
        const dates: string[] = [];
        const timestamps: string[] = [];
        if (simData?.bars) {
            const tickerBars = simData.bars[event.ticker];
            tickerBars.forEach((bar: OHLCVBar) => {
                prices.push((bar.close).toString());
                dates.push(new Date(bar.timestamp).toLocaleDateString());
                timestamps.push(bar.timestamp);
            });
        }
        return { allPrices: prices, allDates: dates, allTimestamps: timestamps };
    }, [simData, event.ticker]);

    const chartData = allPrices.slice(0, dayIndex + 1).map((p, i) => ({
        date: allDates[i],
        price: p,
    }))

    useEffect(() => {
        if (!isPlaying || dayIndex >= allPrices.length - 1) {
            setIsPlaying(false);
            return;
        }

        const oldInterval = 2000;
        const newInterval = oldInterval / speed;

        const id = setInterval(() => setDayIndex(d => Math.min(d + 1, allPrices.length - 1)), newInterval);
        return () => clearInterval(id);
    }, [isPlaying, dayIndex, allPrices.length, speed]);

    const currentPrice = allPrices[dayIndex] ?? "0";
    const portfolioValue = cash + shares * Number.parseFloat(currentPrice);
    const totalProfit = portfolioValue - event.initialBalance;
    const startPrice = allPrices[0];
    const profitPct = ((totalProfit / event.initialBalance) * 100);
    const priceChangePct = startPrice ? (((Number.parseFloat(currentPrice) - Number.parseFloat(startPrice)) / Number.parseFloat(startPrice)) * 100) : 0;

    //State for greeks
    const [strikePrice, setStrikePrice] = useState<number>(Number.parseFloat(allPrices[0] || '0'));
    const daysToExpiration = Math.max(1, allPrices.length - dayIndex);

    useEffect(() => {
        if (allPrices.length === 0) return;

        const current = Number.parseFloat(allPrices[dayIndex] || allPrices[0]);
        if (!current || current <= 0) return;

        if (!strikeManuallySet) {
            setStrikePrice(Math.round(current));
        }

    }, [allPrices, dayIndex, strikeManuallySet]);

    const greeksResult = useMemo(() => {
        const price = Number.parseFloat(currentPrice);
        if (!price || price <= 0 || !strikePrice || strikePrice <= 0) return null;

        // Realized volatility from the price history the sim has actually
        // played through so far — never looks ahead past dayIndex.
        const pricesSoFar = allPrices.slice(0, dayIndex + 1).map(Number.parseFloat);
        const sigma = calc_realized_volatility(pricesSoFar);

        return calc_greeks({
            current_price: price,
            strike_price: strikePrice,
            time_to_expire: daysToExpiration / 365,
            interest_rate: 0.05,
            sigma,
            option_type: 'call',
        });
    }, [allPrices, dayIndex, currentPrice, strikePrice, daysToExpiration]);

    const currentBarTimestamp = allTimestamps[dayIndex];
    const visibleNews = currentBarTimestamp
        ? newsItems.filter(n => new Date(n.timestamp).getTime() <= new Date(currentBarTimestamp).getTime())
        : [];

    const execute = async (type: 'buy' | 'sell') => {
        if (!simData || Number.parseFloat(currentPrice) <= 0) return;

        const simId = simData.simulation_id;
        let quantity = Number.parseFloat(qty);
        if (!quantity || quantity < 1) quantity = 1;
        let qtyToTrade = quantity;

        if (type === 'sell') {
            if (shares <= 0) {
                setTradeError('You have no shares to sell.');
                return;
            }
            if (qtyToTrade > shares) {
                qtyToTrade = shares;
            }
        }

        if (type === 'buy') {
            const cost = qtyToTrade * Number.parseFloat(currentPrice);
            if (cost > cash) {
                setTradeError(`Not enough cash. You need R ${cost.toFixed(2)}.`);
                return;
            }
        }

        const tickerBars = simData.bars?.[event.ticker];
        const bar = tickerBars?.[dayIndex];
        const timestamp = bar ? bar.timestamp : new Date().toISOString();

        const action = {
            type: type,
            symbol: event.ticker,
            qty: qtyToTrade,
            timestamp: timestamp
        };

        try {
            const res = await apiClient('/simulation/practice/simulate/actions', {
                method: 'POST',
                body: {
                    simulation_id: simId,
                    actions: [action],
                }
            });

            const newShares = res.positions?.[event.ticker];
            const nav = res.nav;
            setShares(newShares);

            setCash(nav - newShares * Number.parseFloat(currentPrice));

            setTrades(prev => [
                ...prev,
                {
                    type: type,
                    symbol: event.ticker,
                    qty: qtyToTrade,
                    price: currentPrice,
                    date: allDates[dayIndex],
                },
            ]);
            setTimeout(() => setTradeError(null), 3000);
        } catch (e) {
            console.error('Trade failed', e);
            setTradeError(`Trade failed. Please try again.`);
            setTimeout(() => setTradeError(null), 3000);
        }
    }

    const finish = async () => {
        if (!simData) return;
        try {
            const res = await apiClient(`/simulation/practice/simulate/${simData.simulation_id}/finish`, {
                method: 'POST',
            }) as SimulationFinishResponse;
            setFinalSummary(res);
        } catch (e) {
            console.error('Simulation finish failed.', e);
        }
    }

    if (!simData) {
        return (
            <div className='bg-green-950 p-6 white rounded-xl border border-[var(--border)]'>
                Loading simulation...
            </div>
        )
    }

    if (finalSummary) {
        const { summary } = finalSummary;
        return (
            <div className='flex justify-center'>
                <div className='p-8 py-12 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-4 h-full'>
                    <div className='text-white font-bold text-xl text-center'>
                        Simulation Finished
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div className='text-center text-lg'>
                            Final Balance: <span className='font-bold'>
                                R {Number.parseFloat(summary.final_balance).toFixed(2)}
                            </span>
                        </div>
                        <div className='text-center text-lg'>
                            Return:<span className={Number.parseFloat(summary.returns_pct) >= 0 ? 'text-[var(--green)] font-bold' : 'text-[var(--red)] font-bold'}
                            > {Number.parseFloat(summary.returns_pct)}%</span>
                        </div>
                        <div className='text-center text-lg'>
                            Max Drawdown:<span className='text-[var(--red)]'>
                                {Number.parseFloat(summary.max_drawdown).toFixed(2)}%</span>
                        </div>
                        <div className='text-center text-lg'>
                            Trades:<span className='font-bold'> {summary.trades_count}</span>
                        </div>
                    </div>
                    <div className='flex items-center justify-center'>
                        <button
                            type='button'
                            onClick={onBack}
                            className='flex self-center px-4 py-2 bg-blue-900 text-white rounded-xl'
                        >
                            Back to Events
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                <button
                    type='button'
                    onClick={() => { setIsPlaying(b => !b) }}
                    className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm'
                >
                    <div className='flex items-center gap-3'>
                        {isPlaying ? <><Pause /> Pause</> : <><Play /> Play</>}
                    </div>
                </button>

                <div className='flex flex-row gap-1 bg-blue-900 border border-[var(--border)] items-center px-3 rounded-xl font-semibold text-sm'>
                    <Gauge className='mr-2' />
                    <span className='mr-2'>Speed Controls:</span>
                    {[1, 2, 4].map((s) => {

                        return (
                            <button
                                key={s}
                                type='button'
                                onClick={() => { setSpeed(s) }}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm border-[var(--border)] border-2
                                ${speed == s ? 'bg-[var(--background-alt)]' : 'bg-blue-900'}`}
                            >
                                {s}x
                            </button>
                        )
                    })}
                </div>

                <button
                    type='button'
                    onClick={() => { setDayIndex(d => Math.min(d + 1, allPrices.length)) }}
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
            <NewsTicker
                items={visibleNews}
                currentDate={currentBarTimestamp ?? startDate}
            />
            {newsError && (
                <p className='text-xs text-[var(--red)]'>Couldn&apos;t load news for {event.ticker}.</p>
            )}
            <div className='flex gap-4 flex-1 min-h-0'>
                <div className='flex-1 rounded-xl border border-[var(--border)] p-4'>
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
                    <div className='p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]'>
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
                            value={qty}
                            onChange={e => setQty(e.target.value)}
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
                            {pendingTrade && (<TradeConfirmModal side={pendingTrade.type} quantity={Number.parseFloat(qty)} price={Number.parseFloat(currentPrice)} onConfirm={() => { execute(pendingTrade.type); setPendingTrade(null) }} onCancel={() => { setPendingTrade(null) }} orderType="market" />)}
                        </div>
                    </div>

                    <div className='p-3 bg-[var(--background)] rounded-xl border border-[var(--border)] space-y-2'>
                        <div className='flex justify-between items-center text-xs font-bold text-blue-400 uppercase tracking-wider'>
                            <span>Call Option Risk</span>
                            <span className='text-gray-400 font-normal'>DTE: {daysToExpiration}d</span>
                        </div>

                        <div className='flex items-center justify-between text-xs bg-gray-800/50 p-1.5 rounded-lg border border-gray-700/50'>
                            <span className='text-gray-400'>Strike Price </span>
                            <div className='flex items-center gap-1'>
                                <input
                                    type='number'
                                    value={strikePrice}
                                    onChange={(e) => { setStrikePrice(Number.parseFloat(e.target.value) || 0); setStrikeManuallySet(true) }}
                                    className='w-20 bg-gray-900 text-right px-2 py-0.5 rounded text-white text-xs font-mono border border-gray-700'
                                />
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon-xs'
                                    disabled={!strikeManuallySet}
                                    onClick={() => setStrikeManuallySet(false)}
                                    aria-label='Reset to at-the-money'
                                    title='Reset to at-the-money'
                                >
                                    <RotateCcw />
                                </Button>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-xs pt-1'>
                            <div className='bg-gray-800/60 p-2 rounded-lg border border-gray-700/50'>
                                <span className='text-gray-400 block text-[10px]'>Delta (Δ)</span>
                                <span className={`font-mono font-bold text-sm ${greeksResult ? 'text-white' : 'text-gray-500'}`}>
                                    {greeksResult ? greeksResult.delta.toFixed(3) : '0.000'}
                                </span>
                            </div>
                            <div className='bg-gray-800/60 p-2 rounded-lg border border-gray-700/50'>
                                <span className='text-gray-400 block text-[10px]'>Gamma (Γ)</span>
                                <span className={`font-mono font-bold text-sm ${greeksResult ? 'text-white' : 'text-gray-500'}`}>
                                    {greeksResult ? greeksResult.gamma.toFixed(4) : '0.0000'}
                                </span>
                            </div>
                            <div className='bg-gray-800/60 p-2 rounded-lg border border-gray-700/50'>
                                <span className='text-gray-400 block text-[10px]'>Theta (Θ)</span>
                                <span className={`font-mono font-bold text-sm ${greeksResult ? 'text-white' : 'text-gray-500'}`}>
                                    {greeksResult ? greeksResult.theta.toFixed(3) : '0.000'}
                                </span>
                            </div>
                            <div className='bg-gray-800/60 p-2 rounded-lg border border-gray-700/50'>
                                <span className='text-gray-400 block text-[10px]'>Vega (ν)</span>
                                <span className={`font-mono font-bold text-sm ${greeksResult ? 'text-white' : 'text-gray-500'}`}>
                                    {greeksResult ? greeksResult.vega.toFixed(3) : '0.000'}
                                </span>
                            </div>
                            <div className='bg-gray-800/60 p-2 rounded-lg border border-gray-700/50'>
                                <span className='text-gray-400 block text-[10px]'>Rho (ρ)</span>
                                <span className={`font-mono font-bold text-sm ${greeksResult ? 'text-white' : 'text-gray-500'}`}>
                                    {greeksResult ? greeksResult.rho.toFixed(3) : '0.000'}
                                </span>
                            </div>
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
