'use client';

import {useMemo} from 'react';
import {Newspaper} from "lucide-react";

export interface NewsItem {
    id: string;
    timestamp: string;
    category: 'Rumor' | 'Announcement' | 'Article' | 'Ruling';
    description: string;
}

const CATEGORY_STYLES: Record<NewsItem['category'], string> = {
    Rumor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    Announcement: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    Article: 'bg-green-500/20 text-green-300 border-green-500/40',
    Ruling: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export function NewsTicker({items}: Readonly<{ items: NewsItem[] }>) {
    const sorted = useMemo(
        () => [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        [items]
    );

    if (sorted.length === 0) return null;

    const track = [...sorted, ...sorted];
    const duration = Math.max(20, sorted.length * 6);

    return (
        <div
            className="flex jusitfy-between relative w-full overflow-hidden border border-[var(--border)] rounded-xl bg-[var(--background)] py-2">
            <div className="flex items-center justify-center px-3 py-2 border-r border-[var(--border)] shrink-0">
                <Newspaper className="w-4 h-4 text-gray-300" />
                <span className="text-xs font-bold text-gray-300 pl-2">NEWS</span>
            </div>
            <div className="relative overflow-hidden py-2">
                <div
                    className="ticker-track flex items-center gap-8 whitespace-nowrap w-max"
                    style={{animationDuration: `${duration}s`}}
                >
                    {track.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="flex items-center gap-2 text-sm">
                            <span
                                className={`px-2 py-0.5 rounded-md border text-xs font-bold ${CATEGORY_STYLES[item.category]}`}>
                                {item.category}
                            </span>
                            <span className="text-gray-400 text-xs">
                                {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-white">{item.description}</span>
                            <span className="text-gray-600 px-2">•</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>
                {`
                    .ticker-track {
                        animation-name: ticker-scroll;
                        animation-timing-function: linear;
                        animation-iteration-count: infinite;
                    }
                    .ticker-track:hover {
                        animation-play-state: paused;
                    }
                    @keyframes ticker-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}
            </style>
        </div>
    );
}