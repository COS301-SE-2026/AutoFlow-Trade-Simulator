'use client';
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { investedValue, currencyCode, numHoldings } = usePortfolio(accountId);

    return (
        <div>
            <div>Invested</div>
            <div>{investedValue} {currencyCode}</div>
            <div>Across {numHoldings} positions</div>
        </div>
    );
}