'use client';

import {useState, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {parseDescriptionForTerms} from './tooltipParser';

export function TooltipText({text}: Readonly<{ text: string }>) {
    const segments = parseDescriptionForTerms(text);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({top: 0, left: 0});
    const [mounted, setMounted] = useState(false);
    const targetRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = (index: number) => {
        const el = targetRefs.current[index];
        if (el) {
            const rect = el.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY - 8,
                left: rect.left + window.scrollX + rect.width / 2,
            });
            setOpenIndex(index);
        }
    };

    return (
        <span>
            {segments.map((seg, i) => {
                const segmentKey = `${seg.text}-${i}`;
                return seg.isTerm ? (
                    <span key={segmentKey} className="relative inline-block">
                        <button
                            ref={el => {
                                targetRefs.current[i] = el;
                            }}
                            tabIndex={0}
                            aria-describedby={openIndex === i ? `tooltip-${i}` : undefined}
                            onMouseEnter={() => handleMouseEnter(i)}
                            onMouseLeave={() => setOpenIndex(null)}
                            onFocus={() => handleMouseEnter(i)}
                            onBlur={() => setOpenIndex(null)}
                            className="underline decoration-dotted decoration-blue-400 underline-offset-2 cursor-pointer text-blue-300 font-medium hover:text-blue-200 outline-none focus:ring-1 focus:ring-blue-400 rounded-sm"
                        >
                            {seg.text}
                        </button>

                    {mounted && openIndex === i && seg.definition && createPortal(
                        <span
                            id={`tooltip-${i}`}
                            role="tooltip"
                            style={{
                                top: `${coords.top}px`,
                                left: `${coords.left}px`,
                                transform: 'translate(-50%, -100%)',
                            }}
                            className="fixed z-[9999] w-64 p-3 rounded-xl border border-[var(--border)] bg-gray-900 text-gray-100 text-xs shadow-xl font-normal normal-case whitespace-normal leading-normal pointer-events-none"
                        >
                            {seg.definition}
                        </span>
                        ,document.body)
                    }
                    </span>
                ) : (<span key={segmentKey}>{seg.text}</span>);
            })}
        </span>
    );
}