'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TooltipText } from './TooltipText';
import { CATEGORY_STYLES, type NewsItem } from "@/components/news/types";

export function NewsModal({ item, onClose }: Readonly<{ item: NewsItem; onClose: () => void }>) {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const publishedDate = new Date(item.timestamp);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop overlay button */}
            <button
                type="button"
                aria-label="Close modal backdrop"
                onClick={onClose}
                className="fixed inset-0 cursor-default border-none bg-[rgba(4,4,10,0.72)] backdrop-blur-sm"
            />

            <section
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="news-modal-title"
                className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden overscroll-contain rounded-2xl border border-white/10 bg-[#12121c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            >
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
                    <span className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}>
                        {item.category}
                    </span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X aria-hidden="true" className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5 overflow-y-auto overscroll-contain px-6 py-6">
                    <h2
                        id="news-modal-title"
                        className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug"
                    >
                        {item.description}
                    </h2>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[var(--border)] pb-4 text-xs text-white/50">
                        {item.source && <span>Source: <strong className="font-semibold text-white/80">{item.source}</strong></span>}
                        {item.author && <span>By: <strong className="font-semibold text-white/80">{item.author}</strong></span>}
                        <span>
                            {publishedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            {' · '}
                            {publishedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="max-w-[65ch] text-base leading-relaxed text-white/80">
                        <TooltipText text={item.fullStory ?? item.description} />
                    </div>
                </div>
            </section>
        </div>
    );
}