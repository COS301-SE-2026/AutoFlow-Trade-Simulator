'use client';
import { useAccount } from '@/lib/hooks/accountContext';
import { useHoldings } from '@/hooks/useHoldings';
import { useMemo } from 'react';

export function usePortfolio(accountId: number | null) {
    const { activeAccount } = useAccount();
    const { holdings } = useHoldings(accountId);

    const cashBalance = Number(activeAccount?.balance);

    const investedValue = useMemo(() => {
        let temp = 0;
        for (let index = 0; index < holdings.length; index++) {
            const holding = holdings[index];
            temp += holding.current_price * holding.net_quantity;
        }
        return temp;
    }, [holdings]);

    const totalValue = cashBalance + investedValue;

    return { totalValue, cashBalance, investedValue, holdings, activeAccount };
}