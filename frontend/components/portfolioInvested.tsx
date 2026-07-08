'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Activity } from 'lucide-react';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { investedValue, currencyCode, numHoldings } = usePortfolio(accountId);

    return (
        <div>
            <Activity className="w-5 h-5 text-green-400" />
            <div>Invested</div>
            <div>{investedValue} {currencyCode}</div>
            <div>Across {numHoldings} positions</div>
        </div>
    );
}