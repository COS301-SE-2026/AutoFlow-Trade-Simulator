'use client';

import { useStrategy } from '@/hooks/useStrategy'
import { STRATEGY_TUTORIALS } from '@/lib/strategyTutorials';

export function StrategyTutorial({ id, onClose }: { id: number, onClose: () => void }) {
    const { strategy, loading } = useStrategy(id);
    const tutorial = STRATEGY_TUTORIALS.dca;

    if (loading || !tutorial) return null;
    const step = tutorial.steps[0];

    return (
        <div className='flex items-center justify-center'>
            <p>Scenario:</p>
            <p>{tutorial.scenario}</p>
            <h2>{step.title}</h2>
            <p>{step.instruction}</p>
            <button onClick={onClose}>
                Close
            </button>
        </div>
    )
}