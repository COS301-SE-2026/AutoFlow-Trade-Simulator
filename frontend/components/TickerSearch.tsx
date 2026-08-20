import React, { useMemo, useState } from 'react'

import { useRealTimeTicksList } from '@/hooks/useRealTimeTicks';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js'

interface TickerSearchProps {
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
        <div style={{ position: 'relative', }}>
            <Combobox value={query} onChange={handleSelect}>
                <div className='flex gap-2'>
                    <Search />
                    <ComboboxInput
                        placeholder={placeholder}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    />
                </div>
                {suggestions.length > 0 ? (
                    <ComboboxOptions anchor={{ to: 'bottom start' }} style={{ position: 'absolute', background: '#171620' }}>
                        {suggestions.map((ticker) => (
                            <ComboboxOption key={ticker} value={ticker} className='px-2 py-2' style={{ background: '#171620' }}>
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
