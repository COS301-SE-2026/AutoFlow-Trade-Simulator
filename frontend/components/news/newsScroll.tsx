'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Newspaper, Play, Pause} from 'lucide-react';
import {NewsModal} from "@/components/news/newsModal";
import {TooltipText} from "@/components/news/TooltipText";

export interface NewsItem {
    id: string;
    timestamp: string;
    category: 'Rumor' | 'SENS' | 'Article' | 'Ruling';
    description: string;
    source?: string;
    author?: string;
    fullStory?: string;
}

export const CATEGORY_STYLES: Record<NewsItem['category'], string> = {
    Rumor: 'bg-[var(--orange)]/15 text-[var(--orange)] border-[var(--orange)]/40',
    SENS: 'bg-[var(--blue)]/15 text-blue-400 border-[var(--blue)]/40',
    Article: 'bg-gray-700/30 text-gray-300 border-gray-600/40',
    Ruling: 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/40',
};

const FADE_MS = 500;
const BREAKING_HOLD = 1100;
const ITEM_HOLD = 4800;

type Stage = 'none' | 'breaking' | 'item';

function daysAgoLabel(itemTimestamp: string, currentDate: Date): string {
    const itemDate = new Date(itemTimestamp);
    const msPerDay = 86_400_000;
    const itemDay = Date.UTC(itemDate.getUTCFullYear(), itemDate.getUTCMonth(), itemDate.getUTCDate());
    const nowDay = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate());
    const diffDays = Math.max(0, Math.round((nowDay - itemDay) / msPerDay));
    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return '1D AGO';
    return `${diffDays}D AGO`;
}

export function NewsTicker({
                               items,
                               currentDate,
                           }: Readonly<{
    items: NewsItem[];
    currentDate?: Date | string;
}>) {
    const [stage, setStage] = useState<Stage>('none');
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [pendingItem, setPendingItem] = useState<NewsItem | null>(null);

    const [userPlaying, setUserPlaying] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

    const offsetRef = useRef(0);
    const [trackWidth, setTrackWidth] = useState(0);
    const trackWidthRef = useRef(0);

    const trackRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number | undefined>(undefined);

    const prevIdsRef = useRef<Set<string> | null>(null);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const resolvedCurrentDate = useMemo(
        () => (currentDate ? new Date(currentDate) : new Date()),
        [currentDate]
    );

    const sorted = useMemo(
        () => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [items]
    );

    const track = useMemo(() => [...sorted, ...sorted], [sorted]);
    const duration = Math.max(20, sorted.length * 6);

    const isEffectivelyPlaying = userPlaying && stage === 'none' && !isHovered;

    const triggerBreaking = useCallback((item: NewsItem) => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        offsetRef.current = 0;
        if (trackRef.current) {
            trackRef.current.style.transform = `translateX(0px)`;
        }
        setPendingItem(item);
        setStage('breaking');
        requestAnimationFrame(() => setOverlayVisible(true));

        const t1 = setTimeout(() => setStage('item'), FADE_MS + BREAKING_HOLD);
        const t2 = setTimeout(() => setOverlayVisible(false), FADE_MS + BREAKING_HOLD + ITEM_HOLD);
        const t3 = setTimeout(() => {
            setStage('none');
            setPendingItem(null);
        }, FADE_MS + BREAKING_HOLD + ITEM_HOLD + FADE_MS);

        timeoutsRef.current = [t1, t2, t3];
    }, []);

    useEffect(() => {
        const currentIds = new Set(items.map(i => i.id));
        const prevIds = prevIdsRef.current;
        if (prevIds) {
            const newOnes = items.filter(i => !prevIds.has(i.id));
            if (newOnes.length > 0) {
                const latest = [...newOnes].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];
                triggerBreaking(latest);
            }
        }
        prevIdsRef.current = currentIds;
    }, [items, triggerBreaking]);

    useEffect(() => {
        return () => timeoutsRef.current.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const measure = () => {
            const w = el.scrollWidth / 2;
            trackWidthRef.current = w;
            setTrackWidth(w);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [track]);

    useEffect(() => {
        if (trackWidth === 0) return;
        const speed = trackWidth / duration;

        function step(time: number) {
            lastTimeRef.current ??= time;
            const dt = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            if (isEffectivelyPlaying) {
                let next = offsetRef.current + speed * dt;
                if (next >= trackWidthRef.current) next -= trackWidthRef.current;
                offsetRef.current = next;
                if (trackRef.current) {
                    trackRef.current.style.transform = `translateX(-${next}px)`;
                }
            }
            rafRef.current = requestAnimationFrame(step);
        }

        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = undefined;
        };
    }, [trackWidth, duration, isEffectivelyPlaying]);

    useEffect(() => {
        const el = scrollAreaRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            const width = trackWidthRef.current;
            if (width <= 0) return;
            let next = offsetRef.current + delta;
            next = ((next % width) + width) % width;
            offsetRef.current = next;
            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(-${next}px)`;
            }
        };

        el.addEventListener('wheel', onWheel, {passive: false});
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const togglePlay = useCallback(() => setUserPlaying(p => !p), []);
    const handleCloseModal = useCallback(() => setSelectedItem(null), []);

    if (sorted.length === 0 && stage === 'none') return null;

    const overlayActive = stage !== 'none';

    return (
        <div className="pb-4">
            <div
                className="flex flex-col border border-[var(--border)] bg-[var(--background)] rounded-xl overflow-hidden shadow-sm">
                <div
                    className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--border)] bg-gray-900/60">
                    <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-blue-400" aria-hidden="true"/>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                            Market News
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={userPlaying ? 'Pause news ticker' : 'Play news ticker'}
                        aria-pressed={!userPlaying}
                        className="bg-blue-900/40 border border-[var(--border)] hover:bg-blue-900/80 text-blue-400 flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                        {userPlaying ? <Pause className="w-3 h-3"/> : <Play className="w-3 h-3"/>}
                        {userPlaying ? 'Pause' : 'Play'}
                    </button>
                </div>

                <div
                    ref={scrollAreaRef}
                    className="relative overflow-hidden py-2.5 min-h-[40px] cursor-ns-resize"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {overlayActive && (
                        <div
                            className="absolute inset-0 flex items-center justify-center gap-2 z-20 px-4 transition-opacity"
                            style={{
                                backgroundColor: 'var(--background, #111827)',
                                opacity: overlayVisible ? 1 : 0,
                                transitionDuration: `${FADE_MS}ms`,
                            }}
                        >
                            {stage === 'breaking' && (
                                <span
                                    className="font-bold italic tracking-widest text-xs uppercase text-[var(--red)] animate-pulse">
                                    Breaking News
                                </span>
                            )}
                            {stage === 'item' && pendingItem && (
                                <>
                                    <span
                                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide shrink-0 ${CATEGORY_STYLES[pendingItem.category]}`}>
                                        {pendingItem.category}
                                    </span>
                                    <span className="text-sm font-semibold text-white truncate">
                                        {pendingItem.description}
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    <div
                        ref={trackRef}
                        className="flex items-center gap-8 whitespace-nowrap w-max"
                        style={{transform: `translateX(-${offsetRef.current}px)`}}
                    >
                        {track.map((item, i) => (
                            <div key={`${item.id}-dup-${i}`} className="flex items-center gap-2 text-sm pl-4">
                                <span
                                    className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}>
                                    {item.category}
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                    {daysAgoLabel(item.timestamp, resolvedCurrentDate)}
                                </span>
                                <button
                                    tabIndex={0}
                                    onClick={() => setSelectedItem(item)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') setSelectedItem(item);
                                    }}
                                    className="font-bold text-white cursor-pointer hover:text-blue-400 hover:underline decoration-1 underline-offset-2 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-sm transition-colors"
                                >
                                    <TooltipText text={item.description}/>
                                </button>
                                <span className="text-gray-600 px-2">•</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedItem && (
                <NewsModal item={selectedItem} onClose={handleCloseModal}/>
            )}
        </div>
    );
}