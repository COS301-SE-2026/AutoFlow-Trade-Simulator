'use client';

import { Navbar } from '@/components/navbar';
import { useMemo } from 'react';
import Link from 'next/link';
import { Swords, Users, Trophy, Handshake, Frown, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserIdFromToken } from '@/lib/jwt';
import { useMultiplayerMatch } from '@/hooks/useMultiplayerMatch';
import { MultiplayerArena } from '@/components/MultiplayerArena';

function wsBaseFromApiUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    return apiUrl.replace(/^http/, 'ws');
}

function opponentLabel(id: number | undefined): string {
    return id === undefined ? 'Opponent' : `Player ${id}`;
}

function money(n: number): string {
    return `R${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CARD = 'rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.8)]';
const MUTED = 'text-[var(--muted)]';
const PRIMARY = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-6 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[#2385d1] active:scale-[0.98] disabled:opacity-50';
const SECONDARY = 'inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white';

function Centered({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main className='mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center'>
                {children}
            </main>
        </>
    );
}

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const myUserId = useMemo(() => getUserIdFromToken(token), [token]);
    const wsBase = useMemo(() => wsBaseFromApiUrl(), []);
    const m = useMultiplayerMatch(wsBase, token);

    const isLobby = m.status === 'idle' || m.status === 'closed';
    const isQueueing = m.status === 'connecting' || m.status === 'queued';
    const isMatchFoundHolding = m.status === 'playing' && !!m.match && !m.day;
    const isPlaying = m.status === 'playing' && !!m.match && !!m.day;
    const isResults = m.status === 'ended' && !!m.end;

    if (isLoading) {
        return (
            <Centered>
                <p aria-busy='true' className={MUTED}>Loading…</p>
            </Centered>
        );
    }

    if (!token) {
        return (
            <Centered>
                <p className={MUTED}>
                    <Link href='/login' className='font-semibold text-white underline underline-offset-4'>Log in</Link> to play multiplayer.
                </p>
            </Centered>
        );
    }

    if (isResults && m.end) {
        const winner = m.end.winner_user_id;
        const outcome = winner === null ? 'draw' : winner === myUserId ? 'win' : 'loss';
        const title = outcome === 'draw' ? 'Draw' : outcome === 'win' ? 'You won!' : 'You lost';
        const Icon = outcome === 'draw' ? Handshake : outcome === 'win' ? Trophy : Frown;
        const tone = outcome === 'win' ? 'text-[var(--green-light)]' : outcome === 'loss' ? 'text-[#ff6b72]' : 'text-white/80';
        const start = m.match?.initial_balance ?? null;
        const rows = Object.entries(m.end.final_balances)
            .map(([id, bal]) => ({ id: Number(id), bal }))
            .sort((a, b) => b.bal - a.bal);

        return (
            <Centered>
                <div className={`${CARD} w-full p-8 motion-safe:[animation:mpCardIn_0.5s_ease-out]`}>
                    <Icon aria-hidden='true' className={`mx-auto mb-3 h-10 w-10 ${tone}`} />
                    <h1 className={`mb-1 text-3xl font-semibold ${tone}`}>{title}</h1>
                    {m.end.reason === 'opponent_disconnected' && <p className={`mb-2 text-sm ${MUTED}`}>Your opponent disconnected.</p>}
                    {m.match && <p className={`mb-6 text-sm ${MUTED}`}>{m.match.symbol} · {m.match.total_days} days</p>}
                    <dl className='mb-8 flex flex-col gap-2 text-left'>
                        {rows.map(({ id, bal }) => {
                            const isMe = id === myUserId;
                            const pnl = start === null ? null : bal - start;
                            return (
                                <div key={id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isMe ? 'border-[rgba(28,117,188,0.4)] bg-[rgba(28,117,188,0.08)]' : 'border-[var(--border)] bg-white/[0.02]'}`}>
                                    <dt className='font-medium'>{isMe ? 'You' : opponentLabel(id)}</dt>
                                    <dd className='tabular-nums text-right'>
                                        <div className='font-semibold'>{money(bal)}</div>
                                        {pnl !== null && (
                                            <div className={`text-xs ${pnl >= 0 ? 'text-[var(--green-light)]' : 'text-[#ff6b72]'}`}>
                                                {pnl >= 0 ? '+' : '-'}{money(Math.abs(pnl))}
                                            </div>
                                        )}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                    <div className='flex flex-wrap justify-center gap-3'>
                        <button type='button' className={SECONDARY} onClick={m.disconnect}>Back to Lobby</button>
                        <button type='button' className={PRIMARY} onClick={() => { m.disconnect(); m.connect(); }}>Play Again</button>
                    </div>
                </div>
            </Centered>
        );
    }

    if (isPlaying) {
        return (
            <>
                <Navbar />
                <MultiplayerArena
                    m={m}
                    onBack={m.disconnect}
                    myUserId={myUserId}
                    opponentLabel={opponentLabel(m.match?.opponent_user_id)}
                />
            </>
        );
    }

    if (isMatchFoundHolding && m.match) {
        return (
            <Centered>
                <div className={`${CARD} w-full p-8 motion-safe:[animation:mpCardIn_0.4s_ease-out]`}>
                    <p className='mb-4 text-sm font-semibold text-[#6fb4ea]'>Match found</p>
                    <div className='mb-6 flex items-center justify-center gap-5'>
                        <span className='text-lg font-semibold'>You</span>
                        <Swords aria-hidden='true' className='h-6 w-6 text-white/50' />
                        <span className='text-lg font-semibold'>{opponentLabel(m.match.opponent_user_id)}</span>
                    </div>
                    <dl className='tabular-nums grid grid-cols-3 gap-3 text-sm'>
                        <div><dt className={MUTED}>Market</dt><dd className='font-semibold' translate='no'>{m.match.symbol}</dd></div>
                        <div><dt className={MUTED}>Length</dt><dd className='font-semibold'>{m.match.total_days} days</dd></div>
                        <div><dt className={MUTED}>Starting cash</dt><dd className='font-semibold'>{money(m.match.initial_balance)}</dd></div>
                    </dl>
                    <p className={`mt-6 text-xs ${MUTED}`}>Starting…</p>
                </div>
            </Centered>
        );
    }

    if (isQueueing) {
        return (
            <Centered>
                <div className='relative mb-8 flex h-24 w-24 items-center justify-center'>
                    <span aria-hidden='true' className='absolute inset-0 rounded-full border border-[rgba(28,117,188,0.5)] motion-safe:[animation:mpRing_2s_ease-out_infinite]' />
                    <span aria-hidden='true' className='absolute inset-0 rounded-full border border-[rgba(28,117,188,0.5)] motion-safe:[animation:mpRing_2s_ease-out_1s_infinite]' />
                    <Users aria-hidden='true' className='h-8 w-8 text-[#6fb4ea]' />
                </div>
                <h1 className='mb-2 text-2xl font-semibold'>Finding an opponent…</h1>
                <p role='status' className={`mb-8 text-sm ${MUTED}`}>You&apos;ll be matched with the next player who queues.</p>
                <button type='button' className={SECONDARY} onClick={m.disconnect}>Cancel</button>
            </Centered>
        );
    }

    if (isLobby) {
        return (
            <Centered>
                <div className='mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(28,117,188,0.15)]'>
                    <Swords aria-hidden='true' className='h-7 w-7 text-[#6fb4ea]' />
                </div>
                <h1 className='mb-3 text-3xl font-semibold tracking-tight'>Head to Head</h1>
                <p className={`mb-8 max-w-sm ${MUTED}`}>Trade the same market as another player, one day at a time. Highest balance at the end wins.</p>
                <button type='button' className={PRIMARY} onClick={m.connect}>
                    <Swords aria-hidden='true' className='h-4 w-4' />
                    Find Match
                </button>
                {m.error && (
                    <p role='alert' className='mt-4 inline-flex items-center gap-1.5 text-sm text-[#ff6b72]'>
                        <AlertCircle aria-hidden='true' className='h-4 w-4' />
                        {m.error}
                    </p>
                )}
            </Centered>
        );
    }

    return (
        <Centered>
            <p aria-busy='true' className={MUTED}>Connecting…</p>
        </Centered>
    );
}
