'use client';
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioTotalValue({ accountId }: { accountId: number | null }) {
    const { totalValue } = usePortfolio(accountId);

    return (
        <div>
            <div>Total Value</div>
            <div>{totalValue}</div>
        </div>
    );
}