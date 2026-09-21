'use client';

import { Navbar } from '@/components/navbar';

export function PageError({ message }: { message: string }) {
    return (
        <>
            <Navbar />
            <div className="flex items-center justify-center min-h-screen ">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-destructive">
                            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M10 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="10" cy="14" r="0.75" fill="currentColor" />
                        </svg>
                    </div>
                    <p className="font-mono text-sm text-destructive">{message}</p>
                </div>
            </div>

        </>
    );
}
