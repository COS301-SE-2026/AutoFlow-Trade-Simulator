'use client';

import { useState } from 'react';
import { BookOpen, Play, ChevronRight } from 'lucide-react';
import { EventSimulator } from './EventSimulator';

interface EventDefinition {
    id: string;
    title: string;
    ticker: string;
    company: string;
    sector: string;
    period: string;
    narrative: string;
    context: string;
    timeframe: string; // 3m or 1y or maybe even 1m for some event.
    startYear: number;
    startMonth: number;
    startDay: number;
    tradingDays: number;
    initialBalance: number;
}

const eventDefs: EventDefinition[] = [
    {
        id: 'aapl-iphone12',
        title: 'Apple iPhone 12 Supercycle',
        ticker: 'AAPL',
        company: 'Apple Inc.',
        sector: 'Technology',
        period: 'Oct 2020 - Apr 2021',
        narrative: `Apple launches its first 5G iPhone lineup. Despite pandemic uncertainty, demand explodes, fuelling the biggest iPhone upgrade cycle in years. The market is about to reprice the world's most valuable company.`,
        context: `It's October 13, 2020. AAPL trades near R2104 after the iPhone 12 reveal. Early pre-order numbers are breaking records, but analysts are still cautious about consumer spending during COVID. You have R200,000 to manage over the next six months.`,
        timeframe: '6m',
        startYear: 2020,
        startMonth: 10,
        startDay: 13,
        tradingDays: 130,
        initialBalance: 200000,
    },
    {
        id: 'sanlam-ninetyone',
        title: 'Sanlam Partnership Boost',
        ticker: 'N91',                     // Ninety One JSE ticker – verify with your /market-data/assets list
        company: 'Ninety One',
        sector: 'Financial Services',
        period: 'Jan - May 2026',
        narrative:
            'A landmark 15-year strategic deal with Sanlam adds £18.3 bn (R412.5 bn) in AUM. The market is about to reprice Ninety One as its total AUM surges 31% to a record R3.9 trillion.',
        context:
            "It's January 2, 2026. Ninety One (N91) is trading near the middle of its recent range. Sanlam and Ninety One are in the final stages of a partnership that will bring £18.3 bn in assets under management. The market is yet to fully price in the transformation.",
        timeframe: '3m',                   // shorter timeframe to capture the immediate reaction
        startYear: 2026,
        startMonth: 1,                     // 1‑based: January
        startDay: 2,
        tradingDays: 65,                   // roughly 3 calendar months of trading days
        initialBalance: 200000,            // matches your other ZAR‑based events
    }
];

export function HistoricalEventsTab() {
    const  [selectedEvent, setSelectedEvent] = useState<EventDefinition | null>(null);

    if (selectedEvent) return <EventSimulator event={selectedEvent} onBack={() => setSelectedEvent(null)} />;

    return (
        <div className='space-y-6'>
            <div className='border border-[var(--border)]/20 rounded-xl p-4'>
                <p className='text-sm font-medium mb-1'>Replay real market history</p>
                <p className='text-sm'>
                    Each event replays historical market data one day at a time. Buy and sell as you want the event unfold - see how your decisions would have actually played out.
                </p>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {eventDefs.map((event) => (
                    <button
                        type='button'
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className='text-left border border-[var(--border)] rounded-xl p-5 bg-[var(--background)]'
                    >
                        <div className='flex items-start justify-between gap-3 mb-3'>
                            <div>
                                <div className='flex items-center gap-2 mb-1'>
                                    <span className='font-bold text-sm text-[var(--blue)]'>{event.ticker}</span>
                                    <span className='text-xs px-2 py-1 rounded-full'>{event.sector}</span>
                                </div>
                                <h3 className='font-bold'>{event.title}</h3>
                                <p className='text-xs text-muted-foreground mt-1'>{event.period}</p>
                            </div>
                            <div className='shrink-0 w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center'>
                                <BookOpen className='w-5 h-5 text-[var(--blue)]' />
                            </div>
                        </div>
                
                        <p className='text-sm leading-relaxed'>{event.narrative}</p>
                        <div className='mt-4 flex flex-row flex-items-center gap-2 text-xs font-semibold text-[var(--blue)]'>
                            <span>
                                <Play className='w-3.5 h-3.5' />
                            </span>
                            <span>
                                Start simulation
                            </span> 
                            <span>
                                <ChevronRight className='w-3.5 h-3.5' />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}