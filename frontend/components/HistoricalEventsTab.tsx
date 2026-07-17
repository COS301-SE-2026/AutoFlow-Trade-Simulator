'use client';

import { useState } from 'react';
import { BookOpen, Play, ChevronRight } from 'lucide-react';

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
}

const eventDefs: EventDefinition[] = [
    {
        id: 'covid-crash',
        title: 'COVID-19 Market Crash',
        ticker: 'SPY',
        company: 'S&P 500 ETF',
        sector: 'Broad Market',
        period: 'Feb - Aug 2020',
        narrative: 'A new respiratory illness is spreading in China. Global markets are near all-time highs and largely ignoring it. Then everything changes in three weeks.',
        context: "It's February 3rd, 2020. SPY trades at R5380, close to all-time highs. A novel coronavirus has been identified in Wuhan, but equity markets are dismissive. You have R200,000 to manage over the next six months.",
        timeframe: '6m',
    },
    {
    id: 'nvda-surge',
    title: 'NVIDIA AI Surge',
    ticker: 'NVDA',
    company: 'NVIDIA Corp.',
    sector: 'Semiconductors',
    period: 'Jan - Jul 2023',
    narrative: 'ChatGPT just launched and is adding a million users a day. NVDA has fallen 50% from 2021 highs. Something is about to change.',
    context: "It's January 3, 2023. NVDA trades at R2520, down sharply from its 2021 peak. OpenAI's ChatGPT launched six weeks ago. The AI compute demand thesis is unproven. You have R200,000 to deploy over the next six months.",
    timeframe: '6m',
  },
];

export function HistoricalEventsTab() {
    const  [selectedEvent, setSelectedEvent] = useState<EventDefinition | null>(null);

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