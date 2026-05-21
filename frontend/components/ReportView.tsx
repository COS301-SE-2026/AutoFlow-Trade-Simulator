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

export function ReportView({ }: {}) {
    const { reports, loading, error } = useReports();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>report id</TableHead>
                    <TableHead>ticker</TableHead>
                    <TableHead>open price</TableHead>
                    <TableHead>close price</TableHead>
                    <TableHead>pct change</TableHead>
                    <TableHead>period high</TableHead>
                    <TableHead>period low</TableHead>
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
    );
}