'use client';

import { useState, useMemo } from 'react';
import { StrategyCard, strategyLevelColors, strategyLevel } from '@/components/StrategyCard';
import { StrategyDetail } from '@/components/StrategyDetail';
import { useStrategies } from '@/hooks/useStrategies';
import { Button } from './ui/button';

const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
type levelFilter = typeof levelOptions[number];

export function StrategyList() {
    const { strategies, loading, error } = useStrategies();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [levelFilter, setLevelFilter] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">('All');

    const selectedStrategy = selectedId;

    const filteredStrategies = useMemo(() => {
        let temp = strategies;
        if (temp === null) {
            temp = [];
        }

        if (levelFilter !== "All") {
            temp = temp.filter(t => t.level.toLocaleLowerCase().includes(levelFilter.toLocaleLowerCase()));
        }

        return temp;
    }, [strategies, levelFilter]);

    return (
        <div>
            <div className='mb-5'>
                {levelOptions.map((level) => (
                    <Button
                        key={level}
                        onClick={() => setLevelFilter(level)}
                        className={`${strategyLevelColors[level as strategyLevel]} inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] text-sm`}
                    >{level}</Button>
                ))}
            </div>

            <div className='flex flex-col gap-3'>
                {filteredStrategies.map((s, index) => (
                    <StrategyCard
                        key={`empty-${index}`}
                        strategy={s}
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