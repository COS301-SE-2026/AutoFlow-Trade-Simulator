'use client';

import { StrategySummary } from '@/hooks/useStrategies';

interface StrategyCardProps {
    strategy: StrategySummary,
    onClick: () => void
}

export const strategyLevelColors = {
    beginner: 'text-green-400',
    intermediate: 'text-orange-400',
    advanced: 'text-red-400'
}

export type strategyLevel = keyof typeof strategyLevelColors;

export function StrategyCard({ strategy, onClick }: StrategyCardProps) {

    return (
        <div
            className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--seafoam)] transition-colors'
            onClick={onClick}>
            <div className='flex'>
                <span className='font-bold'>{strategy.name}</span>
                <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm'>
                    <span className={`${strategyLevelColors[strategy.level as strategyLevel]}`}>{strategy.level}</span> -
                    <span>{strategy.category}</span>
                </div>
            </div>
            <span style={{ color: 'var(--muted)' }}>{strategy.description}</span>
        </div>
    );
}