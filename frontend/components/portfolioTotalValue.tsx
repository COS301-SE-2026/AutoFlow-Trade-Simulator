'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export function PortfolioTotalValue({ accountId }: { accountId: number | null }) {
    const { totalValue, currencyCode, profitLoss, profitLossPercent } = usePortfolio(accountId);

    const isPositive = profitLoss >= 0;

    return (
        <div className='rounded-xl p-6 border border-border/60' style={{ background: 'var(--panel)' }}>
            <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 rounded-lg'>
                    <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <span style={{ color: 'var(--muted)' }}>Total Value</span>
            </div>
            <div className='text-3xl font-bold' style={{ color: 'var(--text)' }}>
                <div>{currencyCode} {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                <span>{isPositive ? '+' : ''}{profitLossPercent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
            </div>
        </div>
    );
}