'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Gives a chart a minimum width per data point and scrolls sideways once it is full,
// instead of squeezing every point into the available width. Stays pinned to the newest point.
export function ScrollableChart({
    points,
    pxPerPoint = 24,
    className = '',
    children,
}: Readonly<{
    points: number;
    pxPerPoint?: number;
    className?: string;
    children: ReactNode;
}>) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [points]);

    return (
        <div ref={ref} className={`overflow-x-auto overflow-y-hidden ${className}`}>
            <div className='h-full' style={{ minWidth: `${points * pxPerPoint}px` }}>
                {children}
            </div>
        </div>
    );
}
