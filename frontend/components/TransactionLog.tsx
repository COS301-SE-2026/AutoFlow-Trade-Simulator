'use client';
import { useTransactions } from '@/hooks/useTransactions';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function TransactionLog({ accountId }: { accountId: number | null }) {
    const { transactions, loading, error } = useTransactions(accountId);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((t) => (
                    <TableRow key={t.asset_id + t.executed_at}>
                        <TableCell>{t.asset_ticker}</TableCell>
                        <TableCell>{t.direction}</TableCell>
                        <TableCell>{t.quantity}</TableCell>
                        <TableCell>{t.price_at_execution}</TableCell>
                        <TableCell>{t.quantity * t.price_at_execution}</TableCell>
                        <TableCell>{new Date(t.executed_at).toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}