'use client';
import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface TechNode {
    name: string;
    description: string;
    cost: number;
    prerequisites: string[];
    unlocks: string[];
    unlocked: boolean;
    available: boolean;
}

export interface TechTree {
    experience_points: number;
    upgrades: string[];
    nodes: TechNode[];
}

export function useTechTree() {
    const [tree, setTechTree] = useState<TechTree | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/tech_tree/tree`);
            setTechTree(response);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const purchaseTech = useCallback(async (techName: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient(`/tech_tree/purchase`, {
                method: "POST",
                body: { tech_name: techName },
            });
            await getTree();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [getTree]);

    const isUnlocked = useCallback(async (techName: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/tech_tree/unlocked/${encodeURIComponent(techName)}`);
            return response.unlocked;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { getTree(); }, [getTree]);

    return { tree, loading, error, refetch: getTree, purchaseTech, isUnlocked };
}