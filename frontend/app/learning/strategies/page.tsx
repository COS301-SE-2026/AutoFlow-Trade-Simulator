'use client';

import { Navbar } from '@/components/navbar';
import { StrategyList } from '@/components/StrategyList';
import { useLearning } from '@/context/LearningContext';
import { LearningNavbar } from '@/components/LearningNavbar';

export default function LearningPage() {
    const { activeTab, setActiveTab } = useLearning();

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