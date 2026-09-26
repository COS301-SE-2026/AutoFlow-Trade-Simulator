'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type TabId = 'strategies' | 'greeks' | 'events';

interface LearningContextType {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    switchToEvents: () => void;

    strategyTutorialOpen: boolean;
    openStrategyTutorial: () => void;
    closeStrategyTutorial: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { readonly children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<TabId>('events');
    const [strategyTutorialOpen, setStrategyTutorialOpen] = useState(false);

    const switchToEvents = () => {
        setActiveTab('events');
    };
    const openStrategyTutorial = () => setStrategyTutorialOpen(true);
    const closeStrategyTutorial = () => setStrategyTutorialOpen(false);

    return (
        <LearningContext.Provider value={{ 
            activeTab,
            setActiveTab,
            switchToEvents,
            strategyTutorialOpen,
            openStrategyTutorial,
            closeStrategyTutorial 
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
