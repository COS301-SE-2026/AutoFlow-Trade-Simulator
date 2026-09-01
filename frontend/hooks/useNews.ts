'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchNews } from '@/lib/api/news';
import type { NewsItem as BackendNewsItem } from '@/lib/types/news';
import type { NewsItem as UiNewsItem, NewsCategory } from '@/components/news/types';

const CATEGORY_MAP: Record<BackendNewsItem['category'], NewsCategory> = {
    Rumor: 'Rumor',
    Sens: 'SENS',
    Article: 'Article',
    Ruling: 'Ruling',
};

function toUiNewsItem(item: BackendNewsItem): UiNewsItem {
    return {
        id: String(item.id),
        timestamp: item.timestamp.toDateString(),
        category: CATEGORY_MAP[item.category],
        description: item.description,
        source: item.source ?? undefined,
        author: item.author ?? undefined,
        fullStory: item.full_story,
    };
}

interface UseNewsResult {
    newsItems: UiNewsItem[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useNews(
    ticker: string,
    startDate: Date | null,
    endDate: Date | null,
): UseNewsResult {
    const [newsItems, setNewsItems] = useState<UiNewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refetchToken, setRefetchToken] = useState(0);

    const refetch = useCallback(() => setRefetchToken(t => t + 1), []);

    const startTime = startDate?.getTime() ?? null;
    const endTime = endDate?.getTime() ?? null;

    useEffect(() => {
        if (!ticker || !startTime || !endTime) {
            setNewsItems([]);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const start = new Date(startTime);
        const end = new Date(endTime);

        fetchNews(ticker, start, end)
            .then(res => {
                if (cancelled) return;
                setNewsItems(res.news_items.map(toUiNewsItem));
            })
            .catch(err => {
                if (cancelled) return;
                console.error('Failed to fetch news items:', err);
                // Keep error null so no error message displays to the user
                setError(null);
                setNewsItems([]);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [ticker, startTime, endTime, refetchToken]);

    return { newsItems, isLoading, error, refetch };
}