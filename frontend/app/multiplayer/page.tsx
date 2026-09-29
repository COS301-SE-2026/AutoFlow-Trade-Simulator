'use client';

import { Navbar } from '@/components/navbar';
import { useEffect, useMemo, useState } from 'react';
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

const CARD = 'rounded-2xl border border-white/10 bg-[rgba(20,20,32,0.6)]';
const MUTED = 'text-[var(--muted)]';
const BTN = 'rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50';

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const myUserId = useMemo(() => getUserIdFromToken(token), [token]);
    const m = useMultiplayerMatch(wsBaseFromApiUrl(), token);

    const isLobby = m.status === 'idle' || m.status === 'closed';
    const isQueueing = m.status === 'connecting' || m.status === 'queued';
    const isMatchFoundHolding = m.status === 'playing' && !!m.match && !m.day;
    const isPlaying = m.status === 'playing' && !!m.match && !!m.day;
    const isResults = m.status === 'ended' && !!m.end;

    if (isLoading) {
        return (<div>
            Loading...
        </div>);
    }
    if (!token) {
        return (<div>
            Log in to play multiplayer.
        </div>);
    }

    if (isLobby) {
        return (
            <>
                <Navbar />
                <div className='mx-auto max-w-md p-8 text-center'>
                    <h1 className='text-3xl font-extrabold mb-3'>Head to head</h1>
                    <p className='MUTED mb-6'>Trade the same market as another player. Highest balance at the end wins</p>
                    <button className={`${BTN} bg-[var(--accent)]`} onClick={m.connect}>Find match</button>
                    {m.error && <p className='mt-4 text-sm' style={{ color: 'var(--red)' }}>{m.error}</p>}
                </div>
            </>
        );
    }

    if (isQueueing) {
        return (
            <>
                <Navbar />
                <div className='mx-auto max-w-md p-8 text-center'>
                    <p className='MUTED mb-6'>Waiting for an opponent to queue</p>
                    <button className={`${BTN} bg-[var(--accent)]`} onClick={m.disconnect}>Cancel</button>
                </div>
            </>
        );
    }

    if (isMatchFoundHolding && m.match) {
        return (
            <>
                <Navbar />
                <div className='mx-auto max-w-md p-8 text-center'>
                    <div className={`${CARD} p-6`}>
                        <div className='font-bold text-lg mb-1'>You vs {opponentLabel(m.match.opponent_user_id)}</div>
                        <div className={MUTED}>{m.match.symbol} - {m.match.total_days} days - starting {m.match.initial_balance.toLocaleString()}</div>
                    </div>
                </div>
            </>
        );
    }

    if (isPlaying) {
        return (
            <>
                <Navbar />
                <MultiplayerArena m={m} onBack={m.disconnect} />
            </>
        );
    }

    if (isResults && m.end) {
        const winner = m.end.winner_user_id;
        const title = winner === null ? "DRAW" : winner === myUserId ? 'YOU WON!' : 'YOU LOSE!';
        return (
            <>
                <Navbar />
                <div className="mx-auto max-w-md p-8 text-center">
                    <h2 className="text-3xl font-extrabold mb-2">{title}</h2>
                    {m.end.reason === 'opponent_disconnected' && <p>Opponent disconnected.</p>}
                    <div className={`${CARD} p-4 mb-6 text-sm space-y-1`}>
                        {Object.entries(m.end.final_balances).map(([id, bal]) => (
                            <>
                                <div>
                                    <span>{Number(id) === myUserId ? 'You' : opponentLabel(Number(id))}</span>
                                    <span>${bal.toFixed()}</span>
                                </div>
                            </>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button className={`${BTN} border border-white/10`} onClick={m.disconnect}>Back to Lobby</button>
                        <button className={`${BTN} border border-white/10`} onClick={() => { m.disconnect(); m.connect(); }}>Play again</button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className='p-8'>Connecting...</div>
        </>
    )
}