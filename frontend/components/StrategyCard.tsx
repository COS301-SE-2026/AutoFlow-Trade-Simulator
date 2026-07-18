'use client';

export function StrategyCard({ id, onClick }: { id: number | null, onClick: () => void }) {

    return (
        <div
            className='rounded-xl p-6 border border-border/60'
            style={{ background: 'var(--panel)' }}
            onClick={onClick}>
            <div>{id} strategy name</div>
            <div>{id} strategy level</div>
            <div>{id} strategy category</div>
            <div>{id} strategy description</div>
        </div>
    );
}