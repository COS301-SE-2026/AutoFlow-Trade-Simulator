'use client';

import { useState, useMemo } from 'react';
import { StrategyCard } from '@/components/StrategyCard';
import { StrategyDetail } from '@/components/StrategyDetail';
import { useStrategies } from '@/hooks/useStrategies';

const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
type levelFilter = typeof levelOptions[number];

const levelDot: Record<Exclude<levelFilter, 'All'>, string> = {
    Beginner: 'bg-green-400',
    Intermediate: 'bg-orange-400',
    Advanced: 'bg-red-400',
};

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
            <div role="group" aria-label="Filter by level" className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {levelOptions.map((level) => {
                    const active = levelFilter === level;
                    return (
                        <button
                            key={level}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setLevelFilter(level)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                active ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/55 hover:text-white'
                            }`}
                        >
                            {level !== 'All' && (
                                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${levelDot[level]}`} />
                            )}
                            {level}
                        </button>
                    );
                })}
            </div>

            {loading && filteredStrategies.length === 0 ? (
                <ul aria-busy="true" aria-label="Loading strategies…" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i} className="h-[132px] animate-pulse rounded-2xl border border-[var(--border)] bg-white/[0.03]" />
                    ))}
                </ul>
            ) : filteredStrategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
                    <p className="font-medium text-white/80">no strategies found</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {error ? String(error) : levelFilter !== 'All' ? `Nothing at ${levelFilter} level yet. Try another filter.` : 'Strategies will appear here once they are available.'}
                    </p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredStrategies.map((s, index) => (
                        <li key={`empty-${index}`} className="flex">
                            <StrategyCard
                                strategy={s}
                                onClick={() => setSelectedId(s.id)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {selectedStrategy && (
                <StrategyDetail
                    id={selectedStrategy}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}
