'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PieChart } from 'lucide-react';

export function PortfolioCashBalance({ accountId }: { accountId: number | null }) {
    const { cashBalance, currencyCode } = usePortfolio(accountId);

    return (
        <div className='rounded-xl p-6 border border-border/60' style={{ background: 'var(--panel' }}>
            <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 rounded-lg' style={{ background: 'var(--panel' }}>
                    <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <span style={{ color: 'var(--muted' }}>Cash Balance</span>
            </div>
            <div className='text-3xl font-bold' style={{ color: 'var(--text' }}>
                <div>{currencyCode} {cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className='text-sm mt-2' style={{ color: 'var(--muted' }}>
                Available for trading
            </div>
        </div>
    );
}