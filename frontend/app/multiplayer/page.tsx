'use client';

import { Navbar } from '@/components/navbar';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserIdFromToken } from '@/lib/jwt';
import { useMultiplayerMatch } from '@/hooks/useMultiplayerMatch';

const CARD = 'rounded-2xl border border-white/10 bg-[rgba(20,20,32,0.6)]';
const MUTED = 'text-[var(--muted)]';
const BTN = 'rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50';

function wsBaseFromApiUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    return apiUrl.replace(/^http/, 'ws');
}

function opponentLabel(id: number | undefined): string {
    return id === undefined ? 'Opponent' : `Player #${id}`;
}

function formatSigned(n: number): string {
    return `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(2)}`;
}

function Sparkline({ values }: { values: number[] }) {
    if (values.length < 2) return <div className={`text-xs ${MUTED}`}>Waiting for prices…</div>;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / span) * 100}`).join(' ');
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full flex-1 min-h-[160px]">
            <polyline points={pts} fill="none" stroke="var(--blue)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const myUserId = useMemo(() => getUserIdFromToken(token), [token]);
    const m = useMultiplayerMatch(wsBaseFromApiUrl(), token);
    const { match, day } = m;

    const [qty, setQty] = useState(1);
    const [closes, setCloses] = useState<number[]>([]);

    useEffect(() => {
        if (!match) setCloses([]);
    }, [match]);
    useEffect(() => {
        if (day) setCloses((c) => (c.length === day.day_index ? [...c, day.bar.close] : [day.bar.close]));
    }, [day]);

    const isLobby = m.status === 'idle' || m.status === 'closed';
    const isQueueing = m.status === 'connecting' || m.status === 'queued';
    const isMatchFoundHolding = m.status === 'playing' && !!match && !day;
    const isPlaying = m.status === 'playing' && !!match && !!day;
    const isResults = m.status === 'ended' && !!m.end;

    if (isLoading) return <div className="p-8">Loading…</div>;
    if (!token) return <div className="p-8">Log in to play multiplayer.</div>;

    if (isLobby) {
        return (
            <>            <Navbar />
                <div className="mx-auto max-w-md p-8 text-center">
                    <h1 className="text-3xl font-extrabold mb-3">Head to head</h1>
                    <p className={`${MUTED} mb-6`}>Trade the same market as another player. Highest balance at the end wins.</p>
                    <button className={`${BTN} bg-[var(--accent)]`} onClick={m.connect}>Find match</button>
                    {m.error && <p className="mt-4 text-sm" style={{ color: 'var(--red)' }}>{m.error}</p>}
                </div>
            </>);
    }

    if (isQueueing) {
        return (
            <>
                <Navbar />
                <div className="mx-auto max-w-md p-8 text-center">
                    <p className="mb-6">Waiting for an opponent to queue…</p>
                    <button className={`${BTN} border border-white/10`} onClick={m.disconnect}>Cancel</button>
                </div>
            </>);
    }

    if (isMatchFoundHolding && match) {
        return (
            <>
                <Navbar />
                <div className="mx-auto max-w-md p-8 text-center">
                    <div className={`${CARD} p-6`}>
                        <div className="font-bold text-lg mb-1">You vs {opponentLabel(match.opponent_user_id)}</div>
                        <div className={MUTED}>{match.symbol} · {match.total_days} days · starting {match.initial_balance.toLocaleString()}</div>
                    </div>
                </div>
            </>);
    }

    if (isPlaying && match && day) {
        const start = match.initial_balance;
        const myProfit = day.cash_balance + day.position_qty * day.bar.close - start;
        const oppProfit = day.opponent_cash_balance + day.opponent_position_qty * day.bar.close - start;
        const total = Math.abs(myProfit) + Math.abs(oppProfit) || 1;
        const myLeading = myProfit >= oppProfit;
        const myBarPct = Math.round((Math.abs(myProfit) / total) * 100);
        const oa = m.lastOpponentAction;

        return (
            <>            <Navbar />
                <div className="flex flex-col gap-3 p-4 h-[calc(100vh-4rem)]">
                    <div className={`${CARD} p-4 flex items-center gap-4`}>
                        <div className="text-right flex-1">
                            <div className={`text-[11px] ${MUTED} mb-0.5`}>You</div>
                            <div className="font-extrabold text-base" style={{ color: myProfit >= 0 ? 'var(--green-light)' : 'var(--red)' }}>{formatSigned(myProfit)}</div>
                        </div>
                        <div className="w-[120px] h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="flex h-full">
                                <div className="transition-all" style={{ width: `${myLeading ? myBarPct : 100 - myBarPct}%`, background: 'var(--blue)' }} />
                                <div className="flex-1" style={{ background: 'var(--purple)' }} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className={`text-[11px] ${MUTED} mb-0.5`}>{opponentLabel(match.opponent_user_id)}</div>
                            <div className="font-extrabold text-base" style={{ color: oppProfit >= 0 ? 'var(--green-light)' : 'var(--red)' }}>{formatSigned(oppProfit)}</div>
                        </div>
                    </div>

                    <div className="flex flex-1 gap-3 min-h-0">
                        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
                            {day.qte ? (
                                <div className={`${CARD} flex-1 min-h-0 p-5 flex flex-col justify-center`} style={{ borderColor: 'rgba(247,148,29,0.35)' }} role="alert" aria-live="polite">
                                    <div className="text-xs font-bold mb-3" style={{ color: 'var(--orange)' }}>Quick question</div>
                                    <p className="text-lg font-semibold mb-5 max-w-lg">{day.qte.prompt}</p>
                                    <div className="flex flex-col gap-2.5 max-w-lg">
                                        {day.qte.options.map((option) => (
                                            <button
                                                key={option}
                                                disabled={m.actionSettled}
                                                onClick={() => m.answerQte(option)}
                                                className="text-left text-sm rounded-lg px-4 py-3 disabled:opacity-50 transition-colors"
                                                style={{ background: 'rgba(247,148,29,0.1)', border: '1px solid rgba(247,148,29,0.25)' }}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`${CARD} flex-1 min-h-0 p-3 flex flex-col`}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">{match.symbol}</span>
                                        <span>${day.bar.close.toFixed(2)}</span>
                                    </div>
                                    <Sparkline values={closes} />
                                </div>
                            )}
                        </div>

                        <div className="w-[270px] flex flex-col gap-3">
                            <div className={`${CARD} p-4`}>
                                <div className="font-bold text-sm mb-2.5">Day {day.day_index + 1}/{match.total_days}</div>
                                <div className="text-xs mb-3 space-y-1">
                                    <div>Cash: ${day.cash_balance.toFixed(2)}</div>
                                    <div>Position: {day.position_qty}</div>
                                </div>
                                <input
                                    type="number" min={1} value={qty}
                                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                                    className="w-full mb-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
                                    aria-label="Quantity"
                                />
                                <div className="flex gap-2">
                                    <button className={`${BTN} flex-1`} style={{ background: 'var(--green)' }} disabled={m.actionSettled} onClick={() => m.buy(qty)}>Buy</button>
                                    <button className={`${BTN} flex-1`} style={{ background: 'var(--red)' }} disabled={m.actionSettled} onClick={() => m.sell(qty)}>Sell</button>
                                    <button className={`${BTN} flex-1 border border-white/10`} disabled={m.actionSettled} onClick={m.hold}>Hold</button>
                                </div>
                                {m.error && <p className="mt-2 text-xs" style={{ color: 'var(--red)' }}>{m.error}</p>}
                            </div>

                            <div className={`${CARD} p-4 flex-1`}>
                                <div className="font-bold text-sm mb-2.5">Opponent activity</div>
                                {oa ? (
                                    <div
                                        key={`${oa.day_index}-${oa.action}-${oa.qty}`}
                                        className="text-xs rounded-lg px-3 py-2.5 motion-reduce:animate-none"
                                        style={{ animation: 'mpBlip 3.5s ease forwards', background: 'rgba(105,80,161,0.1)', border: '1px solid rgba(105,80,161,0.2)', color: 'rgba(255,255,255,0.8)' }}
                                        aria-live="polite"
                                    >
                                        {opponentLabel(match.opponent_user_id)} {oa.action === 'buy' ? 'bought' : 'sold'} ×{oa.qty} {match.symbol}
                                    </div>
                                ) : (
                                    <div className={`text-xs ${MUTED} text-center py-3`}>Watching for moves…</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>);
    }

    if (isResults && m.end) {
        const w = m.end.winner_user_id;
        const title = w === null ? "It's a draw" : w === myUserId ? 'You won' : 'You lost';
        return (
            <>
                <Navbar />
                <div className="mx-auto max-w-md p-8 text-center">
                    <h2 className="text-3xl font-extrabold mb-2">{title}</h2>
                    {m.end.reason === 'opponent_disconnected' && <p className={`${MUTED} mb-4`}>Your opponent disconnected.</p>}
                    <div className={`${CARD} p-4 mb-6 text-sm space-y-1`}>
                        {Object.entries(m.end.final_balances).map(([id, bal]) => (
                            <div key={id} className="flex justify-between">
                                <span>{Number(id) === myUserId ? 'You' : opponentLabel(Number(id))}</span>
                                <span>${bal.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button className={`${BTN} border border-white/10`} onClick={m.disconnect}>Back to lobby</button>
                        <button className={`${BTN} bg-[var(--accent)]`} onClick={() => { m.disconnect(); m.connect(); }}>Play again</button>
                    </div>
                </div>
            </>);
    }

    return (
        <>
            <Navbar />
            <div className="p-8">Connecting…</div>
        </>
    );
}