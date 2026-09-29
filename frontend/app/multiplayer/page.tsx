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

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const myUserId = useMemo(() => getUserIdFromToken(token), [token]);
    const m = useMultiplayerMatch(wsBaseFromApiUrl(), token);

    return (<>
        <Navbar />
        <MultiplayerArena m={m} onBack={m.disconnect} />
    </>);
}