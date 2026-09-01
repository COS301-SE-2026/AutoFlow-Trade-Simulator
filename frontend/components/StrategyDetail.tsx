'use client';

import { useStrategy } from '@/hooks/useStrategy';
import { strategyLevelColors, strategyLevel } from '@/components/StrategyCard'
import { Button } from "./ui/button";
import { X } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { strategy, loading, error } = useStrategy(id);
    const { switchToEvents } = useLearning();

    // Loading State
    if (loading) {
        return (
            <div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'>
                <div className='card !p-8 max-w-md w-full'>
                    <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-xl font-bold'>Loading...</h3>
                        <button
                            type='button'
                            data-testid="close"
                            onClick={onClose}
                            className='px-4 py-2 rounded-xl font-bold border border-[var(--border)] text-sm hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors duration-200'
                        >
                            <X />
                        </button>
                    </div>
                    <div className='flex items-center justify-center py-8'>
                        <div className='animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--blue)]'></div>
                    </div>
                    <p className='text-sm text-gray-400 text-center'>Loading strategy details...</p>
                </div>
            </div>
        )
    }

    // Error / Not Found State
    if ((strategy === null) || error) {
        return (
            <div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'>
                <div className='card !p-8 max-w-md w-full'>
                    <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-xl font-bold text-red-400'>Strategy Not Found</h3>
                        <button
                            type='button'
                            data-testid="close"
                            onClick={onClose}
                            className='px-4 py-2 rounded-xl font-bold border border-[var(--border)] text-sm hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors duration-200'
                        >
                            <X />
                        </button>
                    </div>
                    <p className='text-sm text-gray-400 mb-6'>
                        {error || 'The strategy you\'re looking for doesn\'t exist or has been removed.'}
                    </p>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full bg-[var(--background)] hover:bg-[var(--border)] text-[var(--text)] font-bold py-3 px-6 rounded-xl border border-[var(--border)] transition-colors'
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    // Success State - Strategy Loaded
    return (
        <div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'>
            <div className='card !p-8 max-w-md w-full'>
                {/* Header */}
                <div className='flex justify-between items-start mb-4'>
                    <h3 className='text-xl font-bold'>{strategy.name}</h3>
                    <button
                        type='button'
                        data-testid="close"
                        onClick={onClose}
                        className='px-4 py-2 rounded-xl font-bold border border-[var(--border)] text-sm hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors duration-200'
                    >
                        <X />
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
                <p className='text-sm text-gray-400 mb-4 leading-relaxed'>
                    {strategy.description}
                </p>

                {/* Divider */}
                <div className='border-b border-[var(--border)] mb-4'></div>

                {/* Steps */}
                <div className='mb-4'>
                    <div className='font-bold text-sm mb-2'>Steps</div>
                    <div className='space-y-1'>
                        {strategy.steps.map((step: string, index: number) => (
                            <div key={step} className='text-sm text-gray-300 leading-relaxed'>
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
                                <div key={pro} className='text-sm text-gray-300 leading-relaxed'>
                                    {index + 1}. {pro}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className='font-bold text-sm mb-2 text-red-400'>Cons</div>
                        <div className='space-y-1'>
                            {strategy.cons.map((con: string, index: number) => (
                                <div key={con} className='text-sm text-gray-300 leading-relaxed'>
                                    {index + 1}. {con}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className='border-b border-[var(--border)] mb-4'></div>

                {/* Try it now button */}
                <Button
                    data-testid="Try it now button"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-xl text-lg transition-colors mb-4"
                    onClick={() => {
                        switchToEvents();
                    }}
                >
                    Try it now!
                </Button>
            </div>
        </div>
    );
}