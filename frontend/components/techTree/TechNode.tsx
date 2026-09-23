'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TechNode as TechNodeData } from '@/hooks/useTechTree';
import { useTechTreeCtx } from '@/context/TechTreeContext';

export function TreeNodeInner({ data }: NodeProps<TechNodeData>) {
    const { currentXp, purchasing, onPurchase } = useTechTreeCtx();

    const canAfford = currentXp >= data.cost;
    const canBuy = data.available && canAfford && !purchasing;

    const state = data.unlocked ? 'unlocked' : data.available ? 'available' : 'locked';

    const border = {
        unlocked: 'border-emerald-500/60 bg-emerald-500/5',
        available: 'border-sky-500/60 bg-sky-500/5',
        locked: 'border-slate-700/60 bg-slate-800/40 opacity-60',
    }[state];

    const badge = {
        unlocked: 'bg-emerald-500/20 text-emerald-300',
        available: 'bg-sky-500/20 text-sky-300',
        locked: 'bg-slate-600/30 text-slate-400',
    }[state];

    return (
        <>
        
        </>
    )
}