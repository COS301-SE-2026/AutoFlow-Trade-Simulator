'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Newspaper, Play, Pause, ArrowUpRight} from 'lucide-react';
import {NewsModal} from "@/components/news/newsModal";
import {TooltipText} from "@/components/news/TooltipText";
import {CATEGORY_STYLES, type NewsItem} from "@/components/news/types";

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

    useEffect(() => {
        if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setUserPlaying(false);
    }, []);
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

    const track = useMemo(
        () => (sorted.length > 0 ? [...sorted, ...sorted] : []),
        [sorted]
    );

    const duration = Math.max(20, sorted.length * 6);

    const isEffectivelyPlaying = userPlaying && stage === 'none' && !isHovered && sorted.length > 0;

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
        if (!el || sorted.length === 0) return;

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
    }, [sorted.length]);

    const togglePlay = useCallback(() => setUserPlaying(p => !p), []);
    const handleCloseModal = useCallback(() => setSelectedItem(null), []);

    const overlayActive = stage !== 'none';

    return (
        <div className="pb-4">
            <div
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)]">
                <div
                    className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-[#6fb4ea]" aria-hidden="true"/>
                        <h3 className="text-sm font-semibold text-white">
                            Market News
                        </h3>
                    </div>

                    {sorted.length > 0 && (
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={userPlaying ? 'Pause news ticker' : 'Play news ticker'}
                            aria-pressed={!userPlaying}
                            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            {userPlaying ? <Pause aria-hidden="true" className="w-3 h-3"/> : <Play aria-hidden="true" className="w-3 h-3"/>}
                            {userPlaying ? 'Pause' : 'Play'}
                        </button>
                    )}
                </div>

                <div
                    ref={scrollAreaRef}
                    className="relative overflow-hidden py-2.5 min-h-[40px] cursor-ns-resize"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {overlayActive && (
                        <div
                            role="status"
                            aria-live="assertive"
                            aria-atomic="true"
                            className="absolute inset-0 flex items-center justify-center gap-2 z-20 px-4 transition-opacity"
                            style={{
                                backgroundColor: '#0e0e16',
                                opacity: overlayVisible ? 1 : 0,
                                transitionDuration: `${FADE_MS}ms`,
                            }}
                        >
                            {stage === 'breaking' && (
                                <span
                                    className="font-bold italic tracking-widest text-xs uppercase text-[#ff6b72] motion-safe:animate-pulse">
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

                    {sorted.length === 0 ? (
                        <div className="flex items-center justify-center text-xs text-white/45">
                            No news available
                        </div>
                    ) : (
                        <div
                            ref={trackRef}
                            className="flex items-center gap-8 whitespace-nowrap w-max"
                            style={{transform: `translateX(-${offsetRef.current}px)`}}
                        >
                            {track.map((item, i) => {
                                const isDuplicate = i >= sorted.length;
                                return (
                                    <button
                                        type="button"
                                        key={`${item.id}-dup-${i}`}
                                        tabIndex={isDuplicate ? -1 : 0}
                                        onClick={() => setSelectedItem(item)}
                                        aria-hidden={isDuplicate || undefined}
                                        aria-label={`Read story: ${item.description}`}
                                        className="group flex items-center gap-2 rounded-md border-none bg-transparent p-0 pl-4 text-left text-sm"
                                    >
                                        <span
                                            className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}>
                                            {item.category}
                                        </span>
                                        <span className="text-xs font-mono tabular-nums text-white/45">
                                            {daysAgoLabel(item.timestamp, resolvedCurrentDate)}
                                        </span>
                                        <span className="font-semibold text-white/90 transition-colors group-hover:text-white">
                                            <TooltipText text={item.description}/>
                                        </span>
                                        <span className="shrink-0 text-[#6fb4ea] transition-colors group-hover:text-white">
                                            <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5"/>
                                        </span>
                                        <span className="px-2 text-white/20" aria-hidden="true">•</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedItem && (
                <NewsModal item={selectedItem} onClose={handleCloseModal}/>
            )}
        </div>
    );
}