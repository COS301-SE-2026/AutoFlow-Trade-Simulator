'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type TabId = 'strategies' | 'greeks' | 'events';

interface LearningContextType {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    switchToEvents: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<TabId>('events');

    const switchToEvents = () => {
        setActiveTab('events');
    }

    return (
        <LearningContext.Provider value={{ activeTab, setActiveTab, switchToEvents }}>
            {children}
        </LearningContext.Provider>
    )
}

export function useLearning() {
    const context = useContext(LearningContext);
    if (!context) {
        throw new Error('userLearning must be used inside LearningProvider')
    }
    return context;
}
