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
    const { holdings, loading, error } = useHoldings(accountId);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Net quantity</TableHead>
                    <TableHead>Average cost</TableHead>
                    <TableHead>Current price</TableHead>
                    <TableHead>Unrealised P&L</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {holdings.map((h) => (
                    <TableRow key={h.asset_id}>
                        <TableCell>{h.ticker}</TableCell>
                        <TableCell>{h.net_quantity}</TableCell>
                        <TableCell>{h.average_cost}</TableCell>
                        <TableCell>{h.current_price}</TableCell>
                        <TableCell>{h.unrealised_pnl}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}