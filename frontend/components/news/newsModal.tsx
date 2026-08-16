'use client';

import {useEffect, useRef} from 'react';
import {X} from 'lucide-react';
import {TooltipText} from './TooltipText';
import {NewsItem, CATEGORY_STYLES} from "@/components/news/newsScroll";

export function NewsModal({item, onClose}: Readonly<{ item: NewsItem; onClose: () => void }>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (!dialog.open) {
            dialog.showModal();
        }
        closeButtonRef.current?.focus();

        const handleClose = () => onClose();
        dialog.addEventListener('close', handleClose);

        const handleBackdropClick = (e: MouseEvent) => {
            if (e.target === dialog) dialog.close();
        };
        dialog.addEventListener('mousedown', handleBackdropClick);

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            dialog.removeEventListener('close', handleClose);
            dialog.removeEventListener('mousedown', handleBackdropClick);
            document.body.style.overflow = originalOverflow;
        };
    }, [onClose]);

    const publishedDate = new Date(item.timestamp);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="news-modal-title"
            className="backdrop:bg-black/60 rounded-xl border p-0 m-auto max-w-lg w-full"
            style={{backgroundColor: '#2b2b2b', borderColor: 'rgba(195,195,195,0.25)'}}
        >
            <div
                className="flex items-start justify-between gap-4 px-5 py-4 border-b"
                style={{borderColor: 'rgba(195,195,195,0.2)'}}
            >
        <span
            className={`px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}
            style={{fontFamily: 'Afacad, sans-serif'}}
        >
          {item.category}
        </span>
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    aria-label="Close"
                    className="p-1 rounded-md transition-colors hover:bg-white/10 focus:outline-none focus:ring-2"
                    style={{color: '#C3C3C3', ['--tw-ring-color' as any]: '#3dbf79'}}
                >
                    <X className="w-4 h-4"/>
                </button>
            </div>

            <div className="px-5 py-4 space-y-3">
                <h2
                    id="news-modal-title"
                    className="text-lg font-bold"
                    style={{color: '#ffffff', fontFamily: 'Afacad, sans-serif'}}
                >
                    {item.description}
                </h2>

                <div
                    className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
                    style={{color: '#C3C3C3', fontFamily: '"JetBrains Mono", monospace'}}
                >
                    {item.source && <span>SOURCE: {item.source}</span>}
                    {item.author && <span>BY: {item.author}</span>}
                    <span>
            {publishedDate.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                        {' · '}
                        {publishedDate.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}
          </span>
                </div>

                <div
                    className="text-sm leading-relaxed pt-2 border-t"
                    style={{color: '#ffffff', fontFamily: 'Afacad, sans-serif', borderColor: 'rgba(195,195,195,0.15)'}}
                >
                    <TooltipText text={item.fullStory ?? item.description}/>
                </div>
            </div>
        </dialog>
    );
}