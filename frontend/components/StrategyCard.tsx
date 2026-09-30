'use client';

import { StrategySummary } from '@/hooks/useStrategies';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

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
    const locked = !strategy.unlocked;

    return (
        <Button
            className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl hover:border-[var(--seafoam)] transition-colors my-2 p-12'
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                opacity: locked ? 0.55 : 1,
            }}>
            <div className='flex' style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className='font-bold my-1'>{strategy.name}</div>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm'>
                        <span className={`${strategyLevelColors[strategy.level.toLowerCase() as strategyLevel]}`}>{strategy.level}</span> -
                        <span>{strategy.category}</span>
                    </div>
                </div>
                {locked && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600 }}>
                        <Lock className='w-3.5 h-3.5' />
                        Locked
                    </div>
                )}
            </div>
            <span style={{ color: 'var(--muted)' }}>{strategy.description}</span>
        </Button>
    );
}