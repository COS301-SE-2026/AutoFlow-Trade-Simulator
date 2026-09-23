'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TechNode as TechNodeData } from '@/hooks/useTechTree';
import { useTechTreeCtx } from '@/context/TechTreeContext';

export function TechNodeInner({ data }: NodeProps<TechNodeData>) {
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
            <Handle type="target" position={Position.Top} className="!bg-slate-600" />
            <div className={`h-full w-full rounded-xl border ${border} p-3 text-left`}>
                <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-100">
                        {data.name}
                    </h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge}`}>
                        {state}
                    </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{data.description}</p>

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                        Cost: <span className="text-slate-300">{data.cost}</span>
                    </span>

                    {state === 'unlocked' ? (
                        <span className="-[11px] font-medium text-emerald-400"> Unlocked</span>
                    ) : (
                        <button
                            type="button"
                            disabled={!canBuy}
                            onClick={(e) => {
                                e.stopPropagation();
                                onPurchase(data.name);
                            }}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${canBuy
                                ? 'bg-sky-500 text-white hover:bg-sky-400'
                                : 'cursor-not-allowed bg-slate-700 text-slate-500'
                                }`}
                            title={
                                !data.available ? 'Prerequisites not met' : !canAfford ? 'Not enough XP' : undefined
                            }>
                            {purchasing ? '...' : 'Unlock'}
                        </button>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-slate-600" />
        </>
    );
}

export const TechNode = memo(TechNodeInner);