'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LearningContextType {
    strategyTutorialOpen: boolean;
    openStrategyTutorial: () => void;
    closeStrategyTutorial: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { readonly children: ReactNode }) {
    const [strategyTutorialOpen, setStrategyTutorialOpen] = useState(false);

    const openStrategyTutorial = () => setStrategyTutorialOpen(true);
    const closeStrategyTutorial = () => setStrategyTutorialOpen(false);

    return (
        <LearningContext.Provider value={{
            strategyTutorialOpen,
            openStrategyTutorial,
            closeStrategyTutorial,
        }}>
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
