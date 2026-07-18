'use client';
import { useState } from 'react';
import { StrategyCard } from '@/components/StrategyCard';
import { StrategyDetail } from '@/components/StrategyDetail';

export function StrategyList() {
    const strategies = Array.from({ length: 5 }, (_, i) => i);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedStrategy = selectedId;

    return (
        <div>
            <div>
                {strategies.map((s, index) => (
                    <StrategyCard
                        key={`empty-${index}`}
                        id={s}
                        onClick={() => setSelectedId(s)}
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