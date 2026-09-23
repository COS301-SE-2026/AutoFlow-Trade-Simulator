'use client';
import { apiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import {PurchaseResponseSchema, TechTree, TechTreeSchema, UnlockCheckSchema} from "@/lib/types/techTree";

export function useTechTree() {
    const [tree, setTechTree] = useState<TechTree | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/tech_tree/tree`);
            setTechTree(TechTreeSchema.parse(response));
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
            const response = await apiClient(`/tech_tree/purchase`, {
                method: "POST",
                body: { tech_name: techName },
            });
            PurchaseResponseSchema.parse(response);
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
            return UnlockCheckSchema.parse(response).unlocked;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { getTree(); }, [getTree]);

    return { tree, loading, error, refetch: getTree, purchaseTech, isUnlocked };
}