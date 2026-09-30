'use client';

import { AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export function PageError({ message }: { message: string }) {
    return (
        <>
            <Navbar />
            <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
                <div role="alert" className="flex max-w-md flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(237,28,36,0.1)]">
                        <AlertCircle aria-hidden="true" className="h-5 w-5 text-[#ff6b72]" strokeWidth={1.75} />
                    </div>
                    <p className="break-words text-sm text-white/80">{message}</p>
                </div>
            </div>
        </>
    );
}
