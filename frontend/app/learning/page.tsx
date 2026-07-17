'use client';

import { Navbar } from '@/components/navbar';
import GreeksDisplay from '@/components/GreeksDisplay';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';
import { BookOpen, Activity, History } from 'lucide-react';

type TabId = 'strategies' | 'greeks' | 'events';

const tabs = [
    { id: 'strategies' as TabId, label: 'Strategies', icon: BookOpen },
    { id: 'greeks' as TabId, label: 'Options Greeks', icon: Activity },
    { id: 'events' as TabId, label: 'Historical Events', icon: History },
]

export default function LearningPage() {
  return (
    <>
        <Navbar />
        <div className="h-full flex flex-col">
            <div className='border-b border-[var(--border)] px-6 py-4'>
                <div className='w-8 h-8 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center'>
                    <BookOpen className='w-4 h-4' />
                </div>
                <h2 className='text-lg font-bold'>Learning Center</h2>
                <p className='text-sm'>
                    Master strategies, understand the greeks, and replay real market history.
                </p>
            </div>
            <HistoricalEventsTab />
            {/* <GreeksDisplay /> */}
        </div>
    </>
  );
}