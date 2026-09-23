'use client';

import { Navbar } from '@/components/navbar';
import { LearningNavbar } from '@/components/LearningNavbar';
import { useTechTree } from '@/hooks/useTechTree';

export default function LearningPage() {
    const { tree, loading, error, refetch: getTree, purchaseTech, isUnlocked } = useTechTree();
    console.log(tree);

    return (
        <>
            <Navbar />
            <LearningNavbar />
            <div className='flex-1 p-6'>
            </div>
        </>
    );
}