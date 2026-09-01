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
                className="fixed inset-0 bg-black/80 backdrop-blur-sm border-none cursor-default"
            />

            <section
                ref={modalRef}
                aria-labelledby="news-modal-title"
                className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)] bg-[#111827] opacity-100 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--border)] bg-gray-900 shrink-0">
                    <span className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}>
                        {item.category}
                    </span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-5 overflow-y-auto custom-scrollbar">
                    <h2
                        id="news-modal-title"
                        className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug"
                    >
                        {item.description}
                    </h2>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-gray-400 border-b border-[var(--border)] pb-4">
                        {item.source && <span>SOURCE: <strong className="text-gray-300 font-semibold">{item.source}</strong></span>}
                        {item.author && <span>BY: <strong className="text-gray-300 font-semibold">{item.author}</strong></span>}
                        <span>
                            {publishedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            {' · '}
                            {publishedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="text-base leading-relaxed text-gray-200 tracking-normal font-normal">
                        <TooltipText text={item.fullStory ?? item.description} />
                    </div>
                </div>
            </section>
        </div>
    );
}