'use client';

import { Sparkles } from 'lucide-react';
import { useTechTreeContext } from '@/context/TechTreeContext';

export function XPindicator() {
    const { xp } = useTechTreeContext();

    return (
        <>
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-white/[0.03] px-3.5 py-2" aria-label={`${xp} experience points`}>
                <Sparkles aria-hidden="true" className="h-4 w-4 text-[#6fb4ea]" />
                <span className="tabular text-lg font-semibold leading-none text-white">{xp}</span>
                <span className="text-xs font-medium text-white/50">XP</span>
            </div>
        </>
    );
}
