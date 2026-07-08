'use client';
import { useAccount } from '@/lib/hooks/accountContext';
import { useHoldings } from '@/hooks/useHoldings';
import { useMemo } from 'react';

export function usePortfolio(accountId: number | null) {
    const { activeAccount } = useAccount();
    const { holdings } = useHoldings(accountId);

    const cashBalance = Number(activeAccount?.balance);

    const currencyCode = activeAccount?.currency_code;

    const investedValue = useMemo(() => {
        let temp = 0;
        for (let index = 0; index < holdings.length; index++) {
            const holding = holdings[index];
            temp += holding.current_price * holding.net_quantity;
        }
        return temp;
    }, [holdings]);

    const totalValue = cashBalance + investedValue;

    const numHoldings = holdings.length;

    const totalCost = useMemo(() => {
        let temp = 0;
        for (let index = 0; index < holdings.length; index++) {
            const holding = holdings[index];
            temp += holding.average_cost * holding.net_quantity;
        }
        return temp;
    }, [holdings]);
    const profitLoss = investedValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return { cashBalance, currencyCode, investedValue, totalValue, numHoldings, activeAccount, holdings, profitLoss, profitLossPercent };
}