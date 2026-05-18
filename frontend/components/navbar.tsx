'use client';

import { Button} from './ui/button';
import { Card } from './ui/card'
import Link  from 'next/link';

export function Navbar() {
    const navItems = [
        { label: 'Dashboard', href: "/dash" },
        { label: 'Markets', href: '/markets' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Leaderboard', href: '/leaderboard' },
        { label: 'AI Assistant', href: '/assistant' }
    ];

    return (
        <nav style={{
            backgroundColor: 'var(--accent)',
            padding: '20px'
            }}>
            {navItems.map((item)=> (
                <Button key={item.href} variant="secondary" style={{ margin: '0px 5px'}}>
                    <Link key={item.href} href={item.href}>
                        {item.label}
                    </Link>
                </Button>
            ))}
        </nav>
    )
}