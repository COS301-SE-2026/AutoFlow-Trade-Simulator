'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { AccountProvider } from "@/lib/hooks/accountContext";
import { AccountSelector } from "@/components/intAccSwitcher";
import { usePathname, useRouter } from 'next/navigation';
import { CreateNewInternationalAccount } from "@/components/ui/createNewInternationalAccount";
import { useAuth } from "@/lib/hooks/useAuth";

const links = [
    { label: 'Dashboard', href: '/dashboard', match: '/dashboard' },
    { label: 'Portfolio', href: '/portfolio', match: '/portfolio' },
    { label: 'Markets', href: '/assets/BTC', match: '/assets' },
    { label: 'Multiplayer', href: '/multiplayer', match: '/multiplayer' },
    { label: 'Learning', href: '/learning', match: '/learning' },
    { label: 'Help', href: '/help', match: '/help' },
];

export function Navbar() {
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname() ?? '';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <nav
            aria-label="Main"
            className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--border)] bg-[rgba(12,12,20,0.78)] px-4 py-3 backdrop-blur-xl md:px-7 lg:h-16 lg:flex-nowrap lg:py-0"
        >
            <div className="flex shrink-0 items-center gap-2.5">
                <Image src="/logo.svg" alt="" width={28} height={28} className="rounded-md" />
                <span className="text-[16px] font-semibold tracking-tight text-white">AutoFlow</span>
            </div>

            <div className="order-last -mx-1 flex w-full min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] lg:order-none lg:mx-0 lg:w-auto">
                {links.map(({ label, href, match }) => {
                    const active = pathname.startsWith(match);
                    return (
                        <Link
                            key={label}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                                active
                                    ? 'bg-white/[0.08] text-white'
                                    : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                            }`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 sm:w-auto sm:shrink-0 sm:justify-end">
                <AccountProvider>
                    <AccountSelector />
                    <div aria-hidden="true" className="mx-0.5 hidden h-7 w-px bg-[var(--border)] sm:block" />
                    <CreateNewInternationalAccount />
                </AccountProvider>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-[13.5px] font-medium text-white/70 transition-colors hover:border-[rgba(237,28,36,0.5)] hover:bg-[rgba(237,28,36,0.1)] hover:text-[#ff8a8f] active:scale-[0.98]"
                >
                    <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                    <span className="sr-only sm:not-sr-only">Log Out</span>
                </button>
            </div>
        </nav>
    );
}
