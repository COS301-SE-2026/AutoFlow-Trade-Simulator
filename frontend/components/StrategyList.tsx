'use client';
import { useState } from 'react';
import { StrategyCard } from '@/components/StrategyCard';
import { StrategyDetail } from '@/components/StrategyDetail';
import { useStrategies } from '@/hooks/useStrategies';

export function StrategyList() {
    const { strategies, loading, error } = useStrategies();
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedStrategy = selectedId;

    return (
        <div>
            <div>
                {strategies.map((s, index) => (
                    <StrategyCard
                        key={`empty-${index}`}
                        id={s.id}
                        onClick={() => setSelectedId(s.id)}
                    />
                ))}
            </div>
            <div>
                {selectedStrategy && (
                    <StrategyDetail
                        id={selectedStrategy}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </div>
        </div>
    );
}