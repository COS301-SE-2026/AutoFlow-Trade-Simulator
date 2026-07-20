'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { Button } from "./ui/button";

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);

    return (
        <div
            className='fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 border border-border/60 gap-4'
            style={{ background: '#1c1b22' }}>
            {strategy === null ? (
                <div>
                    console.error();
                </div>
            ) : (
                <div>
                    <div className='mb-3 gap-4'>
                        <div className='flex justify-between'>
                            <div className=' text-3xl font-bold' style={{ color: 'var(--text)' }}>{strategy.name}</div>
                            <Button onClick={onClose}>X</Button>
                        </div>
                        <div className='flex justify-between'>
                            <div>{strategy.level}</div>
                            <div>{strategy.category}</div>
                        </div>
                        <div>{strategy.description}</div>
                    </div>

                    <div className='mb-3 '>
                        {strategy.steps.map((steps, index) => (
                            <div key={`empty-${index}`}>{index + 1}. {steps}</div>
                        ))}
                    </div>

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