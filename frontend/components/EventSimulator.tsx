'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { MoveLeft, Play, ChevronsRight, Pause, Check, TrendingUp, TrendingDown, Gauge, RotateCcw, Lock } from 'lucide-react';
import TradeConfirmModal from './TradeConfirmModal';
import { Button } from '@/components/ui/button';
import { useNews } from '@/hooks/useNews';
import { useUnlockedGreeks } from '@/hooks/useUnlockedGreeks';
import {NewsTicker} from "@/components/news/newsScroll";
import { STRATEGY_TUTORIALS, MOCK_AAPL_BARS } from '@/lib/strategyTutorials';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css'

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
            <div className='rounded-lg border border-white/10 bg-[#12121c] px-3 py-2 text-xs shadow-lg'>
                <p className='mb-1 text-white/55'>Data: {data.date}</p>
                <p className='tabular-nums font-semibold'>Price {data.price}</p>
            </div>
        );
    }
    return null;
};

const INTERACTION_STEPS = ['tut-play', 'tut-qty', 'tut-buy', 'tut-skip'];

export function EventSimulator({ 
    event,
    mode = 'event',
    onBack,
    onTutorialComplete,
}: Readonly<{ 
    event: EventDefinition;
    mode?: 'event' | 'strategy';
    onBack: () => void;
    onTutorialComplete?: () => void;
}>) {
    const tutorialCompletedRef = useRef(false);
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

    const isStrategy = mode === 'strategy';

    const tutorial = isStrategy ? STRATEGY_TUTORIALS.dca : null;
    const [stepIndex, setStepIndex] = useState(0);
    const step = tutorial?.steps[stepIndex];

    const stepIndexRef = useRef(stepIndex);
    useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);

    const driverRef = useRef<Driver | null>(null);

    const onBackRef = useRef(onBack);
    useEffect(() => { onBackRef.current = onBack; }, [onBack]);

    const advanceStep = useCallback(() => {
        if (!tutorial) return;
        setStepIndex(i => Math.min(i + 1, tutorial.steps.length - 1));
        driverRef.current?.moveNext();
    }, [tutorial]);

    useEffect(() => {
        if (!isStrategy || !tutorial || !simData) return;
        
        if (pendingTrade) {
            driverRef.current?.destroy();
            driverRef.current = null;
            return;
        }

        const d = driver({
            showProgress: true,
            progressText: '{{current}} of {{total}}',
            allowClose: true,
            overlayOpacity: 0.72,
            stagePadding: 6,
            stageRadius: 12,
            steps: tutorial.steps.map(s => ({
                element: `#${s.elementId}`,
                popover: {
                    title: s.title,
                    description: s.instruction,
                    side: 'bottom',
                    align: 'center',
                    showButtons: INTERACTION_STEPS.includes(s.elementId)
                        ? ['close']
                        : ['next', 'close']
                }
            })),
            onHighlightStarted: (_el: any, _step: any, opts: any) => {
                const idx = opts?.state?.activeIndex;
                if (typeof idx === 'number') {
                    setStepIndex(prev => (prev === idx ? prev : idx));
                }
            },
            onCloseClick: () => {
                d.destroy();
                onBackRef.current();
            },
            onDestroyed: () => {
                driverRef.current = null;
            },
        });

        driverRef.current = d;
        d.drive(stepIndexRef.current);

        return () => {
            d.destroy();
            driverRef.current = null;
        };
    }, [isStrategy, tutorial, simData, pendingTrade]);

    const prevQty = useRef(qty);

    useEffect(() => {
        if (!step) return;
        if (step.elementId === 'tut-qty' && qty !== prevQty.current 
            && Number.parseFloat(qty) >= 1) {
            advanceStep();
        }
        prevQty.current = qty;
    }, [qty, step, advanceStep]);

    const prevTradesLength = useRef(trades.length);

    useEffect(() => {
        if (!step) return;
        if (step.elementId === 'tut-buy' && trades.length > prevTradesLength.current) {
            advanceStep();
        }
        prevTradesLength.current = trades.length;
    }, [trades.length, step, advanceStep]);

    const prevDayIndex = useRef(dayIndex);
    useEffect(() => {
        if (!step) return;
        if (step.elementId === 'tut-skip' && dayIndex !== prevDayIndex.current) {
            advanceStep();
        }
        prevDayIndex.current = dayIndex;
    }, [dayIndex, step, advanceStep]);

    useEffect(() => {
        if (!step) return;

        switch (step.elementId) {
            case 'tut-qty':
                if (qty !== prevQty.current && Number.parseFloat(qty) >= 1) {
                    advanceStep();
                }
                break;
            case 'tut-buy':
                if (trades.length > prevTradesLength.current) {
                    advanceStep();
                }
                break;
            case 'tut-skip':
                if (dayIndex !== prevDayIndex.current) {
                    advanceStep();
                }
                break;
        }

        prevQty.current = qty;
        prevTradesLength.current = trades.length;
        prevDayIndex.current = dayIndex
    }, [qty, trades.length, dayIndex, step, advanceStep]);

    useEffect(() => {
        if (!step || step.elementId !== 'tut-play' || !isPlaying) return;
        const id = setTimeout(advanceStep, 3500);
        return () => clearTimeout(id);
    }, [step, isPlaying, advanceStep]);

    const [pausedByTutorial, setPausedByTutorial] = useState(false);

    useEffect(() => {
        if (!step) return;
        const isFocusStep = step.elementId === 'tut-qty' || step.elementId === 'tut-buy';

        if (isFocusStep && isPlaying) {
            setIsPlaying(false);
            setPausedByTutorial(true);
        } else if (!isFocusStep) {
            setPausedByTutorial(false);
        }
    }, [step, isPlaying]);

    const startDate = `${event.startYear}-${String(event.startMonth).padStart(2, '0')}-${String(event.startDay).padStart(2, '0')}`;
    const endDate = new Date(event.startYear, event.startMonth - 1, event.startDay + event.tradingDays * 2).toISOString().split('T')[0];

    const startDateObj = useMemo(() => new Date(startDate), [startDate]);
    const endDateObj = useMemo(() => new Date(endDate), [endDate]);

    const { newsItems, error: newsError } = useNews(
        isStrategy ? '' : event.ticker,
        startDateObj,
        endDateObj,
    );

    const { unlocked: unlockedGreeks } = useUnlockedGreeks();

    useEffect(() => {
        if (isStrategy) {
            const bars = MOCK_AAPL_BARS;
            setSimData({ simulation_id: -1, bars: { [event.ticker]: bars } } as unknown as SimCreateResponse);
            return;
        }
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
        void initialize();
    }, [event, startDate, endDate, isStrategy]);

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

        if (isStrategy) {
            const price = Number.parseFloat(currentPrice);
            const nextShares = type === 'buy' ? shares + qtyToTrade : shares - qtyToTrade;
            const nextCash = type === 'buy' ? cash - qtyToTrade * price : cash + qtyToTrade * price;

            setShares(nextShares);
            setCash(nextCash);
            setTrades(prev => [
                ...prev,
                { 
                    type,
                    symbol: event.ticker,
                    qty: qtyToTrade,
                    price: currentPrice,
                    data: allDates[dayIndex]
                },
            ]);
            return;
        }

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

        if (isStrategy) {
            const finalBalance = cash + shares * Number.parseFloat(currentPrice);

            let peak = event.initialBalance;
            let maxDD = 0;
            for (let i = 0; i < dayIndex; i++) {
                const p = Number.parseFloat(allPrices[i] || '0');
                const equity = cash + shares * p;

                if (equity > peak) peak = equity;
                const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
                if (dd > maxDD) maxDD = dd;
            }

            const returnsPct = ((finalBalance - event.initialBalance) / event.initialBalance) * 100;

            setFinalSummary({
                simulation_id: -1,
                status: 'finished',
                start_date: startDate,
                end_date: endDate,
                initial_balance: String(event.initialBalance),
                summary: {
                    final_balance: finalBalance.toFixed(2),
                    returns_pct: returnsPct.toFixed(2),
                    max_drawdown: maxDD.toFixed(2),
                    trades_count: trades.length,
                    per_symbol_results: {},
                }
            });
            if (!tutorialCompletedRef.current) {
                tutorialCompletedRef.current = true;
                onTutorialComplete?.();
            }
            return;
        }

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
            <div aria-busy='true' className='flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-6 text-sm text-white/70'>
                <span aria-hidden='true' className='h-4 w-4 rounded-full border-2 border-white/15 border-t-[var(--blue)] motion-safe:animate-spin' />
                Loading simulation...
            </div>
        )
    }

    if (finalSummary) {
        const { summary } = finalSummary;
        return (
            <div className='flex justify-center py-6'>
                <div className='w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.85)] p-8'>
                    <div className='mb-6 text-center'>
                        <h2 className='text-2xl font-semibold'>Simulation Finished</h2>
                        <p className='mt-1 text-sm text-[var(--muted)]'>{event.title}</p>
                    </div>
                    <dl className='mb-8 grid grid-cols-2 gap-3'>
                        <div className='rounded-xl border border-[var(--border)] bg-white/[0.02] p-4'>
                            <dt className='text-xs font-medium text-white/50'>Final Balance</dt>
                            <dd className='tabular-nums mt-1 text-xl font-semibold'>R {Number.parseFloat(summary.final_balance).toFixed(2)}</dd>
                        </div>
                        <div className='rounded-xl border border-[var(--border)] bg-white/[0.02] p-4'>
                            <dt className='text-xs font-medium text-white/50'>Return</dt>
                            <dd className={`tabular-nums mt-1 text-xl font-semibold ${Number.parseFloat(summary.returns_pct) >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>{Number.parseFloat(summary.returns_pct)}%</dd>
                        </div>
                        <div className='rounded-xl border border-[var(--border)] bg-white/[0.02] p-4'>
                            <dt className='text-xs font-medium text-white/50'>Max Drawdown</dt>
                            <dd className='tabular-nums mt-1 text-xl font-semibold text-[#ff6b72]'>{Number.parseFloat(summary.max_drawdown).toFixed(2)}%</dd>
                        </div>
                        <div className='rounded-xl border border-[var(--border)] bg-white/[0.02] p-4'>
                            <dt className='text-xs font-medium text-white/50'>Trades</dt>
                            <dd className='tabular-nums mt-1 text-xl font-semibold'>{summary.trades_count}</dd>
                        </div>
                    </dl>
                    <button
                        type='button'
                        onClick={onBack}
                        className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] font-semibold text-white transition-[background-color,transform] hover:bg-[#2385d1] active:scale-[0.98]'
                    >
                        <MoveLeft aria-hidden='true' className='h-4 w-4' />
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const total = Number.parseFloat(qty) > 0 ? Number.parseFloat(qty) * Number.parseFloat(currentPrice) : 0;

    return (
        <div className='flex h-full flex-col gap-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                    <button
                        type='button'
                        onClick={onBack}
                        className='inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white'
                    >
                        <MoveLeft aria-hidden='true' className='h-4 w-4' />
                        <span>Back</span>
                    </button>
                    <span className='rounded-md bg-[rgba(28,117,188,0.15)] px-2 py-0.5 font-mono text-sm font-semibold text-[#6fb4ea]' translate='no'>{event.ticker}</span>
                    <h2 className='truncate font-semibold'>{event.title}</h2>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    <button
                        id='tut-play'
                        type='button'
                        onClick={() => { setIsPlaying(b => !b) }}
                        className='inline-flex h-9 min-w-[92px] items-center justify-center gap-1.5 rounded-lg bg-[var(--blue)] px-3 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[#2385d1] active:scale-[0.98]'
                    >
                        {isPlaying ? <><Pause aria-hidden='true' className='h-4 w-4' /> Pause</> : <><Play aria-hidden='true' className='h-4 w-4' /> Play</>}
                    </button>

                    <div role='group' aria-label='Playback speed' className='inline-flex h-9 items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5'>
                        <Gauge aria-hidden='true' className='mx-1.5 h-4 w-4 text-white/50' />
                        {[1, 2, 4].map((s) => (
                            <button
                                key={s}
                                type='button'
                                aria-pressed={speed == s}
                                onClick={() => { setSpeed(s) }}
                                className={`tabular-nums h-full rounded-md px-2.5 text-sm font-semibold transition-colors ${speed == s ? 'bg-[var(--background-alt)] text-white shadow-sm ring-1 ring-white/10' : 'text-white/55 hover:text-white'}`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>

                    <button
                        id='tut-skip'
                        type='button'
                        onClick={() => { setDayIndex(d => Math.min(d + 1, allPrices.length)) }}
                        className='inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white'
                    >
                        <ChevronsRight aria-hidden='true' className='h-4 w-4' />
                        <span>Skip Forward</span>
                    </button>

                    <button
                        id='tut-finish'
                        type='button'
                        onClick={finish}
                        className='inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white'
                    >
                        <Check aria-hidden='true' className='h-4 w-4' />
                        <span>View Simulation Summary</span>
                    </button>
                </div>
            </div>

            {!isStrategy && (
                <>
                    <NewsTicker
                        items={visibleNews}
                        currentDate={currentBarTimestamp ?? startDate}
                        />
                    {newsError && (
                        <p className='text-xs text-[var(--red)]'>Couldn&apos;t load news for {event.ticker}.</p>
                    )}
                </>
            )}

            <div className='flex min-h-0 flex-1 flex-col gap-4 lg:flex-row'>
                <button
                    id='tut-chart'
                    type='button'
                    onClick={() => { if (step?.elementId === 'tut-chart') advanceStep(); }}
                    className='flex min-h-[420px] min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5 text-left'
                >
                    <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
                        <div>
                            <div className='text-xs font-medium text-white/50'>{allDates[dayIndex]}</div>
                            <div className='tabular-nums mt-1 text-2xl font-semibold'>COST: R{Number.parseFloat(currentPrice).toFixed(2)}</div>
                        </div>
                        <div className={`tabular-nums inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${priceChangePct >= 0 ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]' : 'bg-[rgba(247,148,29,0.15)] text-[var(--orange)]'}`}>
                            {priceChangePct >= 0 ? <TrendingUp aria-hidden='true' className='w-4 h-4' /> : <TrendingDown aria-hidden='true' className='w-4 h-4' />}
                            {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </div>
                    </div>
                    <div className='min-h-0 w-full flex-1'>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id={`grad-${event.id}`} x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.45} />
                                        <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} minTickGap={24} />
                                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ stroke: '#9ca3af' }}
                                    content={<CustomTooltip />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke='var(--blue)'
                                    strokeWidth={2.5}
                                    fill={`url(#grad-${event.id})`}
                                    dot={false}
                                    activeDot={{ r: 4, stroke: '#1c75bc' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-4 flex items-center gap-3'>
                        <div
                            role='progressbar'
                            aria-label='Simulation progress'
                            aria-valuemin={1}
                            aria-valuemax={allPrices.length}
                            aria-valuenow={dayIndex + 1}
                            className='h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]'
                        >
                            <div className='h-full rounded-full bg-[var(--blue)] transition-[width] duration-300' style={{ width: `${((dayIndex + 1) / allPrices.length) * 100}%` }}></div>
                        </div>
                        <div className='tabular-nums shrink-0 text-xs text-white/55'>Day {dayIndex + 1} of {allPrices.length}</div>
                    </div>
                </button>

                <div className='flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0'>
                    <button
                        id='tut-portfolio'
                        type='button'
                        onClick={() => { if (step?.elementId === 'tut-portfolio') advanceStep(); }}
                        className='w-full rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4 text-left'
                    >
                        <h3 className='mb-3 text-sm font-semibold'>Portfolio</h3>
                        <dl className='tabular-nums flex flex-col gap-2 text-sm'>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55'>Cash</dt>
                                <dd className='font-semibold'>R {cash.toFixed(2)}</dd>
                            </div>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55' translate='no'>{event.ticker}</dt>
                                <dd>{shares} sh</dd>
                            </div>
                            <div className='flex justify-between gap-3 border-t border-[var(--border)] pt-2'>
                                <dt className='text-white/55'>Total</dt>
                                <dd className='text-base font-semibold'>R {portfolioValue.toFixed(2)}</dd>
                            </div>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55'>Profit & Loss</dt>
                                <dd className={`font-semibold ${totalProfit >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>
                                    R{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                                </dd>
                            </div>
                        </dl>
                    </button>
                    <div className='rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4'>
                        <div className='tabular-nums mb-3 text-sm font-semibold'>Trade at R{Number.parseFloat(currentPrice).toFixed(2)} / sh</div>
                        <label htmlFor='tut-qty' className='mb-1.5 block text-xs font-medium text-white/55'>Quantity</label>
                        <input
                            id='tut-qty'
                            name='quantity'
                            type='number'
                            inputMode='numeric'
                            min="1"
                            step='1'
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            onBlur={() => {
                                const n = Number.parseFloat(qty);
                                if (Number.isNaN(n) || n < 1) setQty('1');
                            }}
                            placeholder='Quantity'
                            className='tabular-nums mb-3 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-center text-sm font-semibold [color-scheme:dark] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,117,188,0.35)]'
                        />
                        {total > 0 && (
                            <div className='tabular-nums mb-3 flex items-baseline justify-between text-xs text-white/55'>
                                Cost:<span className='text-base font-semibold text-white'> R{total.toFixed(2)}</span>
                            </div>
                        )}
                        {tradeError && (
                            <div role='alert' className='mb-3 rounded-lg bg-[rgba(237,28,36,0.1)] px-3 py-2 text-xs text-[#ff6b72]'>
                                {tradeError}
                            </div>
                        )}
                        <div className='flex gap-2'>
                            <button
                                id='tut-buy'
                                type='button'
                                className='h-10 flex-1 rounded-lg bg-[var(--green)] text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[#00a84e] active:scale-[0.98]'
                                onClick={() => setPendingTrade({ type: 'buy' })}
                            >
                                Buy
                            </button>
                            <button
                                type='button'
                                className='h-10 flex-1 rounded-lg bg-[#d4262d] text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[var(--red)] active:scale-[0.98]'
                                onClick={() => setPendingTrade({ type: 'sell' })}
                            >
                                Sell
                            </button>
                            {pendingTrade && (
                                <TradeConfirmModal 
                                    side={pendingTrade.type} 
                                    quantity={Number.parseFloat(qty)} 
                                    price={Number.parseFloat(currentPrice)} 
                                    onConfirm={async () => { await execute(pendingTrade.type); setPendingTrade(null) }}
                                    onCancel={() => { setPendingTrade(null) }} orderType="market" 
                                />
                            )}
                        </div>
                    </div>

                    <div className='rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4 space-y-3'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-sm font-semibold'>Call Option Risk</h3>
                            <span className='tabular-nums text-xs text-white/50'>DTE: {daysToExpiration}d</span>
                        </div>

                        <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs'>
                            <label htmlFor='strike-price' className='text-white/55'>Strike Price</label>
                            <div className='flex items-center gap-1'>
                                <input
                                    id='strike-price'
                                    type='number'
                                    value={strikePrice}
                                    onChange={(e) => { setStrikePrice(Number.parseFloat(e.target.value) || 0); setStrikeManuallySet(true) }}
                                    className='w-20 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-right font-mono text-xs text-white [color-scheme:dark] focus:border-[var(--blue)] focus:outline-none'
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

                        <div className='grid grid-cols-2 gap-2 text-xs'>
                            <GreekCell label="Delta (Δ)" value={greeksResult?.delta} decimals={3} unlocked={unlockedGreeks.delta} />
                            <GreekCell label="Gamma (Γ)" value={greeksResult?.gamma} decimals={4} unlocked={unlockedGreeks.gamma} />
                            <GreekCell label="Theta (Θ)" value={greeksResult?.theta} decimals={3} unlocked={unlockedGreeks.theta} />
                            <GreekCell label="Vega (ν)" value={greeksResult?.vega} decimals={3} unlocked={unlockedGreeks.vega} />
                            <GreekCell label="Rho (ρ)" value={greeksResult?.rho} decimals={3} unlocked={unlockedGreeks.rho} />
                        </div>
                    </div>

                    <div className='rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4'>
                        <h3 className='mb-3 text-sm font-semibold'>History</h3>
                        {trades.length === 0 ? <p className='text-xs text-white/45'>No trades</p> : (
                            <ul className='flex max-h-48 flex-col gap-1.5 overflow-y-auto'>
                                {[...trades].reverse().map((t, i) => (
                                    <li key={"n" + i} className='flex items-center gap-2'>
                                        <span aria-hidden='true' className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${t.type === 'buy' ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]' : 'bg-[rgba(247,148,29,0.15)] text-[var(--orange)]'}`} >{t.type === 'buy' ? '↑' : '↓'}</span>
                                        <span className='tabular-nums text-xs text-white/75'>{t.type.toUpperCase()} {t.qty} @ R{Number.parseFloat(t.price).toFixed(2)} ON {t.date}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function GreekCell({ label, value, decimals, unlocked }: {
    label: string;
    value: number | undefined;
    decimals: number;
    unlocked: boolean;
}) {
    if (!unlocked) {
        return (
            <div className='rounded-lg border border-white/[0.06] bg-white/[0.02] p-2'>
                <span className='block text-[10px] text-white/40'>{label}</span>
                <span className='inline-flex items-center gap-1 text-sm font-semibold text-white/40'>
                    <Lock aria-hidden='true' className='w-3 h-3' />
                    Locked
                </span>
            </div>
        );
    }
    return (
        <div className='rounded-lg border border-white/10 bg-white/[0.04] p-2'>
            <span className='block text-[10px] text-white/55'>{label}</span>
            <span className={`font-mono tabular-nums font-semibold text-sm ${value !== undefined ? 'text-white' : 'text-white/40'}`}>
                {(value ?? 0).toFixed(decimals)}
            </span>
        </div>
    );
}