'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { DollarSign } from 'lucide-react';

export function PortfolioTotalValue({ accountId }: { accountId: number | null }) {
    const { totalValue, currencyCode } = usePortfolio(accountId);

    return (
        <div className='rounded-xl p-6 border border-border/60' style={{ background: 'var(--panel' }}>
            <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 rounded-lg' style={{ background: 'var(--panel' }}>
                    <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <span style={{ color: 'var(--muted' }}>Total Value</span>
            </div>
            <div className='text-3xl font-bold' style={{ color: 'var(--text' }}>
                <div>{totalValue} {currencyCode}</div>
            </div>
        </div>

    );
}