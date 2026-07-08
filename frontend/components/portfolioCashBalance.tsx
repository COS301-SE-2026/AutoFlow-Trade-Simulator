'use client';
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioCashBalance({ accountId }: { accountId: number | null }) {
    const { cashBalance, currencyCode } = usePortfolio(accountId);

    return (
        <div>
            <div>Cash Balance</div>
            <div>{cashBalance} {currencyCode}</div>
            <div>Available for trading</div>
        </div>
    );
}