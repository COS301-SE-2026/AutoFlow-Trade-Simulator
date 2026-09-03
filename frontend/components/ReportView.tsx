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
            <div className='gap-4'>
                <Button onClick={() => setPeriod("daily")}>Daily</Button>
                <Button onClick={() => setPeriod("weekly")}>Weekly</Button>
                <Button onClick={() => createReport(period)}>Generate Report</Button>
            </div>
            {reports.length === 0 ? (
                <p className='text-sm'>No reports generated yet.</p>
            ) : (
                <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}
        </>
    );
}