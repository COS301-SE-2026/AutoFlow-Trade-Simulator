'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStrategies, type StrategyDetail as StrategyDetailData } from '@/hooks/useStrategies';
import { useLearning } from '@/context/LearningContext';
import { strategyLevelColors, strategyLevel } from '@/components/StrategyCard'
import { X, Lock, Brain, ThumbsUp, ThumbsDown, Play } from 'lucide-react';
import Link from 'next/link';
import { getPuzzleGuide } from '@/lib/puzzleGuides';

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {
    const { fetchDetail } = useStrategies();
    const { openStrategyTutorial, openStrategyPuzzle } = useLearning();

    const [strategy, setStrategy] = useState<StrategyDetailData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const puzzleGuide = useMemo(() => (strategy ? getPuzzleGuide(strategy.name) : null),
        [strategy],
    );

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setStrategy(null);
        fetchDetail(id)
            .then(setStrategy)
            .catch((e: any) => setError(e?.message ?? 'Failed to load strategy'))
            .finally(() => setLoading(false));
    }, [id, fetchDetail]);

    return (
        <Shell onClose={onClose} title={loading ? 'Loading...' : (strategy === null || error) ? 'Strategy Not Found' : strategy.name} tone={!loading && (strategy === null || error) ? 'error' : 'default'}>
            {loading ? (
                <>
                    <div className='flex items-center justify-center py-8'>
                        <div className='motion-safe:animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--blue)]'></div>
                    </div>
                    <p className='text-sm text-[var(--muted)] text-center'>Loading strategy details...</p>
                </>
            ) : (strategy === null || error) ? (
                <>
                    <p className='text-sm text-[var(--muted)] mb-6'>
                        {error || 'The strategy you\'re looking for doesn\'t exist or has been removed.'}
                    </p>
                    <button
                        type='button'
                        onClick={onClose}
                        className='h-11 w-full rounded-xl border border-white/10 font-semibold text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white'
                    >
                        Close
                    </button>
                </>
            ) : (
                <>
                    <div className='mb-5 inline-flex items-center gap-2 text-xs'>
                        <span className={`rounded-full bg-white/[0.05] px-2.5 py-1 font-medium ${strategyLevelColors[strategy.level.toLowerCase() as strategyLevel] ?? ''}`}>
                            {strategy.level}
                        </span>
                        <span className='text-white/50'>{strategy.category}</span>
                    </div>

                    <p className='mb-6 max-w-[60ch] text-[15px] leading-relaxed text-white/70'>
                        {strategy.description}
                    </p>

                    <section className='mb-6'>
                        <h4 className='mb-3 text-sm font-semibold'>Steps</h4>
                        <ol className='flex flex-col gap-2'>
                            {strategy.steps.map((step: string, index: number) => (
                                <li key={step} className='rounded-xl border border-[var(--border)] bg-white/[0.02] px-4 py-2.5 text-sm leading-relaxed text-white/80'>
                                    {index + 1}. {step}
                                </li>
                            ))}
                        </ol>
                    </section>

                    <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <section className='rounded-xl border border-[rgba(0,148,68,0.3)] bg-[rgba(0,148,68,0.06)] p-4'>
                            <h4 className='mb-2.5 flex items-center gap-2 text-sm font-semibold text-[var(--green-light)]'>
                                <ThumbsUp aria-hidden='true' className='h-4 w-4' />
                                Pros
                            </h4>
                            <ul className='flex flex-col gap-1.5'>
                                {strategy.pros.map((pro: string, index: number) => (
                                    <li key={pro} className='text-sm leading-relaxed text-white/75'>
                                        {index + 1}. {pro}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section className='rounded-xl border border-[rgba(237,28,36,0.3)] bg-[rgba(237,28,36,0.06)] p-4'>
                            <h4 className='mb-2.5 flex items-center gap-2 text-sm font-semibold text-[#ff6b72]'>
                                <ThumbsDown aria-hidden='true' className='h-4 w-4' />
                                Cons
                            </h4>
                            <ul className='flex flex-col gap-1.5'>
                                {strategy.cons.map((con: string, index: number) => (
                                    <li key={con} className='text-sm leading-relaxed text-white/75'>
                                        {index + 1}. {con}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {strategy.unlocked ? (
                        <>
                            <button
                                type='button'
                                data-testid="Try it now button"
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--green)] text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-[#00a84e] active:scale-[0.98]"
                                onClick={() => openStrategyTutorial(strategy.id)}
                            >
                                <Play aria-hidden='true' className='h-4 w-4' />
                                Try it now!
                            </button>
                            {puzzleGuide && (
                                <button
                                    type='button'
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(105,80,161,0.5)] bg-[rgba(105,80,161,0.25)] text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-[rgba(105,80,161,0.4)] active:scale-[0.98]"
                                    onClick={() =>
                                        openStrategyPuzzle({ id: strategy.id, name: strategy.name })
                                    }
                                >
                                    <Brain aria-hidden='true' className='h-4 w-4' />
                                    Try the Puzzle
                                </button>
                            )}
                        </>
                    ) : (
                        <div className='w-full rounded-xl border border-[var(--border)] bg-white/[0.02] px-6 py-5 text-center'>
                            <p className='inline-flex items-center justify-center gap-2 text-sm font-semibold'>
                                <Lock aria-hidden='true' className='w-4 h-4' />
                                Locked
                            </p>
                            <p className='mt-1 text-sm text-[var(--muted)]'>
                                Unlock this strategy in the Tech Tree to try it out.
                            </p>
                            <Link
                                href='/learning/techTree'
                                className='mt-3 inline-block text-sm font-semibold text-[#6fb4ea] hover:underline'
                            >
                                Go to Tech Tree →
                            </Link>
                        </div>
                    )}
                </>
            )}
        </Shell>
    );
}

function Shell({ title, tone, onClose, children }: { title: string; tone: 'default' | 'error'; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        globalThis.addEventListener('keydown', onKey);
        return () => globalThis.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-[rgba(4,4,10,0.72)] p-4 backdrop-blur-sm md:p-6'>
            <button
                type='button'
                aria-label='Close dialog'
                tabIndex={-1}
                onClick={onClose}
                className='absolute inset-0 h-full w-full cursor-default'
            />
            <div
                role='dialog'
                aria-modal='true'
                aria-labelledby='strategy-detail-title'
                className='relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12121c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]'
            >
                <div className='flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5'>
                    <h3 id='strategy-detail-title' className={`text-xl font-semibold ${tone === 'error' ? 'text-[#ff6b72]' : ''}`}>{title}</h3>
                    <button
                        type='button'
                        data-testid="close"
                        aria-label='Close'
                        onClick={onClose}
                        className='-mr-2 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white'
                    >
                        <X aria-hidden='true' className='h-5 w-5' />
                    </button>
                </div>
                <div className='overflow-y-auto overscroll-contain px-6 py-5'>
                    {children}
                </div>
            </div>
        </div>
    );
}