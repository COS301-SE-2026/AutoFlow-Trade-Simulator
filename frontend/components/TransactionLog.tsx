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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { useMemo, useState } from 'react';

export function TransactionLog({ accountId }: { accountId: number | null }) {
    const { transactions, loading, error } = useTransactions(accountId);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const numPages = Math.ceil(transactions.length / pageSize);

    const transactionLogPage = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const temp = transactions.slice(startIndex, endIndex);

        const padding = pageSize - temp.length;
        if (padding > 0) {
            return [...temp, ...Array(padding).fill(null)]
        }
        return temp;
    }, [transactions, currentPage])

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
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
                    {transactionLogPage.map((t, index) =>
                        t === null ? (
                            <TableRow key={`empty-${index}`}>
                                <TableCell>
                                    -
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow key={t.asset_id + t.executed_at}>
                                <TableCell>{t.asset_ticker}</TableCell>
                                <TableCell>{t.direction}</TableCell>
                                <TableCell>{t.quantity}</TableCell>
                                <TableCell>{t.price_at_execution}</TableCell>
                                <TableCell>{t.quantity * t.price_at_execution}</TableCell>
                                <TableCell>{new Date(t.executed_at).toLocaleString()}</TableCell>
                            </TableRow>
                        )
                    )}
                </TableBody>
            </Table>

            <span>Page {currentPage} of {numPages}</span>

            <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 1}>prev</Button>
            <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))} disabled={currentPage === numPages}>next</Button>
        </div>
    );
}