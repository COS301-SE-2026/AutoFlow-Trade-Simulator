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
            <div>loading...</div>
        </>);
    }

    if (error && !tree) {
        return (<>
            <PageError message="error in finding techtree" />
        </>);
    }

    if (!tree) {
        return null;
    }

    return (
        <>
            <Navbar />
            <main>
                <header>
                    <div>
                        <h1>Tech Tree</h1>
                        <p>
                            Unlock trading strategies with experience points.
                        </p>
                    </div>
                    <div>
                        <span>XP</span>
                        <span>{tree.experience_points}</span>
                    </div>
                </header>

                {error && (
                    <div>
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