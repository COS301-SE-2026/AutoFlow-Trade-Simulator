'use client';
import { useAccount } from '@/lib/hooks/accountContext';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { activeAccount } = useAccount();

    return (
        <div>
            {activeAccount?.balance} {activeAccount?.currency_code}
        </div>
    );
}