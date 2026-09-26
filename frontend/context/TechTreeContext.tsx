'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useTechTree } from '@/hooks/useTechTree';
import { TechTreeResponseDTO } from '@/lib/types/techTree';

interface TechTreeCtx {
    tree: TechTreeResponseDTO | null;
    xp: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    purchaseTech: (name: string) => Promise<void>;
}

export const TechTreeContext = createContext<TechTreeCtx | null>(null);

export function TechTreeProvider({ children }: { children: ReactNode }) {
    const { tree, loading, error, refetch, purchaseTech } = useTechTree();

    return (
        <TechTreeContext.Provider
            value={{
                tree,
                xp: tree?.experience_points ?? 0,
                loading,
                error,
                refetch,
                purchaseTech,
            }}
        >
            {children}
        </TechTreeContext.Provider>
    )
}

export function useTechTreeContext() {
    const ctx = useContext(TechTreeContext);
    if (!ctx) {
        throw new Error('useTechTree must be inside TechTreeProvider');
    }
    return ctx;
}