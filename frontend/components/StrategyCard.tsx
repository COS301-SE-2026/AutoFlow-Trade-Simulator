'use client';
import { StrategySummary } from '@/hooks/useStrategies';

interface StrategyCardProps {
    strategy: StrategySummary,
    onClick: () => void
}

export function StrategyCard({ strategy, onClick }: StrategyCardProps) {

    return (
        <div
            className='rounded-xl p-6 border border-border/60'
            style={{ background: 'var(--panel)' }}
            onClick={onClick}>
            <div>{strategy.id}</div>
            <div>{strategy.name}</div>
            <div>{strategy.level}</div>
            <div>{strategy.category}</div>
            <div>{strategy.description}</div>
        </div>
    );
}