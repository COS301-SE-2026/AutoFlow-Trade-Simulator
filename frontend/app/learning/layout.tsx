'use client';

import { LearningProvider } from '@/context/LearningContext';
import { TechTreeProvider } from '@/context/TechTreeContext';
import { ReactNode } from 'react';

export default function LearningLayout({ children }: { readonly children: ReactNode }) {
    return (
        <LearningProvider>
            <TechTreeProvider>
                {children}
            </TechTreeProvider>
        </LearningProvider>
    )
}