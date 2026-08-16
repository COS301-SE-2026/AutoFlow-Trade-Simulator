'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { strategyLevelColors, strategyLevel } from '@/components/StrategyCard'
import { Button } from "./ui/button";
import { X } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);
    const { switchToEvents } = useLearning();

    if (loading) {
        return (
            <div
                className='fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6'
                style={{ background: '#1c1b22' }}>
                <div>
                    <div>
                        <div className='flex justify-between'>
                            <span className=' font-bold' style={{ color: 'var(--text)' }}>loading...</span>
                            <Button onClick={onClose}><X /></Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'
        >
            <div className='card !p-8 max-w-md w-full'>
                {(strategy === null) || error ? (
                    <div>
                        <div className='flex justify-between items-center mb-4'>
                            <h3 className='text-xl font-bold'>Strategy Not Found</h3>
                            <button
                                onClick={onClose}
                                className='px-4 py-2 rounded-xl font-bold border border-[var(--border)]'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Header */}
                        <div className='flex justify-between items-start mb-4'>
                            <h3 className='text-xl font-bold'>{strategy.name}</h3>
                            <button
                                onClick={onClose}
                                className='px-4 py-2 rounded-xl font-bold border border-[var(--border)] text-sm'
                            >
                                ✕
                            </button>
                        </div>

                        {/* Level & Category Badge */}
                        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm mb-4'>
                            <span className={`${strategyLevelColors[strategy.level.toLowerCase() as strategyLevel]}`}>
                                {strategy.level}
                            </span>
                            <span>•</span>
                            <span>{strategy.category}</span>
                        </div>

                        {/* Description */}
                        <p className='text-sm text-gray-400 mb-4'>
                            {strategy.description}
                        </p>

                        {/* Divider */}
                        <div className='border-b border-[var(--border)] mb-4'></div>

                        {/* Steps */}
                        <div className='mb-4'>
                            <div className='font-bold text-sm mb-2'>Steps</div>
                            <div className='space-y-1'>
                                {strategy.steps.map((step: string, index: number) => (
                                    <div key={`step-${index}`} className='text-sm text-gray-300'>
                                        {index + 1}. {step}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-b border-[var(--border)] mb-4'></div>

                        {/* Pros & Cons Grid */}
                        <div className='grid grid-cols-2 gap-4 mb-4'>
                            <div>
                                <div className='font-bold text-sm mb-2 text-green-400'>Pros</div>
                                <div className='space-y-1'>
                                    {strategy.pros.map((pro: string, index: number) => (
                                        <div key={`pro-${index}`} className='text-sm text-gray-300'>
                                            {index + 1}. {pro}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className='font-bold text-sm mb-2 text-red-400'>Cons</div>
                                <div className='space-y-1'>
                                    {strategy.cons.map((con: string, index: number) => (
                                        <div key={`con-${index}`} className='text-sm text-gray-300'>
                                            {index + 1}. {con}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-b border-[var(--border)] mb-4'></div>

                        {/* try it now button */}
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-xl text-lg transition-colors mb-4"
                            onClick={()=>{
                                console.log("try it now button trigger");
                                switchToEvents();
                            }}>
                            Try it now!
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}