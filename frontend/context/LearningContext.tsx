'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface PuzzleStrategy {
    id: number;
    name: string;
}

interface LearningContextType {
    strategyTutorialOpen: boolean;
    tutorialStrategyId: number | null;
    openStrategyTutorial: (strategyId: number) => void;
    closeStrategyTutorial: () => void;

    puzzleStrategy: PuzzleStrategy | null;
    openStrategyPuzzle: (strategy: PuzzleStrategy) => void;
    closeStrategyPuzzle: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { readonly children: ReactNode }) {
    const [tutorialStrategyId, setTutorialStrategyId] = useState<number | null>(null);
    const strategyTutorialOpen = tutorialStrategyId !== null;
    const [puzzleStrategy, setPuzzleStrategy] = useState<PuzzleStrategy | null>(null);

    const openStrategyTutorial = (strategyId: number) => setTutorialStrategyId(strategyId);
    const closeStrategyTutorial = () => setTutorialStrategyId(null);

    const openStrategyPuzzle = (strategy: PuzzleStrategy) => setPuzzleStrategy(strategy);
    const closeStrategyPuzzle = () => setPuzzleStrategy(null);

    return (
        <LearningContext.Provider value={{
            strategyTutorialOpen,
            tutorialStrategyId,
            openStrategyTutorial,
            closeStrategyTutorial,
            puzzleStrategy,
            openStrategyPuzzle,
            closeStrategyPuzzle,
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
