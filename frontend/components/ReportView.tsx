'use client';
import { useReports } from '@/hooks/useReports';

import { ReportCard } from './ReportCard';
import { useState } from 'react';
import { Button } from './ui/button';

export function ReportView({ }: {}) {
    const { reports, loading, error, createReport } = useReports();
    const [period, setPeriod] = useState<string>("daily");

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <>
            <div className='flex flex-row gap-4 m-2'>
                <Button className='bg-transparent border border-[var(--border)]' onClick={() => setPeriod("daily")}>Daily</Button>
                <Button className='bg-transparent border border-[var(--border)]' onClick={() => setPeriod("weekly")}>Weekly</Button>
                <Button className='bg-transparent border border-[var(--border)]' onClick={() => createReport(period)}>Generate Report</Button>
            </div>
            <div className='m-2'>
                {reports.length === 0 ? (
                    <p className='text-sm'>No reports generated yet.</p>
                ) : (
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {reports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}