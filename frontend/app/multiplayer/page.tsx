'use client';

import { Navbar } from '@/components/navbar';
import { PageError } from '@/components/PageError';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMultiplayerMatch, UseMultiplayerMatch } from "@/hooks/useMultiplayerMatch";

export default function Multiplayer() {
    const { token, isLoading } = useAuth();
    const m = useMultiplayerMatch('ws://localhost:8000', token);

    return (
        <>
            <Navbar />
            this is the Multiplayer screen
        </>
    );
}