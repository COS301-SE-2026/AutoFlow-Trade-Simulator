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
            <div>
                <Button onClick={() => setPeriod("daily")}>Daily</Button>
                <Button onClick={() => setPeriod("weekly")}>Weekly</Button>
                <Button onClick={() => createReport(period)}>Generate Report</Button>
            </div>
            {reports.length === 0 ? (
                <p>No reports generated yet.</p>
            ) : (
                <div className='grid grid-cols-1 gap-4'>
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}
        </>
    );
}