'use client';

import { Navbar } from '@/components/navbar';
import { StrategyList } from '@/components/StrategyList';
import { LearningNavbar } from '@/components/LearningNavbar';

import { useLearning } from '@/context/LearningContext';
import { EventSimulator } from '@/components/EventSimulator';
import { StrategyPuzzle } from '@/components/StrategyPuzzle';
import { useTechTreeContext } from '@/context/TechTreeContext';
import { completeTutorial } from '@/lib/api/tutorials';

const DCA_PRACTICE_EVENT = {
    id: 'dca-practice',
    title: 'Dollar Cost Averaging Practice',
    ticker: 'SNH',
    company: 'Steinhoff International Holdings N.V.',
    sector: 'Retail',
    period: 'Practice',
    narrative: `Practice accumulating a long term SNH position.`,
    context: `Set a monthly amount, pick some frequency, and let the plan run.`,
    timeframe: '1y',
    startYear: 2017,
    startMonth: 1,
    startDay: 1,
    tradingDays: 252,
    initialBalance: 200000
}

export default function LearningPage() {
    const { 
            strategyTutorialOpen, 
            tutorialStrategyId,
            closeStrategyTutorial,
            puzzleStrategy,
            closeStrategyPuzzle 
        } = useLearning();
    const { refetch: refetchXp } = useTechTreeContext();

    const handleTutorialComplete = async () => {
        if (tutorialStrategyId === null) return;
        try {
            await completeTutorial(tutorialStrategyId);
            await refetchXp();
        } catch (e) {
            console.error('Failed to record tutorial completion', e);
        }
    };

    if (puzzleStrategy) {
        return (
            <StrategyPuzzle
                strategyId={puzzleStrategy.id}
                strategyName={puzzleStrategy.name}
                onBack={closeStrategyPuzzle}
            ></StrategyPuzzle>
        )
    }

    if (strategyTutorialOpen) {
        return (
            <>
                <EventSimulator
                    event={DCA_PRACTICE_EVENT}
                    mode='strategy'
                    onBack={closeStrategyTutorial}
                    onTutorialComplete={handleTutorialComplete}
                />
            </>
        )
    }

    return (
        <>
            <Navbar />
            <LearningNavbar />
            <div className='flex-1 px-4 py-6 md:px-7'>
                <StrategyList />
            </div>
        </>
    );
}