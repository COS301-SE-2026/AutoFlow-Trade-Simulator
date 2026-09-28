'use client';

import { Navbar } from '@/components/navbar';
import { StrategyList } from '@/components/StrategyList';
import { LearningNavbar } from '@/components/LearningNavbar';

import { useLearning } from '@/context/LearningContext';
import { EventSimulator } from '@/components/EventSimulator';

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
    const { strategyTutorialOpen, closeStrategyTutorial } = useLearning();

    if (strategyTutorialOpen) {
        return (
            <>
                <EventSimulator
                    event={DCA_PRACTICE_EVENT}
                    mode='strategy'
                    onBack={closeStrategyTutorial}
                />
            </>
        )
    }

    return (
        <>
            <Navbar />
            <LearningNavbar />
            <div className='flex-1 p-6'>
                <StrategyList />
            </div>
        </>
    );
}