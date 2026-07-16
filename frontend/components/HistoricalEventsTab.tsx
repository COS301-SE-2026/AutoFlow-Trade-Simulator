'use client';

import { useState } from 'react';

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
        context: "It's February 3rd, 2020. SPY trades at 5380, close to all-time highs. A novel coronavirus has been identified in Wuhan, but equity markets are dismissive. You have R200,000 to manage over the next six months.",
        timeframe: '6m',
    },
];

export function HistoricalEventsTab() {
    const  [selectedEvent, setSelectedEvent] = useState<EventDefinition | null>(null);

    if (selectedEvent) {
        return <p>{selectedEvent.title}</p>
    }

    return (
        <div className=''>
            <p>Replay real market history</p>
            <p>
                Each event replays historical market data one day at a time. Buy and sell as you want the event unfold - see how your decisions would have actually played out.
            </p>
            <div>
                {eventDefs.map((event) => (
                    <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={``}
                    >
                        <span>{event.ticker}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}