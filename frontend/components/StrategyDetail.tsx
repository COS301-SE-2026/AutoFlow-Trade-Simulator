'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { Button } from "./ui/button";

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);

    return (
        <div
            className='rounded-xl p-6 border border-border/60'>
            <Button onClick={onClose}>X</Button>
            {strategy === null ? (
                <div>
                    console.error();
                </div>
            ) : (
                <div>
                    {strategy.name}
                    {strategy.level}
                    {strategy.category}
                    {strategy.description}

                    {strategy.steps.map((steps, index) => (
                        <div key={`empty-${index}`}>{index + 1}. {steps}</div>
                    ))}

                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            pros
                            {strategy.pros.map((pros, index) => (
                                <div key={`empty-${index}`}>{index + 1}. {pros}</div>
                            ))}
                        </div>
                        <div>
                            cons
                            {strategy.cons.map((cons, index) => (
                                <div key={`empty-${index}`}>{index + 1}. {cons}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}