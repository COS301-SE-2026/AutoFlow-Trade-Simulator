'use client';
import { useAccount } from '@/lib/hooks/accountContext';
import { useHoldings } from '@/hooks/useHoldings';
import { useMemo } from 'react';

export function PortfolioInvested({ accountId }: { accountId: number | null }) {
    const { activeAccount } = useAccount();
    const { holdings, loading, error } = useHoldings(accountId);

    const sumHoldings = useMemo(() => {
        let temp = 0;
        for (let index = 0; index < holdings.length; index++) {
            const holding = holdings[index];
            temp += holding.current_price * holding.net_quantity;
        }
        return temp;
    }, [holdings]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <div>Invested</div>
            <div>{sumHoldings} {activeAccount?.currency_code}</div>
            <div>Across {holdings.length} positions</div>
        </div>
    );
}