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
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
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

    if (loading) return <p aria-busy="true" className="py-8 text-sm text-[var(--muted)]">Loading...</p>;
    if (error) return <p role="alert" className="py-8 text-sm text-[#ff6b72]">{error}</p>;

    const fieldLabel = 'text-xs font-medium text-white/55';
    const fieldInput = 'h-10 border-white/10 bg-white/[0.04] text-white';
    const hasFilters = tickerFilter !== '' || directionFilter !== 'all' || dateStartFilter !== '' || dateEndFilter !== '';
    const num = 'text-right tabular-nums';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-[220px] flex-1 flex-col gap-1.5 md:max-w-[360px]">
                    <label htmlFor="tx-ticker" className={fieldLabel}>Ticker</label>
                    <div className="relative">
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <Input
                            id="tx-ticker"
                            type="search"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="Search by ticker..."
                            value={tickerFilter}
                            onChange={(e) => setTickerFilter(e.target.value)}
                            className={`${fieldInput} pl-9`}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="tx-from" className={fieldLabel}>From</label>
                    <Input
                        id="tx-from"
                        placeholder="Start date"
                        type="date"
                        value={dateStartFilter}
                        onChange={(e) => setDateStartFilter(e.target.value)}
                        className={`${fieldInput} w-[160px] [color-scheme:dark]`}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="tx-to" className={fieldLabel}>To</label>
                    <Input
                        id="tx-to"
                        placeholder="End date"
                        type="date"
                        value={dateEndFilter}
                        onChange={(e) => setDateEndFilter(e.target.value)}
                        className={`${fieldInput} w-[160px] [color-scheme:dark]`}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span id="tx-direction-label" className={fieldLabel}>Direction</span>
                    <Select
                        value={directionFilter}
                        onValueChange={(value: 'all' | 'buy' | 'sell') => setDirectionFilter(value)}
                    >
                        <SelectTrigger aria-labelledby="tx-direction-label" className={`${fieldInput} w-[130px]`}>
                            <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All</SelectItem>
                            <SelectItem value='buy'>Buy</SelectItem>
                            <SelectItem value='sell'>Sell</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={() => { setTickerFilter(''); setDirectionFilter('all'); setDateStartFilter(''); setDateEndFilter(''); }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                        <X aria-hidden="true" className="h-4 w-4" />
                        Clear filters
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[var(--border)] hover:bg-transparent">
                            <TableHead>Ticker</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead className={num}>Quantity</TableHead>
                            <TableHead className={num}>Price</TableHead>
                            <TableHead className={num}>Total</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagedTransactions.map((t, index) =>
                            t === null ? (
                                <TableRow key={`empty-${index}`} aria-hidden="true" className="border-[var(--border)] hover:bg-transparent">
                                    <TableCell className="text-white/20">-</TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={t.asset_id + t.executed_at} className="border-[var(--border)]">
                                    <TableCell className="font-mono font-semibold tracking-wider" translate="no">{t.asset_ticker}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                t.direction === 'buy'
                                                    ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]'
                                                    : 'bg-[rgba(237,28,36,0.15)] text-[#ff6b72]'
                                            }`}
                                        >
                                            {t.direction}
                                        </span>
                                    </TableCell>
                                    <TableCell className={num}>{t.quantity}</TableCell>
                                    <TableCell className={num}>{t.price_at_execution}</TableCell>
                                    <TableCell className={`${num} font-medium`}>{t.quantity * t.price_at_execution}</TableCell>
                                    <TableCell className="whitespace-nowrap text-white/60">{new Date(t.executed_at).toLocaleString()}</TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </div>

            <nav aria-label="Transaction pages" className="flex items-center justify-center gap-3 text-sm">
                <Button
                    variant="ghost"
                    className="h-9 gap-1 border border-white/10 bg-transparent px-3 text-white/80 hover:bg-white/[0.05] hover:text-white"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Prev
                </Button>
                <span className="tabular-nums text-white/60">Page {currentPage} of {numPages}</span>
                <Button
                    variant="ghost"
                    className="h-9 gap-1 border border-white/10 bg-transparent px-3 text-white/80 hover:bg-white/[0.05] hover:text-white"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                    disabled={currentPage === numPages}
                >
                    Next
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Button>
            </nav>
        </div>
    );
}
