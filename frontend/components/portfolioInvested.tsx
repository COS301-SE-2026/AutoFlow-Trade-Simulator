'use client';
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { investedValue, holdings, activeAccount } = usePortfolio(accountId);

    return (
        <div>
            <div>Invested</div>
            <div>{investedValue} {activeAccount?.currency_code}</div>
            <div>Across {holdings.length} positions</div>
        </div>
    );
}