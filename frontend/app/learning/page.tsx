'use client';

import { Navbar } from '@/components/navbar';
import { StrategyList } from '@/components/StrategyList';

export default function LearningPage() {
    return (
        <>
            <Navbar />
            <div className="h-full p-6">
                <StrategyList />
            </div>
        </>
    );
}