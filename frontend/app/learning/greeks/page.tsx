'use client';

import { Navbar } from '@/components/navbar';
import GreeksDisplay from '@/components/GreeksDisplay';
import { LearningNavbar } from '@/components/LearningNavbar';

export default function LearningPage() {
    return (
        <>
            <Navbar />
            <LearningNavbar />
            <div className='flex-1 p-6'>
                <GreeksDisplay />
            </div>
        </>
    );
}