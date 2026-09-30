'use client';

import {useState, useRef, useEffect, useMemo} from 'react';
import {createPortal} from 'react-dom';
import {parseDescriptionForTerms} from './tooltipParser';

export function TooltipText({text}: Readonly<{ text: string }>) {
    const segments = useMemo(() => parseDescriptionForTerms(text), [text]);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({top: 0, left: 0});
    const [mounted, setMounted] = useState(false);
    const targetRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = (index: number) => {
        const el = targetRefs.current[index];
        if (el) {
            const rect = el.getBoundingClientRect();
            setCoords({
                top: rect.top - 8,
                left: rect.left + rect.width / 2,
            });
            setOpenIndex(index);
        }
    };

    const handleActivate = (index: number) => {
        if (openIndex === index) {
            setOpenIndex(null);
        } else {
            handleMouseEnter(index);
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
                            type="button"
                            aria-describedby={openIndex === i ? `tooltip-${i}` : undefined}
                            onMouseEnter={() => handleMouseEnter(i)}
                            onMouseLeave={() => setOpenIndex(null)}
                            onFocus={() => handleMouseEnter(i)}
                            onBlur={() => setOpenIndex(null)}
                            onClick={() => handleActivate(i)}
                            className="cursor-help rounded-sm font-medium text-[#8cc4ef] underline decoration-[rgba(111,180,234,0.6)] decoration-dotted underline-offset-2 transition-colors hover:text-white"
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
                                className="pointer-events-none fixed z-[9999] w-64 whitespace-normal rounded-xl border border-white/10 bg-[#12121c] p-3 text-left text-xs font-normal normal-case leading-relaxed text-white/85 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]"
                            >
                                {seg.definition}
                            </span>
                            , document.body)
                        }
                    </span>
                ) : (<span key={segmentKey}>{seg.text}</span>);
            })}
        </span>
    );
}