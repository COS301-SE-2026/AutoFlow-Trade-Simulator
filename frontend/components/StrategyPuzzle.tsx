'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { MoveLeft, Play, ChevronsRight, Pause, Check, TrendingUp, TrendingDown, Gauge, Brain, Lock } from 'lucide-react';
import type { 
    PuzzleBar,
    PuzzleStartResponse,
    PuzzleAction,
    PuzzleSubmitResponse,
} from '@/lib/types/puzzle';
import { usePuzzle } from '@/hooks/usePuzzle';
import { getPuzzleGuide } from '@/lib/puzzleGuides';

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

const SPEEDS = [1, 2, 4] as const;
const BASE_INTERVAL_MS = 3000;
const PUZZLE_STARTING_BALANCE = 100000;

interface LocalTrade {
    dayIndex: number;
    action: 'buy' | 'sell';
    qty: number;
    price: number;
}

export function StrategyPuzzle({ 
    strategyId,
    strategyName,
    asset = 'AAPL',
    onBack,
}: {
    strategyId: number;
    strategyName: string;
    asset?: string;
    onBack: () => void;
}) {
    const guide = useMemo(() => getPuzzleGuide(strategyName), [strategyName]);
    const { startPuzzle, submitPuzzle: submitPuzzleApi } = usePuzzle();

    const [puzzle, setPuzzle] = useState<PuzzleStartResponse | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dayIndex, setDayIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const [shares, setShares] = useState(0);
    const [qty, setQty] = useState('1');
    const [cash, setCash] = useState(PUZZLE_STARTING_BALANCE);
    const [trades, setTrades] = useState<LocalTrade[]>([]);
    const [tradeError, setTradeError] = useState<string | null>(null);

    const [speed, setSpeed] = useState(1);

    const [phase, setPhase] = useState<'sim' | 'submitting' | 'graded'>('sim');
    const [result, setResult] = useState<PuzzleSubmitResponse | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const res = await startPuzzle(strategyId, asset);
            if (cancelled) return;
            if (res) setPuzzle(res);
            else setLoadError('Failed to load puzzle. Please try again.')
        };
        load();
        return () => { cancelled = true; };
    }, [strategyId, asset, startPuzzle]);

    const bars = puzzle?.bars ?? [];
    const totalDays = bars.length;
    const currentBar = bars[dayIndex];
    const currentPrice = currentBar?.close ?? 0;
    const startPrice = bars[0]?.close ?? 0;
    const isFinished = totalDays > 0 && dayIndex >= totalDays - 1;

    const portfolioValue = cash + shares * currentPrice;
    const totalProfit = portfolioValue - PUZZLE_STARTING_BALANCE;
    const profitPct = (PUZZLE_STARTING_BALANCE > 0 ? (totalProfit / PUZZLE_STARTING_BALANCE) * 100 : 0);
    const priceChangePct = startPrice > 0 ? (((currentPrice - startPrice) / startPrice) * 100) : 0;

    const chartData = useMemo(() => 
        bars.slice(0, dayIndex + 1).map((p, i) => ({
            date: `Day ${i + 1}`,
            price: p.close,
        })),
        [bars, dayIndex],
    );

    useEffect(() => {
        if (!isPlaying || isFinished || phase !== 'sim') {
            setIsPlaying(false);
            return;
        }

        const id = setInterval(() => setDayIndex(d => Math.min(d + 1, totalDays - 1)), BASE_INTERVAL_MS / speed );
    return () => clearInterval(id);
    }, [isPlaying, isFinished, totalDays, speed, phase]);

    const stepForward = () => setDayIndex(d => Math.min(d + 1, totalDays - 1));

    const execute = (action: 'buy' | 'sell') => {
        if (!currentBar) return;
        if (trades.length >= 100) {
            setTradeError(`Trade limit reached (100)`);
            setTimeout(() => setTradeError(null), 3000);
            return;
        }

        let n = Math.max(1, Math.floor(Number(qty) || 1));
        const price = currentBar.close;

        if (action === 'buy' ) {
            const cost = n * price;
            if (cost > cash) {
                setTradeError(`Not enough cash. You need R ${cost.toFixed(2)}.`);
                setTimeout(() => setTradeError(null), 3000);
                return;
            }
            setCash(c => c - n * price);
            setShares(s => s + n);
        } else {
            if (shares <= 0) {
                setTradeError('You have no shares to sell.');
                setTimeout(() => setTradeError(null), 3000);
                return;
            }
            n = Math.min(n, shares);
            setCash(c => c + n * price);
            setShares(s => s - n);
        }   

        setTrades(prev => [...prev, { dayIndex, action, qty: n, price }]);
    };

    const submit = async () => {
        if (!puzzle || phase !== 'sim') return;
        if (trades.length === 0) {
            setSubmitError('Make at least one trade before submitting.');
            setTimeout(() => setSubmitError(null), 3000);
            return;
        }

        setPhase('submitting');
        setIsPlaying(false);
        setSubmitError(null);

        const actions: PuzzleAction[] = trades.map(t => ({
            day_index: t.dayIndex,
            action: t.action,
            qty: t.qty,
        }));

        const res = await submitPuzzleApi(puzzle.puzzle_id, { actions });

        if (!res) {
            setSubmitError('Failed to submit puzzle. Please try again.');
            setPhase('sim');
            return;
        }

        setResult(res);
        setPhase('graded');
    };

    if (loadError) {
        return (
            <div className='flex items-center justify-center h-full p-6'>
                <div className='p-6 bg-[var(--background)] border border-[var(--border)] rounded-xl max-w-md w-full text-center'>
                    <p className='font-bold mb-2 text-[var(--red)]'>Puzzle unavailable</p>
                    <p className='text-sm text-gray-400 mb-4'>{loadError}</p>
                    <button
                        type='button'
                        onClick={onBack}
                        className='px-4 py-2 bg-blue-900 rounded-xl text-sm font-semibold'
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className='flex items-center justify-center h-full'>
                <div className='p-6 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm'>
                    Loading puzzle...
                </div>
            </div>
        );
    }

    const total = Number.parseFloat(qty) > 0 ? Number.parseFloat(qty) * currentPrice : 0;

    return (
        <div className='flex flex-col p-4 h-full min-h-0 gap-3'>
            <div className='flex justify-between items-center gap-3 shrink-0'>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={onBack}
                        className='text-sm text-gray-200 hover:text-white p-2'
                    >
                        <div className='flex items-center gap-2'>
                            <MoveLeft />
                            <span>Back</span>
                        </div>
                    </button>
                    <Brain className='w-4 h-4 text-[#b09ae0]' />
                    <span className='font-bold text-sm'>Strategy Puzzle</span>
                    <span className='text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[var(--background)] border border-[var(--border)]'>
                        {strategyName}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='flex flex-row gap-1 bg-blue-900 border border-[var(--border)] items-center px-3 rounded-xl font-semibold text-sm'>
                        <Gauge className='mr-2 w-4 h-4' />
                        <span className='mr-2'>Speed Controls:</span>
                        {[1, 2, 4].map((s) => {

                            return (
                                <button
                                    key={s}
                                    type='button'
                                    onClick={() => { setSpeed(s) }}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm border-[var(--border)] border-2
                                        ${speed === s ? 'bg-[var(--background-alt)]' : 'bg-blue-900'}`}
                                >
                                    {s}x
                                </button>
                            )
                        })}
                    </div>

                    <button
                        type='button'
                        disabled={isFinished}
                        onClick={() => { setIsPlaying(b => !b) }}
                        className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm'
                    >
                        <div className='flex items-center gap-3'>
                            {isPlaying ? <><Pause /> Pause</> : <><Play /> Play</>}
                        </div>
                    </button>

                    <button
                        type='button'
                        onClick={stepForward}
                        disabled={isFinished}
                        className='bg-blue-900 border border-[var(--border)] flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm disabled:opacity-50'
                    >
                        <div className='flex items-center gap-3'>
                            <ChevronsRight />
                            <span className='text-white'>Skip Forward</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className='flex gap-4 flex-1 min-h-0'>
                <div
                    className='flex-1 rounded-xl border border-[var(--border)] p-4 flex flex-col min-w-0'
                >
                    <div className='flex justify-between items-center mb-2 shrink-0'>
                        <div className='text-lg font-bold'>Day {dayIndex + 1} of {totalDays}</div>
                        <div className='text-xl font-bold'>COST: R{Number(currentPrice).toFixed(2)}</div>
                        <div className={`text-sm flex items-center gap-1 ${priceChangePct >= 0 ? 'text-[var(--green)]' : 'text-[var(--orange)]'}`}>
                            {priceChangePct >= 0 ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                            {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </div>
                    </div>
                    <div className='flex-1 min-h-0'>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id={`grad-${asset}`} x1='0' y1='0' x2='0' y2='1'>
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
                                    fill={`url(#grad-${asset})`}
                                    dot={false}
                                    activeDot={{ r: 4, stroke: '#1c75bc' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-2 mb-2 h-1 bg-gray-800 rounded-full shrink-0'>
                        <div
                            className='h-full bg-[var(--blue)] rounded-full transition-all duration-200'
                            style={{width: `${((dayIndex + 1) / Math.max(totalDays, 1)) * 100}%`}}
                        />
                    </div>
                </div>

                <div className='w-64 flex flex-col gap-3 shrink-0 overflow-y-auto'>
                    {guide && (
                        <div className='p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]'>
                            <div className='text-xs font-bold uppercase tracking-wider mb-2'>
                                Strategy Guide
                            </div>
                            <ol className='space-y-1.5'>
                                {guide.map((rule, i) => (
                                    <li
                                        key={i}
                                        className='flex gap-2 text-xs leading-relaxed '
                                    >
                                        <span className='shrink-0 font-bold mt-px'>
                                            {i + 1}.
                                        </span>
                                        {rule}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                    <div
                        className='p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]'
                    >
                        <div className='font-bold mb-3 justify-center'>PORTFOLIO</div>
                        <div className='flex justify-between'>
                            <span>Cash</span>
                            <span className='text-lg font-bold text-[var(--green)]'>R {cash.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>{asset}</span>
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
                        <div className='text-xs font-bold mb-2'>TRADE AT {Number(currentPrice).toFixed(2)} / sh</div>
                        <input
                            id='tut-qty'
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
                                onClick={() => execute('buy')}
                            >
                                Buy
                            </button>
                            <button
                                type='button'
                                className='w-full py-1.5 px-3 rounded-xl bg-[var(--red)] border-[var(--border)]'
                                onClick={() => execute('sell')}
                                disabled={shares === 0}
                            >
                                Sell
                            </button>
                        </div>
                    </div>

                    <div className='rounded-xl border border-[var(--border)] bg-[var(--background)] p-3'>
                        History
                        {trades.length === 0 ? <p>No trades</p> : [...trades].reverse().map((t, i) => (
                            <div key={"n" + i} className='flex items-center gap-2 mb-1'>
                                <span className={`font-bold ${t.action === 'buy' ? 'text-[var(--green)]' : 'text-[var(--orange)]'}`} >{t.action === 'buy' ? '↑' : '↓'}</span>
                                <span className='text-xs'>{t.action.toUpperCase()} {t.qty} @ R{Number(t.price).toFixed(2)} ON Day {t.dayIndex + 1}</span>
                            </div>
                        ))

                        }
                    </div>
                    {submitError && (
                        <div className='text-xs text-[var(--red)] text-center'>
                            {submitError}
                        </div>
                    )}

                    <button
                        type='button'
                        onClick={submit}
                        disabled={phase === 'submitting' || trades.length === 0}
                        className='bg-purple-700 hover:bg-purple-600 border border-var[var(--border)] flex items-center justify-center
                        gap-2 px-3 py-2 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <Check className='w-4 h-4' />
                        {phase === 'submitting' ? 'Submitting...' : 'Submit & Grade'}
                    </button>
                </div>
            </div>
        </div>
    );
}