'use client';

import { Button } from "./ui/button";

export function StrategyDetail({ id, onClose }: { id: number | null, onClose: () => void }) {

    return (
        <div
            className='rounded-xl p-6 border border-border/60'
            style={{ background: 'var(--panel)' }}>
            <Button onClick={onClose}>X</Button>

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