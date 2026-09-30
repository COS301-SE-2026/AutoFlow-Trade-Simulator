'use client';

import { BookOpen, Activity, History, TreePine } from 'lucide-react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';
import { XPindicator } from './XPindicator';

type TabId = 'strategies' | 'techTree' | 'greeks' | 'events';

const tabs: { id: TabId, label: string, icon: typeof BookOpen, href: string }[] = [
    { id: 'strategies', label: 'Strategies', icon: BookOpen, href: '/learning/strategies' },
    { id: 'techTree', label: 'Tech Tree', icon: TreePine, href: '/learning/techTree' },
    { id: 'greeks', label: 'Options Greeks', icon: Activity, href: '/learning/greeks' },
    { id: 'events', label: 'Historical Events', icon: History, href: '/learning/events' },
];

export function LearningNavbar() {
    const pathname = usePathname();

    return (
        <div className="border-b border-[var(--border)] px-4 md:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 pb-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white/[0.04]">
                        <BookOpen aria-hidden="true" className="h-4 w-4 text-[var(--blue)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Learning Center</h1>
                        <p className="mt-0.5 max-w-[60ch] text-sm text-[var(--muted)]">
                            Master strategies, understand the greeks, and replay real market history.
                        </p>
                    </div>
                </div>
                <XPindicator />
            </div>

            <nav aria-label="Learning sections" className="-mb-px flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'border-[var(--blue)] text-white'
                                    : 'border-transparent text-white/55 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            <Icon aria-hidden="true" className={`h-4 w-4 ${isActive ? 'text-[var(--blue)]' : ''}`} />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
