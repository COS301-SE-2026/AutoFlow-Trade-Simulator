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
            onClick={onClick}>
            {strategy.name}
            <div>
                {strategy.level}
                {strategy.category}
            </div>
            {strategy.description}
        </div>
    );
}