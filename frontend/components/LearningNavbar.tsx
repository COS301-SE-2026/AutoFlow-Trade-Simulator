'use client';

import { BookOpen, Activity, History } from 'lucide-react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

type TabId = 'strategies' | 'greeks' | 'events';

const tabs: { id: TabId, label: string, icon: typeof BookOpen, href: string }[] = [
    { id: 'strategies' as TabId, label: 'Strategies', icon: BookOpen, href: '/learning/strategies' },
    { id: 'greeks' as TabId, label: 'Options Greeks', icon: Activity, href: '/learning/greeks' },
    { id: 'events' as TabId, label: 'Historical Events', icon: History, href: '/learning/events' },
];

export function LearningNavbar() {
    const pathname = usePathname();

    return (
        <>
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
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-2 ml-2
                            ${isActive
                                    ? 'bg-[var(--background)] text-[var(--blue)] border rounded-xl border-[var(--border)]'
                                    : 'bg-[var(--blue)]/50 hover:text-[var(--blue)] hover-bg-muted/30'}`}
                        >
                            <Icon className='w-4 h-4' />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
