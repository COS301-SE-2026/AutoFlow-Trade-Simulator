'use client';

import { Navbar } from '@/components/navbar';
import { BookOpen, Activity, History } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';
import { LearningNavbar } from '@/components/LearningNavbar';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

type TabId = 'strategies' | 'greeks' | 'events';

const tabs: { id: TabId, label: string, icon: typeof BookOpen, href: string }[] = [
    { id: 'strategies' as TabId, label: 'Strategies', icon: BookOpen, href: '/learning/strategies' },
    { id: 'greeks' as TabId, label: 'Options Greeks', icon: Activity, href: '/learning/greeks' },
    { id: 'events' as TabId, label: 'Historical Events', icon: History, href: '/learning/events' },
];

export default function LearningPage() {
    const { activeTab, setActiveTab } = useLearning();
    const pathname = usePathname();

    return (
        <>
            <Navbar />
            <LearningNavbar />
        </>
    );
}