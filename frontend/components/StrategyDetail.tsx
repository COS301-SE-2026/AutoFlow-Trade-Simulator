'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { strategyLevelColors, strategyLevel } from '@/components/StrategyCard'
import { Button } from "./ui/button";
import { X } from 'lucide-react';

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);

    return (
        <div
            className='fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6'
            style={{ background: '#1c1b22' }}>
            {strategy === null ? (
                <div>
                    <div>
                        <div className='flex justify-between'>
                            <span className=' font-bold' style={{ color: 'var(--text)' }}>strategy not found</span>
                            <Button onClick={onClose}><X /></Button>
                        </div>
                    </div>
                </div>) : (
                <div>
                    <div>
                        <div className='flex justify-between'>
                            <span className=' text-3xl font-bold' style={{ color: 'var(--text)' }}>{strategy.name}</span>
                            <Button onClick={onClose}><X /></Button>
                        </div>
                        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm'>
                            <span className={`${strategyLevelColors[strategy.level as strategyLevel]}`}>{strategy.level}</span> -
                            <span>{strategy.category}</span>
                        </div>
                        <div>{strategy.description}</div>
                    </div>

                    <div className='mb-3 '>
                        <div className='font-bold'>steps</div>
                        {strategy.steps.map((steps, index) => (
                            <div key={`empty-${index}`}>{index + 1}. {steps}</div>
                        ))}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className='text-green-400'>
                            <div className='font-bold'>pros</div>
                            {strategy.pros.map((pros, index) => (
                                <div key={`empty-${index}`}>{index + 1}. {pros}</div>
                            ))}
                        </div>
                        <div className='text-red-400'>
                            <div className='font-bold'>cons</div>
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