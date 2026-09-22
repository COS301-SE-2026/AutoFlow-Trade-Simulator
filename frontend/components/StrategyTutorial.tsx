'use client';

import { useStrategy } from '@/hooks/useStrategy'
import { STRATEGY_TUTORIALS } from '@/lib/strategyTutorials';
import { useState, useEffect } from 'react';

export function StrategyTutorial({ id, onClose }: { id: number, onClose: () => void }) {
    const { strategy, loading } = useStrategy(id);
    const tutorial = STRATEGY_TUTORIALS.dca;

    if (loading || !tutorial) return null;

    const [stepIndex, setStepIndex] = useState(0);
    const step = tutorial.steps[stepIndex];
    const isLast = stepIndex === tutorial.steps.length - 1;

    useEffect(() => {
        const el = document.getElementById(step.elementId);
        if (!el) return;

        el.classList.add('tutorial-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        return () => el.classList.remove('tutorial-highlight');
    }, [step.elementId]);

    return (
        <div className='flex items-center justify-center bg-[var(--ui-background)]'>
            <div className='card max-w-lg p-8'>
                <p className='text-xs mb-1'>Scenario:</p>
                <p className='text-xs mb-4'>{tutorial.scenario}</p>
                <h2>{step.title}</h2>
                <div className='flex justify-between mt-6'>
                    <button disabled={stepIndex === 0} onClick={() => setStepIndex(i => i - 1)}>Back</button>
                    <span>{stepIndex + 1} / {tutorial.steps.length}</span>
                    {isLast
                        ? <button onClick={() => {}}>Try it now</button>
                        : <button onClick={() => setStepIndex(i => i + 1)}>Next</button>}
                </div>
                <p>{step.instruction}</p>
                <button onClick={onClose}>
                    Close
                </button>
            </div>
            <div className='bg-green-950 p-4' id={"summary"}>
                SUMMARY BLOCK
            </div>
        </div>
    )
}