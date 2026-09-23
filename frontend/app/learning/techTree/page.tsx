'use client';

import { Navbar } from '@/components/navbar';
import { LearningNavbar } from '@/components/LearningNavbar';
import { useTechTree } from '@/hooks/useTechTree';
import { PageError } from '@/components/PageError';
import { TechTreeFlow } from '@/components/techTree/TechTreeFlow';


export default function LearningPage() {
    const { tree, loading, error, refetch, purchaseTech } = useTechTree();

    console.log("error " + error);
    console.log("tree" + tree);

    if (loading && !tree) {
        return (<>
            <Navbar />
            <LearningNavbar />
            <div>loading...</div>
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
            <main className="mx-auto max-w-6xl p-6">
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-100">Tech Tree</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Unlock trading strategies with experience points.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <TechTreeFlow
                    tree={tree}
                    purchasing={loading}
                    onPurchase={purchaseTech}
                />
            </main>
        </>
    );
}