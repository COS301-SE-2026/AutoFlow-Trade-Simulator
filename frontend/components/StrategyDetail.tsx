'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { Button } from "./ui/button";

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);

    return (
        <div
            className='rounded-xl p-6 border border-border/60'
            style={{ background: 'var(--panel)' }}>
            <Button onClick={onClose}>X</Button>
            {strategy === null ? (
                <div>
                    console.error();
                </div>
            ) : (
                <div>
                    <div>{strategy.id}</div>
                    <div>{strategy.name}</div>
                    <div>{strategy.level}</div>
                    <div>{strategy.category}</div>
                    <div>{strategy.description}</div>

                    {strategy.steps.map((steps, index) => (
                        <div key={`empty-${index}`}>{steps}</div>
                    ))}
                    {strategy.pros.map((pros, index) => (
                        <div key={`empty-${index}`}>{pros}</div>
                    ))}
                    {strategy.cons.map((cons, index) => (
                        <div key={`empty-${index}`}>{cons}</div>
                    ))}
                </div>
            )}
        </div>
    );
}