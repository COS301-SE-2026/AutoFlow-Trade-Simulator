'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { DollarSign } from 'lucide-react';

export function PortfolioTotalValue({ accountId }: { accountId: number | null }) {
    const { totalValue, currencyCode } = usePortfolio(accountId);

    return (
        <div>
            <DollarSign className="w-5 h-5 text-blue-400" />
            <div>Total Value</div>
            <div>{totalValue}{currencyCode}</div>
        </div>
    );
}