'use client';

import Image from 'next/image';

interface SplashPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export default function SplashPage({ onGetStarted, onLogin }: SplashPageProps) {
    return (
        <>
            <div>
                <Image
                    src='/logo.svg'
                    alt='Autoflow'
                    width={24}
                    height={24}
                    className='2-6 h-6'
                />
                <h2>AutoFlow</h2>
            </div>
            <button
                onClick={onLogin}
                className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
            >
                Sign In
            </button>
            <button
                onClick={onGetStarted}
                className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
            >
                Get Started
            </button>
        </>
    )
}