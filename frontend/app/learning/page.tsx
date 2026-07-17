'use client';

import { Navbar } from '@/components/navbar';
import GreeksDisplay from '@/components/GreeksDisplay';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';
import { useState } from 'react';
import { BookOpen, Activity, History } from 'lucide-react';

type TabId = 'strategies' | 'greeks' | 'events';

export default function LearningPage() {
    const [activeTab, setActiveTab] = useState<TabId>('events');

    const tabs = [
    { id: 'strategies' as TabId, label: 'Strategies', icon: BookOpen },
    { id: 'greeks' as TabId, label: 'Options Greeks', icon: Activity },
    { id: 'events' as TabId, label: 'Historical Events', icon: History },
    ];

    return (
    <>
        <Navbar />
        <div className="h-full flex flex-col">

            <div className='border-b border-[var(--border)] px-6 py-4'>
                <div className='w-8 h-8 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center'>
                    <BookOpen className='w-4 h-4' />
                </div>
                <div>
                    <h2 className='text-lg font-bold'>Learning Center</h2>
                    <p className='text-sm'>
                        Master strategies, understand the greeks, and replay real market history.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-1'>
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-2 ml-2
                            ${isActive 
                                ? 'bg-[var(--background)] text-[var(--blue)] border rounded-xl border-[var(--border)]' 
                                : 'bg-[var(--blue)/50 hover:text-[var(--blue)] hover-bg-muted/30'}`}
                    >
                        <Icon className='w-4 h-4' />
                        {tab.label}
                    </button>
                );
            })}
            </div>
        </div>

        
    </>
  );
}