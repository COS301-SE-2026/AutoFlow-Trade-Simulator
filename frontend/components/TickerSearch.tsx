import React, { useMemo, useState } from 'react'

import { useRealTimeTicksList } from '@/hooks/useRealTimeTicks';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js'

export interface TickerSearchProps {
    readonly onSelect?: (ticker: string) => void;
    readonly placeholder?: string;
}

export function TickerSearch({
    onSelect,
    placeholder = "Ticker Search..."
}: TickerSearchProps) {
    const { realTimeTicksList, loading, error } = useRealTimeTicksList();
    const [query, setQuery] = useState('');

    const fuse = useMemo(() => new Fuse(realTimeTicksList, {
        threshold: 0.3,
    }), [realTimeTicksList]);

    const suggestions = useMemo(() => {
        if (query.trim().length == 0) {
            return [];
        }

        const results = fuse.search(query.trim().toUpperCase());
        return results.map(r => r.item).slice(0, 10);
    }, [query, fuse]);

    const handleSelect = (value: string | null) => {
        if (value) {
            if (onSelect) {
                onSelect(value);
            } else {
                window.location.href = `/assets/${value}`;
            }
        }
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading tickers</div>;

    return (
        <div className="w-full">
            <Combobox value={query} onChange={handleSelect}>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <ComboboxInput
                        placeholder={placeholder}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pl-8 pr-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                </div>
                {suggestions.length > 0 && (
                    <ComboboxOptions
                        anchor={{ to: 'bottom start', gap: 4 }}
                        className="z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
                    >
                        {suggestions.map((ticker) => (
                            <ComboboxOption
                                key={ticker}
                                value={ticker}
                                className="cursor-pointer rounded-md px-2.5 py-1.5 data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                            >
                                {ticker}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                )}
            </Combobox>
        </div>
    )
}
