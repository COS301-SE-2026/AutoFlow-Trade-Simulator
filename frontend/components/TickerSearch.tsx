import React, { useMemo, useState } from 'react'

import { useRealTimeTicksList } from '@/hooks/useRealTimeTicks';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import Fuse from 'fuse.js'

interface TickerSearchProps {
    onSelect?: (ticker: string) => void;
    placeholder?: string;
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
        <div style={{ position: 'relative', }}>
            <Combobox value={query} onChange={handleSelect}>
                <ComboboxInput
                    placeholder={placeholder}
                    onChange={(e) => setQuery(e.target.value.toUpperCase())}
                />
                {suggestions.length > 0 ? (
                    <ComboboxOptions anchor={{ to: 'bottom start' }} style={{ position: 'absolute', background: 'black' }}>
                        {suggestions.map((ticker) => (
                            <ComboboxOption key={ticker} value={ticker}>
                                {ticker}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                ) : (
                    <></>
                )}
            </Combobox>
        </div>
    )
}
