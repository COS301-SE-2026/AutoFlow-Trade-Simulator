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

const DEFAULT_3M_EVENT = {
    timeframe: '3m',
    tradingDays: 65,
    initialBalance: 200000,
} as const;

const eventDefs: EventDefinition[] = [
    {
        id: 'snh-accounting-scandal',
        title: 'Steinhoff Accounting Scandal',
        ticker: 'SNH',
        company: 'Steinhoff International Holdings N.V.',
        sector: 'Retail',
        period: 'Nov 2017 – Jan 2018',
        narrative: `Steinhoff, the global furniture giant, collapses overnight as "accounting irregularities" surface. CEO Markus Jooste resigns and the company restates years of financials, wiping out over R100bn in market cap in a single week. It becomes South Africa's largest corporate fraud case.`,
        context: `It's November 1, 2017. SNH trades near R61.00. Whispers of misconduct are circulating, but no one expects a near-total wipeout. You have R200,000 to manage over the next three months as the storm hits.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2017,
        startMonth: 11,
        startDay: 1,
    },
    {
        id: 'sab-takeover',
        title: "AB InBev's Mega Takeover of SABMiller",
        ticker: 'SAB',
        company: 'SABMiller plc',
        sector: 'Consumer Staples (Beverages)',
        period: 'Sep – Nov 2015',
        narrative: `Anheuser-Busch InBev launches a £68 billion hostile takeover bid for SABMiller, offering a 50% premium. The merger creates the world's largest brewer. SABMiller shares surge dramatically as the deal progresses toward completion.`,
        context: `It's September 1, 2015. SAB trades near R620 as rumours intensify. You have R200,000 to manage over the next three months as the M&A drama unfolds.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2015,
        startMonth: 9,
        startDay: 1,
    },
    {
        id: 'lbh-cyberattack',
        title: 'Liberty Holdings Ransomware Attack',
        ticker: 'LBH',
        company: 'Liberty Holdings Ltd',
        sector: 'Financials (Insurance)',
        period: 'May – Jul 2018',
        narrative: `Liberty suffers a massive cyber breach where hackers access client emails and demand a ransom. The insurer refuses to pay, leading to regulatory scrutiny and a 5% single-day share price drop, highlighting the growing threat of digital crime to financial institutions.`,
        context: `It's May 1, 2018. LBH trades near R130. Cyber risks are suddenly front-of-mind for investors. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2018,
        startMonth: 5,
        startDay: 1,
    },
    {
        id: 'mtm-ceo-exit',
        title: 'Momentum CEO Quits in the 2008 Crisis',
        ticker: 'MTM',
        company: 'Momentum Group Ltd',
        sector: 'Financials (Insurance)',
        period: 'Oct – Dec 2008',
        narrative: `In the depths of the 2008 global financial crisis, Momentum CEO EB Nieuwoudt unexpectedly resigns "to pursue his own interests". The sudden departure spooks investors already panicking about the market meltdown, adding leadership uncertainty to a volatile stock.`,
        context: `It's October 1, 2008. MTM trades near R11.50, battered by the crisis. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2008,
        startMonth: 10,
        startDay: 1,
    },
    {
        id: 'snh-jse-fine',
        title: 'Steinhoff Hit with JSE Regulatory Censure',
        ticker: 'SNH',
        company: 'Steinhoff International Holdings N.V.',
        sector: 'Retail',
        period: 'Jul – Sep 2018',
        narrative: `The JSE publicly censures Steinhoff and imposes a R1 million fine for failing to disclose a Moody's credit rating downgrade to shareholders for 20 days. Already reeling from the fraud scandal, the stock continues its painful decline as governance failures mount.`,
        context: `It's July 1, 2018. SNH trades near R1.30. The market has lost all trust in management. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2018,
        startMonth: 7,
        startDay: 1,
    },
    {
        id: 'slm-earnings-crash',
        title: 'Sanlam Profit Warning & EPS Collapse',
        ticker: 'SLM',
        company: 'Sanlam Ltd',
        sector: 'Financials (Insurance)',
        period: 'Jul – Sep 2008',
        narrative: `Sanlam reports a staggering 57% drop in normalised headline EPS, driven by massive market volatility and investment write-downs. The earnings miss confirms that the financial crisis is tearing through the insurance sector's balance sheets.`,
        context: `It's July 1, 2008. SLM trades near R16.50. You have R200,000 to manage over the next three months as insurance profits evaporate.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2008,
        startMonth: 7,
        startDay: 1,
    },
    {
        id: 'pik-dividend-suspension',
        title: "Pick n Pay Suspends COVID Dividend",
        ticker: 'PIK',
        company: 'Pick n Pay Stores Ltd',
        sector: 'Consumer Staples (Retail)',
        period: 'Mar – May 2020',
        narrative: `Pick n Pay forfeits its 173.06 cents per share final dividend to preserve cash during South Africa's first hard COVID-19 lockdown. The market punishes the stock with a 14% drop, as even defensive retailers feel the pandemic's squeeze.`,
        context: `It's March 1, 2020. PIK trades near R60, right as global markets crash. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2020,
        startMonth: 3,
        startDay: 1,
    },
    {
        id: 'ael-bytes-spinoff',
        title: 'Altron Unlocks Value with Bytes Demerger',
        ticker: 'AEL',
        company: 'Altron Ltd (Allied Electronics)',
        sector: 'Technology (IT Services)',
        period: 'Oct – Dec 2020',
        narrative: `Altron demerges Bytes Technology Group, listing it on both the LSE and JSE. The spin-off creates R7–R10.9 billion in shareholder value, with Altron's share price hitting an all-time high ahead of the listing as investors favour focused strategies.`,
        context: `It's October 1, 2020. AEL trades near R23.00. The market is excited about the upcoming demerger. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2020,
        startMonth: 10,
        startDay: 1,
    },
    {
        id: 'ssk-eskom-contract',
        title: 'Stefanutti Stocks Wins Kusile Mega-Contract',
        ticker: 'SSK',
        company: 'Stefanutti Stocks Holdings Ltd',
        sector: 'Industrials (Construction)',
        period: 'Oct – Dec 2008',
        narrative: `Stefanutti Stocks leads a consortium to secure a R2.9 billion civil works contract for Eskom's Kusile power station. This counter-cyclical boost provides a rare bright spot during the 2008 crisis, sending the stock on a strong rally from R7.00 to R11.00.`,
        context: `It's October 1, 2008. SSK trades near R18.00 but is highly volatile due to the crisis. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2008,
        startMonth: 10,
        startDay: 1,
    },
    {
        id: 'brt-dividend-boost',
        title: 'Brimstone Doubles Its Dividend Payout',
        ticker: 'BRT',
        company: 'Brimstone Investment Corporation Ltd',
        sector: 'Financials (Investment)',
        period: 'Jan – Mar 2008',
        narrative: `Brimstone doubles its annual dividend to 32 cents per share, driven by proceeds from the sale of its Lenco stake. The move signals confidence and strong NAV growth just as the global financial crisis begins to unfold, attracting income-hungry investors.`,
        context: `It's January 1, 2008. BRT trades near R8.65. The dividend increase is a major talking point. You have R200,000 to manage over the next three months.`,
        ...DEFAULT_3M_EVENT,
        startYear: 2008,
        startMonth: 1,
        startDay: 1,
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