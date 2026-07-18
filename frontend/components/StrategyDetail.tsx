'use client';

export function StrategyDetail({ id }: { id: number | null }) {

    return (
        <div className='rounded-xl p-6 border border-border/60' style={{ background: 'var(--panel)' }}>
            <div>{id} strategy name</div>
            <div>{id} strategy level</div>
            <div>{id} strategy category</div>
            <div>{id} strategy description</div>

            <div>{id} strategy steps</div>
            <div>{id} strategy pros</div>
            <div>{id} strategy cons</div>
        </div>
    );
}