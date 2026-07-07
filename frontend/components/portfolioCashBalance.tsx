'use client';
import { useAccount } from '@/lib/hooks/accountContext';
import { TradingAuthPrompt } from "@/components/tradingAuthPrompt";

export function PortfolioCashBalance() {
    const { activeAccount } = useAccount();

    if (!activeAccount) {
        return (
            <TradingAuthPrompt />
        )
    }

    return (
        <div>
            <div>Cash Balance</div>
            <div>{activeAccount?.balance} {activeAccount?.currency_code}</div>
            <div>Available for trading</div>
        </div>
    );
}