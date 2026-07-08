'use client';
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioCashBalance({ accountId }: { accountId: number | null }) {
    const { activeAccount } = usePortfolio(accountId);

    return (
        <div>
            <div>Cash Balance</div>
            <div>{activeAccount?.balance} {activeAccount?.currency_code}</div>
            <div>Available for trading</div>
        </div>
    );
}