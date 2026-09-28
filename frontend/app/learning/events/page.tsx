'use client';

import { Navbar } from '@/components/navbar';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';
import { useLearning } from '@/context/LearningContext';
import { LearningNavbar } from '@/components/LearningNavbar';

export default function LearningPage() {
    const { strategy } = useLearning();

    console.log(strategy);

    return (
        <>
            <Navbar />
            <LearningNavbar />
            <div className='flex-1 p-6'>
                <HistoricalEventsTab />
            </div>
        </>
    );
}