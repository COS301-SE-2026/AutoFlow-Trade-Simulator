'use client';

import { StrategySummary } from '@/hooks/useStrategies';
import { Button } from './ui/button';

interface StrategyCardProps {
    readonly strategy: StrategySummary,
    readonly onClick: () => void
}

export const strategyLevelColors = {
    beginner: 'text-green-400',
    intermediate: 'text-orange-400',
    advanced: 'text-red-400',
    all: ''
}

export type strategyLevel = keyof typeof strategyLevelColors;

export function StrategyCard({ strategy, onClick }: StrategyCardProps) {

    return (
        <Button
            className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--seafoam)] transition-colors my-2 p-12'
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
            }}>
            <div className='flex'>
                <div className='font-bold my-1'>{strategy.name}</div>
                <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm'>
                    <span className={`${strategyLevelColors[strategy.level.toLowerCase() as strategyLevel]}`}>{strategy.level}</span> -
                    <span>{strategy.category}</span>
                </div>
            </div>
            <span style={{ color: 'var(--muted)' }}>{strategy.description}</span>
        </Button>
    );
}