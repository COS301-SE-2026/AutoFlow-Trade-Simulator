'use client';
import { useReports } from '@/hooks/useReports';

import { ReportCard } from './ReportCard';
import { useState } from 'react';
import { Button } from './ui/button';
import { FilePlus2 } from 'lucide-react';

export function ReportView({ }: {}) {
    const { reports, loading, error, createReport } = useReports();
    const [period, setPeriod] = useState<string>("daily");

    if (loading) return <p aria-busy="true" className="py-8 text-sm text-[var(--muted)]">Loading...</p>;
    if (error) return <p role="alert" className="py-8 text-sm text-[#ff6b72]">{error}</p>;

    const periods = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
    ];

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Report period" className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    {periods.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={period === value}
                            onClick={() => setPeriod(value)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                                period === value ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/55 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <Button
                    className="h-10 gap-2 rounded-xl bg-[var(--blue)] px-4 font-semibold text-white hover:bg-[#2385d1] active:scale-[0.98]"
                    onClick={() => createReport(period)}
                >
                    <FilePlus2 aria-hidden="true" className="h-4 w-4" />
                    Generate Report
                </Button>
            </div>
            {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
                    <p className="text-sm text-white/80">No reports generated yet.</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Pick a period and generate your first report.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
}
