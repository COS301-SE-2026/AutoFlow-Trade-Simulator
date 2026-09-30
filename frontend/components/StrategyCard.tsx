'use client';

import { StrategySummary } from '@/hooks/useStrategies';
import { Lock, ArrowUpRight } from 'lucide-react';

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
    const levelColor = strategyLevelColors[strategy.level.toLowerCase() as strategyLevel] ?? '';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={locked ? `${strategy.name} (locked)` : strategy.name}
            className={`group flex w-full flex-col items-start gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5 text-left transition-[border-color,background-color,transform] hover:border-[rgba(28,117,188,0.5)] hover:bg-[rgba(20,20,32,0.85)] active:scale-[0.99] ${
                locked ? 'opacity-60' : ''
            }`}
        >
            <div className="flex w-full items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{strategy.name}</h3>
                {locked ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                        <Lock aria-hidden="true" className="h-3 w-3" />
                        Locked
                    </span>
                ) : (
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-white/30 transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#6fb4ea]" />
                )}
            </div>
            <div className="inline-flex items-center gap-2 text-xs">
                <span className={`rounded-full bg-white/[0.05] px-2.5 py-1 font-medium ${levelColor}`}>{strategy.level}</span>
                <span className="text-white/50">{strategy.category}</span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{strategy.description}</p>
        </button>
    );
}
