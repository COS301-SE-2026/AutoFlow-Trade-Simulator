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
import { MoveLeft, TrendingUp, TrendingDown, Minus, Plus, Timer, CheckCircle2, XCircle, Lock } from 'lucide-react';
import TradeConfirmModal from './TradeConfirmModal';
import { ScrollableChart } from '@/components/ScrollableChart';
import type { UseMultiplayerMatch } from '@/hooks/useMultiplayerMatch';

type ChartPoint = { day: number; date: string; price: number };

const PANEL = 'rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-4';

function money(n: number): string {
    return `R${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function signedMoney(n: number): string {
    return `${n >= 0 ? '+' : '-'}${money(Math.abs(n))}`;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const data = payload[0].payload as ChartPoint;
        return (
            <div className='rounded-lg border border-white/10 bg-[#12121c] px-3 py-2 text-xs shadow-lg'>
                <p className='mb-1 text-white/55'>Day {data.day + 1} · {data.date}</p>
                <p className='tabular-nums font-semibold'>{money(data.price)}</p>
            </div>
        );
    }
    return null;
};

function QteCountdown({ seconds, dayIndex }: { seconds: number; dayIndex: number }) {
    const [left, setLeft] = useState(seconds);
    useEffect(() => {
        setLeft(seconds);
        const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [seconds, dayIndex]);
    return (
        <span className={`tabular-nums inline-flex items-center gap-1 text-xs font-semibold ${left <= 3 ? 'text-[#ff6b72]' : 'text-white/60'}`}>
            <Timer aria-hidden='true' className='h-3.5 w-3.5' />
            {left}s
        </span>
    );
}

export function MultiplayerArena({
    m,
    onBack,
    myUserId = null,
    opponentLabel = 'Opponent',
}: Readonly<{
    m: UseMultiplayerMatch;
    onBack: () => void;
    myUserId?: number | null;
    opponentLabel?: string;
}>) {
    const gradId = useId().replace(/:/g, '');

    const [pendingTrade, setPendingTrade] = useState<{ type: 'buy' | 'sell' } | null>(null);
    const [qty, setQty] = useState('1');
    const [confirmLeave, setConfirmLeave] = useState(false);

    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    useEffect(() => {
        if (!m.day) {
            return;
        }
        const d = m.day;
        setChartData((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.day === d.day_index) return prev;
            return [...prev, { day: d.day_index, date: d.date, price: d.bar.close }];
        });
    }, [m.day]);

    if (!m.day || !m.match) {
        return null;
    }

    const day = m.day;
    const match = m.match;

    const cash = day.cash_balance;
    const shares = day.position_qty;
    const currentPrice = day.bar.close;
    const start = match.initial_balance;
    const portfolioValue = cash + shares * currentPrice;
    const totalProfit = portfolioValue - start;
    const profitPct = (totalProfit / start) * 100;
    const progressPct = ((day.day_index + 1) / match.total_days) * 100;

    const opponentValue = day.opponent_cash_balance + day.opponent_position_qty * currentPrice;
    const opponentProfit = opponentValue - start;
    const leading = totalProfit >= opponentProfit;
    // 50% when tied; slides toward whoever is further ahead
    const spread = Math.abs(totalProfit) + Math.abs(opponentProfit) || 1;
    const myShare = 50 + 50 * ((totalProfit - opponentProfit) / spread);

    const firstPrice = chartData[0]?.price ?? currentPrice;
    const priceChangePct = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    const qtyNum = Number.parseFloat(qty) || 0;
    const total = qtyNum * currentPrice;
    const maxBuy = currentPrice > 0 ? Math.floor(cash / currentPrice) : 0;
    const maxSell = Math.floor(shares);

    const qte = day.qte;
    const settled = m.actionSettled;
    const lastResult = m.lastQteResult;
    const myOutcome = lastResult && myUserId !== null ? lastResult.per_player[String(myUserId)] : undefined;

    const step = (delta: number) => setQty(String(Math.max(1, Math.floor(qtyNum) + delta)));

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
    };

    const tradeBtn = 'h-10 flex-1 rounded-lg text-sm font-semibold text-white transition-[background-color,transform,opacity] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';

    return (
        <div className='flex h-full flex-col gap-4 p-4 md:p-6'>
            {/* top bar */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                    {confirmLeave ? (
                        <div role='alert' className='flex items-center gap-2 rounded-lg border border-[rgba(237,28,36,0.4)] bg-[rgba(237,28,36,0.08)] px-3 py-1.5 text-sm'>
                            <span className='text-white/80'>Leave and forfeit this match?</span>
                            <button type='button' onClick={onBack} className='rounded-md bg-[#d4262d] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--red)]'>
                                Leave
                            </button>
                            <button type='button' onClick={() => setConfirmLeave(false)} className='rounded-md px-2.5 py-1 text-xs font-semibold text-white/70 hover:text-white'>
                                Stay
                            </button>
                        </div>
                    ) : (
                        <button
                            type='button'
                            onClick={() => setConfirmLeave(true)}
                            className='inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white'
                        >
                            <MoveLeft aria-hidden='true' className='h-4 w-4' />
                            <span>Back</span>
                        </button>
                    )}
                    <span className='rounded-md bg-[rgba(28,117,188,0.15)] px-2 py-0.5 font-mono text-sm font-semibold text-[#6fb4ea]' translate='no'>{match.symbol}</span>
                    <span className='tabular-nums font-semibold'>Day {day.day_index + 1} of {match.total_days}</span>
                </div>

                <div className='flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] px-4 py-2' aria-label='Score against your opponent'>
                    <div className='text-right'>
                        <div className='text-[11px] text-white/50'>You</div>
                        <div className={`tabular-nums text-sm font-semibold ${totalProfit >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>{signedMoney(totalProfit)}</div>
                    </div>
                    <div className='h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(105,80,161,0.6)]' aria-hidden='true'>
                        <div className='h-full bg-[var(--blue)] transition-[width] duration-500' style={{ width: `${Math.min(100, Math.max(0, myShare))}%` }} />
                    </div>
                    <div>
                        <div className='text-[11px] text-white/50'>{opponentLabel}</div>
                        <div className={`tabular-nums text-sm font-semibold ${opponentProfit >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>{signedMoney(opponentProfit)}</div>
                    </div>
                    <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${totalProfit === opponentProfit ? 'bg-white/[0.06] text-white/60' : leading ? 'bg-[rgba(28,117,188,0.2)] text-[#8cc4ef]' : 'bg-[rgba(105,80,161,0.25)] text-[#c4b5fd]'}`}>
                        {totalProfit === opponentProfit ? 'Tied' : leading ? 'Leading' : 'Behind'}
                    </span>
                </div>
            </div>

            <div className='flex min-h-0 flex-1 flex-col gap-4 lg:flex-row'>
                {/* main panel: QTE replaces the chart when one is active */}
                {qte ? (
                    <div role='alert' aria-live='polite' className='flex min-h-[420px] min-w-0 flex-1 flex-col justify-center rounded-2xl border border-[rgba(247,148,29,0.4)] bg-[rgba(247,148,29,0.05)] p-6 md:p-8'>
                        <div className='mb-4 flex items-center justify-between gap-3'>
                            <span className='text-sm font-semibold text-[var(--orange)]'>Quick question</span>
                            {!m.qteAnswered && <QteCountdown seconds={qte.timeout_seconds} dayIndex={day.day_index} />}
                        </div>
                        <p className='mb-6 max-w-2xl text-xl font-semibold leading-snug'>{qte.prompt}</p>
                        <div className='grid max-w-2xl gap-2.5 sm:grid-cols-2'>
                            {qte.options.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    disabled={m.qteAnswered}
                                    onClick={() => { m.answerQte(option); }}
                                    className='rounded-xl border border-[rgba(247,148,29,0.3)] bg-[rgba(247,148,29,0.08)] px-4 py-3 text-left text-sm font-medium transition-colors hover:border-[rgba(247,148,29,0.6)] hover:bg-[rgba(247,148,29,0.14)] disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <p className='mt-5 text-xs text-white/55'>
                            {m.qteAnswered
                                ? 'Answer locked in. Waiting for your opponent…'
                                : settled
                                    ? 'You have already traded today, so answering won’t affect your move.'
                                    : 'Answering counts as your move for today (a hold), so trade first if you want to.'}
                        </p>
                    </div>
                ) : (
                    <div className='flex min-h-[420px] min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5'>
                        <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
                            <div>
                                <div className='text-xs font-medium text-white/50'>{day.date}</div>
                                <div className='tabular-nums mt-1 text-2xl font-semibold'>COST: {money(currentPrice)}</div>
                            </div>
                            <div className={`tabular-nums inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${priceChangePct >= 0 ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]' : 'bg-[rgba(247,148,29,0.15)] text-[var(--orange)]'}`}>
                                {priceChangePct >= 0 ? <TrendingUp aria-hidden='true' className='h-4 w-4' /> : <TrendingDown aria-hidden='true' className='h-4 w-4' />}
                                {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                            </div>
                        </div>
                        <ScrollableChart points={chartData.length} className='min-h-0 w-full flex-1'>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 16, left: 4, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id={`grad-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#1c75bc' stopOpacity={0.45} />
                                            <stop offset='95%' stopColor='#1c75bc' stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 10 }} />
                                    <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(2)} width={60} tick={{ fontSize: 10 }} />
                                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.25)' }} content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="price" stroke='#1c75bc' strokeWidth={2.5} fill={`url(#grad-${gradId})`} dot={false} activeDot={{ r: 5, stroke: '#1c75bc', fill: '#12121c', strokeWidth: 2 }} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ScrollableChart>
                        <div className='mt-4 flex items-center gap-3'>
                            <div role='progressbar' aria-label='Match progress' aria-valuemin={1} aria-valuemax={match.total_days} aria-valuenow={day.day_index + 1} className='h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]'>
                                <div className='h-full rounded-full bg-[var(--blue)] transition-[width] duration-300' style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className='tabular-nums shrink-0 text-xs text-white/55'>Day {day.day_index + 1} of {match.total_days}</div>
                        </div>
                    </div>
                )}

                {/* sidebar */}
                <div className='flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0'>
                    <div className={PANEL}>
                        <h3 className='mb-3 text-sm font-semibold'>Portfolio</h3>
                        <dl className='tabular-nums flex flex-col gap-2 text-sm'>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55'>Cash</dt>
                                <dd className='font-semibold'>{money(cash)}</dd>
                            </div>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55' translate='no'>{match.symbol}</dt>
                                <dd>{shares} sh</dd>
                            </div>
                            <div className='flex justify-between gap-3 border-t border-[var(--border)] pt-2'>
                                <dt className='text-white/55'>Total</dt>
                                <dd className='text-base font-semibold'>{money(portfolioValue)}</dd>
                            </div>
                            <div className='flex justify-between gap-3'>
                                <dt className='text-white/55'>Profit &amp; Loss</dt>
                                <dd className={`font-semibold ${totalProfit >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>
                                    {signedMoney(totalProfit)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className={PANEL}>
                        <div className='tabular-nums mb-3 text-sm font-semibold'>Trade at {money(currentPrice)} / sh</div>
                        {settled ? (
                            <div className='flex items-start gap-2 rounded-lg bg-white/[0.04] px-3 py-3 text-sm text-white/75'>
                                <Lock aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0 text-white/50' />
                                <span>Your move is locked in for today. Waiting for the next day…</span>
                            </div>
                        ) : (
                            <>
                                <label htmlFor='mp-qty' className='mb-1.5 flex justify-between text-xs font-medium text-white/55'>
                                    <span>Quantity</span>
                                    <span className='tabular-nums'>Max buy {maxBuy} · sell {maxSell}</span>
                                </label>
                                <div className='mb-3 flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.04] focus-within:border-[var(--blue)]'>
                                    <button type='button' aria-label='Decrease quantity' onClick={() => step(-1)} className='flex h-full w-10 items-center justify-center text-white/70 hover:text-white'>
                                        <Minus aria-hidden='true' className='h-4 w-4' />
                                    </button>
                                    <input
                                        id='mp-qty'
                                        name='quantity'
                                        type='number'
                                        inputMode='numeric'
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
                                        className='tabular-nums h-full min-w-0 flex-1 bg-transparent text-center text-sm font-semibold [color-scheme:dark] focus:outline-none'
                                    />
                                    <button type='button' aria-label='Increase quantity' onClick={() => step(1)} className='flex h-full w-10 items-center justify-center text-white/70 hover:text-white'>
                                        <Plus aria-hidden='true' className='h-4 w-4' />
                                    </button>
                                </div>
                                {total > 0 && (
                                    <div className='tabular-nums mb-3 flex items-baseline justify-between text-xs text-white/55'>
                                        Cost<span className='text-base font-semibold text-white'>{money(total)}</span>
                                    </div>
                                )}
                                <div className='flex gap-2'>
                                    <button
                                        type='button'
                                        disabled={qtyNum > maxBuy}
                                        title={qtyNum > maxBuy ? 'Not enough cash' : undefined}
                                        className={`${tradeBtn} bg-[var(--green)] hover:bg-[#00a84e]`}
                                        onClick={() => setPendingTrade({ type: 'buy' })}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        type='button'
                                        disabled={qtyNum > maxSell}
                                        title={qtyNum > maxSell ? 'Not enough shares' : undefined}
                                        className={`${tradeBtn} bg-[#d4262d] hover:bg-[var(--red)]`}
                                        onClick={() => setPendingTrade({ type: 'sell' })}
                                    >
                                        Sell
                                    </button>
                                </div>
                                <p className='mt-2 text-[11px] text-white/40'>One move per day. If you don&apos;t act, you hold.</p>
                            </>
                        )}
                        {m.error && (
                            <div role='alert' className='mt-3 rounded-lg bg-[rgba(237,28,36,0.1)] px-3 py-2 text-xs text-[#ff6b72]'>
                                {m.error}
                            </div>
                        )}
                        {pendingTrade && (
                            <TradeConfirmModal
                                side={pendingTrade.type}
                                quantity={qtyNum}
                                price={currentPrice}
                                onConfirm={handleConfirm}
                                onCancel={() => setPendingTrade(null)}
                                orderType='market'
                            />
                        )}
                    </div>

                    {lastResult && (
                        <div className={PANEL}>
                            <h3 className='mb-2 text-sm font-semibold'>Last quick question</h3>
                            {myOutcome ? (
                                <div className={`flex items-start gap-2 text-sm ${myOutcome.correct ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>
                                    {myOutcome.correct ? <CheckCircle2 aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0' /> : <XCircle aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0' />}
                                    <span>
                                        {myOutcome.answer === null ? 'No answer' : myOutcome.correct ? 'Correct' : 'Incorrect'}
                                        {myOutcome.cash_delta !== 0 && <span className='tabular-nums'> ({signedMoney(myOutcome.cash_delta)})</span>}
                                    </span>
                                </div>
                            ) : null}
                            <p className='mt-1.5 text-xs text-white/55'>Answer: {lastResult.correct_answer}</p>
                        </div>
                    )}

                    <div className={PANEL}>
                        <h3 className='mb-2 text-sm font-semibold'>Opponent activity</h3>
                        {m.lastOpponentAction ? (
                            <div
                                key={`${m.lastOpponentAction.day_index}-${m.lastOpponentAction.action}-${m.lastOpponentAction.qty}`}
                                aria-live='polite'
                                className='rounded-lg border border-[rgba(105,80,161,0.3)] bg-[rgba(105,80,161,0.12)] px-3 py-2 text-xs text-white/85 motion-safe:[animation:mpBlip_3.5s_ease_forwards]'
                            >
                                {opponentLabel} {m.lastOpponentAction.action === 'buy' ? 'bought' : 'sold'} ×{m.lastOpponentAction.qty} {match.symbol}
                            </div>
                        ) : (
                            <div className='py-2 text-center text-xs text-white/45'>Watching for moves…</div>
                        )}
                    </div>

                    <div className={PANEL}>
                        <h3 className='mb-2 text-sm font-semibold'>Your trades</h3>
                        {m.myTrades.length === 0 ? (
                            <p className='text-xs text-white/45'>No trades yet</p>
                        ) : (
                            <ul className='flex max-h-40 flex-col gap-1.5 overflow-y-auto'>
                                {[...m.myTrades].reverse().map((t, i) => (
                                    <li key={`${t.day_index}-${i}`} className='flex items-center gap-2'>
                                        <span aria-hidden='true' className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${t.action === 'buy' ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]' : 'bg-[rgba(237,28,36,0.15)] text-[#ff6b72]'}`}>
                                            {t.action === 'buy' ? '↑' : '↓'}
                                        </span>
                                        <span className='tabular-nums text-xs text-white/75'>
                                            {t.action.toUpperCase()} {t.qty} @ {money(t.price)} · Day {t.day_index + 1}
                                        </span>
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
