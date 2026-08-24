'use client';

import { LearningProvider } from '@/context/LearningContext';
import { ReactNode } from 'react';

export default function LearningLayout({ children }: { readonly children: ReactNode }) {
    return (
        <LearningProvider>
            {children}
        </LearningProvider>
    )
}