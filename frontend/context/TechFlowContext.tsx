'use client';
import { createContext, useContext } from 'react';

interface TechFlowCtx {
    currentXp: number;
    purchasing: boolean;
    onPurchase: (name: string) => void;
}

export const TechFlowContext = createContext<TechFlowCtx | null>(null);

export const useTechFlowCtx = () => {
    const ctx = useContext(TechFlowContext);
    if (!ctx) {
        throw new Error('TechFlowContext missing');
    }
    return ctx;
}