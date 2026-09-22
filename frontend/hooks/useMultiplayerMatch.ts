'use client';

import { useCallback, useEffect, useRef, useState } from "react";

// wire types

export type Bar = { open: number; high: number; low: number; close: number; volume: number };

export type QteOffer = {
    question_id: number;
    question_type: "jargon" | "scenario";
    prompt: string;
    options: string[];
    timeout_seconds: number;
};

export type QtePlayerOutcome = {
    answer: string | null;
    correct: boolean;
    cash_delta: number;
};

export type MatchFoundMsg = {
    type: "match_found";
    symbol: string;
    start_date: string;
    end_date: string;
    initial_balance: number;
    opponent_user_id: number;
    total_days: number;
};

export type DayMsg = {
    type: "day";
    day_index: number;
    date: string;
    bar: Bar;
    cash_balance: number;
    position_qty: number;
    qte?: QteOffer;
};

export type ActionAckMsg = {
    type: "action_ack";
    day_index: number;
    cash_balance: number;
    position_qty: number;
    error?: string | null;
};

export type QteResultMsg = {
    type: "qte_result";
    day_index: number;
    question_id: number;
    correct_answer: string;
    per_player: Record<string, QtePlayerOutcome>;
};

export type MatchEndMsg = {
    type: "match_end";
    final_balances: Record<string, number>;
    winner_user_id: number | null;
    reason: "completed" | "opponent_disconnected";
};

export type ErrorMsg = {
    type: "error";
    detail: string;
};

export type ServerMsg = MatchFoundMsg | DayMsg | ActionAckMsg | QteResultMsg | MatchEndMsg | ErrorMsg;

// public state shape

export type MatchStatus = "idle" | "connecting" | "queued" | "playing" | "ended" | "closed";

export type UseMultiplayerMatch = {
    status: MatchStatus;
    match: MatchFoundMsg | null;
    day: DayMsg | null;
    lastQteResult: QteResultMsg | null;
    end: MatchEndMsg | null;
    error: string | null;
    // true if current days action is acked/rejected
    actionSettled: boolean;

    buy: (qty: number) => void;
    sell: (qty: number) => void;
    hold: () => void;
    answerQte: (answer: string) => void;
    actWithQte: (action: "buy" | "sell" | "hold", qty?: number, answer?: string) => void;

    connect: () => void;
    disconnect: () => void;
};

// hook

const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 5000;

export function useMultiplayerMatch(wsBase: string, token: string | null): UseMultiplayerMatch {
    const [status, setStatus] = useState<MatchStatus>("idle");
    const [match, setMatch] = useState<MatchFoundMsg | null>(null);
    const [day, setDay] = useState<DayMsg | null>(null);
    const [lastQteResult, setLastQteResult] = useState<QteResultMsg | null>(null);
    const [end, setEnd] = useState<MatchEndMsg | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionSettled, setActionSettled] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const dayRef = useRef<DayMsg | null>(null);
    const daySettledRef = useRef(false);
    const shouldReconnectRef = useRef(true);
    const reconnectAttemptRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const manualCloseRef = useRef(false);

    useEffect(() => { dayRef.current = day; }, [day]);
    useEffect(() => { daySettledRef.current = actionSettled; }, [actionSettled]);

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const sendRaw = useCallback((payload: unknown): boolean => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        ws.send(JSON.stringify(payload));
        return true;
    }, []);

    const handleMessage = useCallback((msg: ServerMsg) => {
        console.log("[ws] HANDLE", msg.type);
        switch (msg.type) {
            case "match_found": {
                setMatch(msg);
                setDay(null);
                setEnd(null);
                setLastQteResult(null);
                setError(null);
                setActionSettled(false);
                setStatus("playing");
                break;
            }
            case "action_ack": {
                setActionSettled(true);
                if (msg.error) {
                    setError(msg.error);
                }
                setDay((d) => d && d.day_index === msg.day_index ? { ...d, cash_balance: msg.cash_balance, position_qty: msg.position_qty } : d);
                break;
            }
            case "qte_result": {
                setLastQteResult(msg);
                break;
            }
            case "match_end": {
                setEnd(msg);
                setStatus("ended");
                shouldReconnectRef.current = false;
                break;
            }
            case "error": {
                setError(msg.detail);
                break;
            }
        }
    }, []);

    const connectRef = useRef<() => void | undefined>(undefined);

    const scheduleReconnect = useCallback(() => {
        if (!shouldReconnectRef.current) {
            return;
        }
        clearReconnectTimer();
        const attempt = reconnectAttemptRef.current++;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
        reconnectTimerRef.current = setTimeout(() => {
            connectRef.current?.();
        }, delay);
    }, []);

    const connect = useCallback(() => {
        if (!token) {
            return;
        }

        shouldReconnectRef.current = true;
        manualCloseRef.current = false;

        const existing = wsRef.current;
        if (existing) {
            existing.onclose = null;
            existing.onerror = null;
            existing.onmessage = null;
            existing.close();
        }

        setStatus((s) => (s === "idle" ? "connecting" : s));
        setError(null);

        const url = `${wsBase}/multiplayer/ws?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[ws] OPEN");
            reconnectAttemptRef.current = 0;
            setStatus((s) => (s === "playing" ? s : "queued"));
        };

        ws.onmessage = (ev) => {
            console.log("[ws] RAW", ev.data);
            try {
                const parsed = JSON.parse(ev.data) as ServerMsg;
                console.log("[ws] PARSED", parsed.type);
                handleMessage(parsed);
            } catch (err) {
                console.log("[ws] parse failed", err, ev.data);
                setError("malformed frame from server");
            }
        };

        ws.onerror = () => {
            setError("websocket error");
        };

        ws.onclose = (ev) => {
            console.log("[ws] CLOSE", ev.code, ev.reason, "manual: ", manualCloseRef.current);
            if (manualCloseRef.current) {
                setStatus("closed");
                return;
            }
            setStatus("closed");
            scheduleReconnect();
        };
    }, [wsBase, handleMessage, scheduleReconnect, token]);

    useEffect(() => { connectRef.current = connect; }, [connect]);

    const disconnect = useCallback(() => {
        manualCloseRef.current = true;
        shouldReconnectRef.current = false;
        clearReconnectTimer();
        const ws = wsRef.current;
        if (ws) {
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            ws.close();
        }
        wsRef.current = null;
        setStatus("closed");
    }, []);

    // action senders

    const actWithQte = useCallback(
        (action: "buy" | "sell" | "hold", qty?: number, answer?: string) => {
            const d = dayRef.current;
            if (!d) {
                return;
            }
            if (daySettledRef.current) {
                return;
            }

            const payload: Record<string, unknown> = {
                type: "action",
                day_index: d.day_index,
                action,
            }
            if (action !== "hold") {
                if (qty === undefined || qty <= 0) {
                    setError("qty must be positive for buy/sell");
                    return;
                }
                payload.qty = qty;
            }
            if (answer !== undefined) {
                payload.qte_answer = answer;
            }

            if (!sendRaw(payload)) {
                setError("socket not open");
                return;
            }
            setActionSettled(true);
        },
        [sendRaw]
    );

    const buy = useCallback((qty: number) => actWithQte("buy", qty), [actWithQte]);
    const sell = useCallback((qty: number) => actWithQte("sell", qty), [actWithQte]);
    const hold = useCallback(() => actWithQte("hold"), [actWithQte]);

    const answerQte = useCallback((answer: string) => {
        const d = dayRef.current;
        if (!d?.qte) {
            return;
        }
        actWithQte("hold", undefined, answer);
    }, [actWithQte]);

    // auto connect

    useEffect(() => {
        if (!token) {
            return;
        }
        connect();
        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    return {
        status,
        match,
        day,
        lastQteResult,
        end,
        error,
        actionSettled,
        buy,
        sell,
        hold,
        answerQte,
        actWithQte,
        connect,
        disconnect,
    };
}