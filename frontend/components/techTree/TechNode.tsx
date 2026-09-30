'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TechNode as TechNodeData } from '@/hooks/useTechTree';
import { useTechFlowCtx } from '@/context/TechFlowContext';

export function TechNodeInner({ data }: NodeProps<TechNodeData>) {
    const { currentXp, purchasing, onPurchase } = useTechFlowCtx();

    const canAfford = currentXp >= data.cost;
    const canBuy = data.available && canAfford && !purchasing;

    const state = data.unlocked ? 'unlocked' : data.available ? 'available' : 'locked';

    const border = {
        unlocked: 'border-[rgba(141,198,63,0.5)] bg-[#141a18]',
        available: 'border-[rgba(28,117,188,0.6)] bg-[#131827] shadow-[0_0_0_3px_rgba(28,117,188,0.12)]',
        locked: 'border-white/10 bg-[#13131c] opacity-70',
    }[state];

    const badge = {
        unlocked: 'bg-[rgba(141,198,63,0.15)] text-[var(--green-light)]',
        available: 'bg-[rgba(28,117,188,0.2)] text-[#8cc4ef]',
        locked: 'bg-white/[0.06] text-white/50',
    }[state];

    return (
        <>
            <Handle type="target" position={Position.Top} className="!border-0 !bg-white/25" />
            <div className={`h-full w-full rounded-xl border ${border} p-3 text-left`}>
                <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-white" title={data.name}>
                        {data.name}
                    </h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${badge}`}>
                        {state}
                    </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{data.description}</p>

                <div className="mt-2 flex items-center justify-between">
                    <span className={`tabular-nums text-[11px] ${state !== 'unlocked' && !canAfford ? 'text-[#ff8a8f]' : 'text-white/50'}`}>
                        Cost: <span className="font-semibold text-white/85">{data.cost}</span> XP
                    </span>

                    {state === 'unlocked' ? (
                        <span className="text-[11px] font-semibold text-[var(--green-light)]">Unlocked</span>
                    ) : (
                        <button
                            type="button"
                            disabled={!canBuy}
                            onClick={(e) => {
                                e.stopPropagation();
                                onPurchase(data.name);
                            }}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${canBuy
                                ? 'bg-[var(--blue)] text-white hover:bg-[#2385d1]'
                                : 'cursor-not-allowed bg-white/[0.06] text-white/40'
                                }`}
                            title={
                                !data.available ? 'Prerequisites not met' : !canAfford ? 'Not enough XP' : undefined
                            }>
                            {purchasing ? '…' : 'Unlock'}
                        </button>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!border-0 !bg-white/25" />
        </>
    );
}

export const TechNode = memo(TechNodeInner);