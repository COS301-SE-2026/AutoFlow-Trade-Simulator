'use client';

import { Navbar } from '@/components/navbar';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';
import { LearningNavbar } from '@/components/LearningNavbar';

export default function LearningPage() {
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