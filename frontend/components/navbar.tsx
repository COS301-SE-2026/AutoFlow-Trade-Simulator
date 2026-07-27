'use client';

import Link from 'next/link';
import { AccountProvider } from "@/lib/hooks/accountContext";
import { AccountSelector } from "@/components/ui/intAccSwitcher";
import { useRouter } from 'next/navigation';
import { CreateNewInternationalAccount } from "@/components/ui/createNewInternationalAccount";
import { useAuth } from "@/lib/hooks/useAuth";

const actionBtn = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 16px',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid rgba(105, 80, 161, 0.55)',
    background: 'rgba(38, 34, 98, 0.45)',
    color: '#fff',
    transition: 'background 0.15s, border-color 0.15s',
} as const;

export function Navbar() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 28px',
            background: 'rgba(20, 20, 32, 0.6)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Portfolio', href: '/portfolio' },
                    { label: 'Markets', href: '/#' },
                    { label: 'Leaderboard', href: '/#' },
                    { label: 'AI Assistant', href: '/#' },
                    { label: 'Learning', href: '/learning' },
                    { label: 'Help', href: '/help' },
                ].map(({ label, href }) => (
                    <Link
                        key={label}
                        href={href}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.65)',
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        className="hover:bg-white/[0.07] hover:text-white"
                    >
                        {label}
                    </Link>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AccountProvider>
                    <AccountSelector />
                    <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 2px' }} />
                    <CreateNewInternationalAccount />
                </AccountProvider>

                <button
                    onClick={handleLogout}
                    style={{
                        ...actionBtn,
                        border: '1px solid rgba(237, 28, 36, 0.4)',
                        background: 'rgba(237, 28, 36, 0.12)',
                        color: '#ff6b6b',
                    }}
                    className="hover:bg-red-500/20 hover:border-red-500/60"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                </button>
            </div>
        </nav>
    );
}
