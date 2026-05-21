'use client';
import { useReports } from '@/hooks/useReports';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
                <div>
                    <Button onClick={() => setPeriod("daily")}>Daily</Button>
                    <Button onClick={() => setPeriod("weekly")}>Weekly</Button>
                    <Button onClick={() => createReport(period)}>Generate Report</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report ID</TableHead>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Open Price</TableHead>
                            <TableHead>Close Price</TableHead>
                            <TableHead>PCT Change</TableHead>
                            <TableHead>Period High</TableHead>
                            <TableHead>Period Low</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.report_id}</TableCell>
                                <TableCell>{r.ticker}</TableCell>
                                <TableCell>{r.open_price}</TableCell>
                                <TableCell>{r.close_price}</TableCell>
                                <TableCell>{r.pct_change}</TableCell>
                                <TableCell>{r.period_high}</TableCell>
                                <TableCell>{r.period_low}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            </div>

        </>
    );
}