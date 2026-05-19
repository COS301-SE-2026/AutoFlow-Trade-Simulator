'use client';
import { useHoldings } from '@/hooks/useHoldings';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function HoldingsSummary({ accountId }: { accountId: number | null }) {
    const { Holdings, loading, error } = useHoldings(accountId);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>net_quantity</TableHead>
                    <TableHead>average_cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Holdings.map((t) => (
                    <TableRow key={t.asset_id}>
                        <TableCell>{t.ticker}</TableCell>
                        <TableCell>{t.net_quantity}</TableCell>
                        <TableCell>{t.average_cost}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}