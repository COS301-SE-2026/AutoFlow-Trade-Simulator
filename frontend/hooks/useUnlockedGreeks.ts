'use client';
import { useTechTreeContext } from '@/context/TechTreeContext';

const GREEK_TECH_NAMES: Record<string, string> = {
    delta: 'greeks_delta',
    gamma: 'greeks_gamma',
    theta: 'greeks_theta',
    vega: 'greeks_vega',
    rho: 'greeks_rho',
};

export type GreekKey = keyof typeof GREEK_TECH_NAMES;

export function useUnlockedGreeks() {
    const { tree } = useTechTreeContext();
    const upgrades = new Set<string>(tree?.upgrades ?? []);

    const unlocked: Record<GreekKey, boolean> = {
        delta: upgrades.has(GREEK_TECH_NAMES.delta),
        gamma: upgrades.has(GREEK_TECH_NAMES.gamma),
        theta: upgrades.has(GREEK_TECH_NAMES.theta),
        vega: upgrades.has(GREEK_TECH_NAMES.vega),
        rho: upgrades.has(GREEK_TECH_NAMES.rho),
    };

    return { unlocked };
}