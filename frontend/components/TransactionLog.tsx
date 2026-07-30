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
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from 'react';

export function TransactionLog({ accountId }: { accountId: number | null }) {
    const { transactions, loading, error } = useTransactions(accountId);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [tickerFilter, setTickerFilter] = useState('');
    const [directionFilter, setDirectionFilter] = useState<'all' | 'buy' | 'sell'>('all');
    const [dateStartFilter, setDateStartFilter] = useState('');
    const [dateEndFilter, setDateEndFilter] = useState('');

    const filteredTransaction = useMemo(() => {
        let temp = transactions;
        if (temp === null) {
            temp = [];
        }

        if (tickerFilter !== '') {
            temp = temp.filter(t => t.asset_ticker.toLocaleLowerCase().includes(tickerFilter.toLocaleLowerCase()));
        }

        if (directionFilter !== 'all') {
            temp = temp.filter(t => t.direction === directionFilter);
        }

        if (dateStartFilter !== '') {
            temp = temp.filter(t => new Date(t.executed_at) >= new Date(dateStartFilter));
        }

        if (dateEndFilter !== '') {
            temp = temp.filter(t => new Date(t.executed_at) <= new Date(dateEndFilter));
        }

        return temp;
    }, [transactions, tickerFilter, directionFilter, dateStartFilter, dateEndFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [transactions, tickerFilter, directionFilter, dateStartFilter, dateEndFilter]);

    const numPages = Math.max(Math.ceil(filteredTransaction.length / pageSize), 1);

    const pagedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const temp = filteredTransaction.slice(startIndex, endIndex);

        const padding = pageSize - temp.length;
        if (padding > 0) {
            return [...temp, ...Array(padding).fill(null)]
        }
        return temp;
    }, [filteredTransaction, currentPage, pageSize])

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <div>
                <Input
                    placeholder="Search by ticker..."
                    value={tickerFilter}
                    onChange={(e) => setTickerFilter(e.target.value)}

                    className="pl-9 w-[400px]"
                    style={{
                        backgroundColor: 'var(--panel)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                    }}
                />

                <div className="flex gap-2">
                    <Input
                        placeholder="Start date"
                        type="date"
                        value={dateStartFilter}
                        onChange={(e) => setDateStartFilter(e.target.value)}

                        className="w-[150px]"
                        style={{
                            backgroundColor: 'var(--panel)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                        }}
                    />
                    <Input
                        placeholder="End date"
                        type="date"
                        value={dateEndFilter}
                        onChange={(e) => setDateEndFilter(e.target.value)}

                        className="w-[150px]"
                        style={{
                            backgroundColor: 'var(--panel)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                        }}
                    />
                </div>

                <Select
                    value={directionFilter}
                    onValueChange={(value: 'all' | 'buy' | 'sell') => setDirectionFilter(value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='buy'>Buy</SelectItem>
                        <SelectItem value='sell'>Sell</SelectItem>
                    </SelectContent>
                </Select>
            </div>

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
                    {pagedTransactions.map((t, index) =>
                        t === null ? (
                            <TableRow key={`empty-${index}`}>
                                <TableCell>
                                    -
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow key={t.asset_id + t.executed_at}>
                                <TableCell>{t.asset_ticker}</TableCell>
                                <TableCell>
                                    <span className="capitalize" style={{ color: t.direction === 'buy' ? 'var(--green)' : 'var(--red)' }}> {t.direction}</span>
                                </TableCell>
                                <TableCell>{t.quantity}</TableCell>
                                <TableCell>{t.price_at_execution}</TableCell>
                                <TableCell>{t.quantity * t.price_at_execution}</TableCell>
                                <TableCell>{new Date(t.executed_at).toLocaleString()}</TableCell>
                            </TableRow>
                        )
                    )}
                </TableBody>
            </Table>

            <div className='flex justify-center gap-4'>
                <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>prev</Button>
                Page {currentPage} of {numPages}
                <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))} disabled={currentPage === numPages}>next</Button>
            </div>
        </div>
    );
}