'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Activity } from 'lucide-react';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { investedValue, currencyCode, numHoldings } = usePortfolio(accountId);

    return (
        <div className='rounded-xl p-6 border border-border/60' style={{ background: 'var(--panel' }}>
            <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 rounded-lg' style={{ background: 'var(--panel' }}>
                    <Activity className="w-5 h-5 text-green-400" />
                </div>
                <span style={{ color: 'var(--muted' }}>Invested</span>
            </div>
            <div className='text-3xl font-bold' style={{ color: 'var(--text' }}>
                <div>{investedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}</div>
            </div>
            <div className='text-sm mt-2' style={{ color: 'var(--muted' }}>
                Across {numHoldings} positions
            </div>
        </div>
    );
}