'use client';
import { StrategyCard } from '@/components/StrategyCard';

export function StrategyList() {
    const strategies = Array.from({ length: 5 }, (_, i) => i);

    return (
        <div>
            {strategies.map((s) => (
                <StrategyCard id={s} />
            ))}
        </div>
    );
}