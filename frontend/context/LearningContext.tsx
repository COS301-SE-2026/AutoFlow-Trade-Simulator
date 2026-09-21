'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { StrategyDetail } from '@/hooks/useStrategy';

interface LearningContextType {
    strategy: StrategyDetail | null;
    setStrategyId: (strategy: StrategyDetail) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { readonly children: ReactNode }) {
    const [strategy, setStrategyId] = useState<StrategyDetail | null>(null);

    return (
        <LearningContext.Provider value={{ strategy, setStrategyId }}>
            {children}
        </LearningContext.Provider>
    )
}

export function useLearning() {
    const context = useContext(LearningContext);
    if (!context) {
        throw new Error('useLearning must be used inside LearningProvider')
    }
    return context;
}
