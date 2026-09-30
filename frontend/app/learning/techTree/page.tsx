'use client';

import { Navbar } from '@/components/navbar';
import { LearningNavbar } from '@/components/LearningNavbar';
import { useTechTree } from '@/hooks/useTechTree';
import { PageError } from '@/components/PageError';
import { TechTreeFlow } from '@/components/techTree/TechTreeFlow';


export default function LearningPage() {
    const { tree, loading, error, refetch, purchaseTech } = useTechTree();

    if (loading && !tree) {
        return (<>
            <Navbar />
            <LearningNavbar />
            <div aria-busy="true" className="p-6 text-sm text-[var(--muted)]">Loading Tech Tree…</div>
        </>);
    }

    if (error && !tree) {
        return (<>
            <PageError message="error in finding Tech Tree" />
        </>);
    }

    if (!tree) {
        return null;
    }

    return (
        <>
            <Navbar />
            <LearningNavbar />
            <main className="mx-auto w-full px-4 py-6 md:px-7">
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-white">Tech Tree</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Unlock trading strategies with experience points.
                        </p>
                    </div>
                </header>

                {error && (
                    <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <TechTreeFlow />
            </main>
        </>
    );
}