'use client';

import { Navbar } from '@/components/navbar';
import GreeksDisplay from '@/components/GreeksDisplay';

export default function LearningPage() {
  return (
    <>
        <Navbar />
        <div className="h-full p-6">
            <GreeksDisplay />
        </div>
    </>
  );
}