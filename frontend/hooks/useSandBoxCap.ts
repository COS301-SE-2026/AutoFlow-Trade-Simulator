"use client";
import { useTechTree } from "@/hooks/useTechTree";

export function useSandboxCap() {
    const { tree, loading, error } = useTechTree();

    if (!tree) return { zarCap: 100_000, loading, error };

    const unlocked = new Set(tree.upgrades);
    let zarCap = 100_000;
    if (unlocked.has("sandbox_balance_500k")) zarCap = 500_000;
    else if (unlocked.has("sandbox_balance_200k")) zarCap = 200_000;

    return { zarCap, loading, error };
}