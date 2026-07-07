'use client';
import { useAccount } from '@/lib/hooks/accountContext';

export function PortfolioCashBalance({ accountId }: { accountId: number | null }) {
    const { activeAccount } = useAccount();

    return (
        <div>
            <div>Cash Balance</div>
            <div>{activeAccount?.balance} {activeAccount?.currency_code}</div>
            <div>Available for trading</div>
        </div>
    );
}