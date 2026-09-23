'use client';
import { createContext, useContext } from 'react';

interface Ctx {
    currentXp: number;
    purchasing: number;
    onPurchase: (name: string) => void;
}

export const TechTreeContext = createContext<Ctx | null>(null);
export const useTechTreeCtx = () => {
    const ctx = useContext(TechTreeContext);
    if (!ctx) {
        throw new Error('TechTreeContext missing');
    }
    return ctx;
}