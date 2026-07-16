'use client';

import { Navbar } from '@/components/navbar';
import GreeksDisplay from '@/components/GreeksDisplay';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';

export default function LearningPage() {
  return (
    <>
        <Navbar />
        <div className="h-full p-6">
            <HistoricalEventsTab />
            {/* <GreeksDisplay /> */}
        </div>
    </>
  );
}