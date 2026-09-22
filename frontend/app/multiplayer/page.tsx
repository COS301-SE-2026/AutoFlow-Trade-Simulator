'use client';

import { Navbar } from '@/components/navbar';
import { PageError } from '@/components/PageError';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMultiplayerMatch, UseMultiplayerMatch } from "@/hooks/useMultiplayerMatch";

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const m = useMultiplayerMatch('ws://localhost:8000', token);

    if (m.status === "queued" || m.status === "connecting") {
        return (
            <div>Searching for an opponent...</div>
        );
    }

    if (m.status === "playing" && m.match && m.day) {
        return (
            <div>
                <h2>
                    {m.match.symbol} - day {m.day.day_index + 1}/{m.match.total_days}
                </h2>
                <p>close: {m.day.bar.close}</p>
                <p>cash: {m.day.cash_balance.toFixed(2)}</p>
                <p>position: {m.day.position_qty}</p>

                <button disabled={m.actionSettled} onClick={() => m.buy(1)}>buy</button>
                <button disabled={m.actionSettled} onClick={() => m.sell(1)}>sell</button>
                <button disabled={m.actionSettled} onClick={m.hold}>hold</button>

                {m.error && <p>{m.error}</p>}
            </div>
        );
    }

    if (m.status === "ended" && m.end) {
        return (
            <div>
                <h2>
                    {m.end.winner_user_id === null ? "draw" : m.end.winner_user_id + " is the winner"}
                </h2>
                <p>reason: {m.end.reason}</p>
                <pre>{JSON.stringify(m.end.final_balances, null, 2)}</pre>
            </div>
        )
    }

    return (
        <div>
            Connecting...
        </div>
    );
}