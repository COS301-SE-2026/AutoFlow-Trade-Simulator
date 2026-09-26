'use client';

import { useTechTreeContext } from '@/context/TechTreeContext';

export function XPindicator() {
    const { xp } = useTechTreeContext();

    return (
        <>
            <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2">
                <span className="text-xs uppercase tracking-wider text-slate-500">XP</span>
                <span className="ml-3 text-lg font-semibold text-sky-300">{xp}</span>
            </div>
        </>
    );
}
