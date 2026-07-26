'use client';

import { apiClient, ApiError } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface StrategyDetail {
    id: number,
    name: string,
    level: string,
    category: string,
    description: string,

    steps: string[],
    pros: string[],
    cons: string[]
}

const MOCK_STRATEGY_DETAILS: Record<number, StrategyDetail> = {
    1: {
        id: 1,
        name: 'Dollar-Cost Averaging',
        level: 'Beginner',
        category: 'Investing',
        description: 'Invest a fixed dollar amount at regular intervals regardless of price — smoothing out volatility over time and removing emotional timing decisions.',
        steps: [
            'Choose a target asset (e.g., SPY, BTC, AAPL)',
            'Set a fixed dollar amount per interval (e.g., $200/week)',
            'Schedule recurring purchases regardless of price',
            'Reinvest any dividends received',
            'Review allocation every quarter — not daily',
        ],
        pros: [
            'Removes emotional decision-making',
            'Benefits from market dips',
            'Low effort once configured',
        ],
        cons: [
            'Underperforms lump-sum in bull markets',
            'Requires consistent capital',
            'May feel slow during rallies',
        ],
    },
    2: {
        id: 2,
        name: 'Covered Call',
        level: 'Intermediate',
        category: 'Options',
        description: 'Generate income by selling call options on shares you already own. Ideal when you expect the stock to trade sideways or rise modestly.',
        steps: [
            'Own at least 100 shares of the underlying stock',
            'Choose an expiration date 30–45 days out (theta decay sweet spot)',
            'Sell a call at a strike 5–10% above current price',
            'Collect the premium immediately as income',
            'Let the option expire worthless OR buy it back before expiry',
        ],
        pros: [
            'Generates passive income on held positions',
            'Reduces effective cost basis',
            'Defined max gain known upfront',
        ],
        cons: [
            'Caps upside if stock rallies hard',
            'Still exposed to downside on shares',
            'Assignment risk',
        ],
    },
    3: {
        id: 3,
        name: 'Iron Condor',
        level: 'Advanced',
        category: 'Options',
        description: 'Profit when an underlying asset stays within a defined price range. Combines a bull put spread and a bear call spread for a net credit.',
        steps: [
            'Sell an OTM put (e.g., $480 strike on SPY at $500)',
            'Buy a further OTM put to cap downside risk (e.g., $470)',
            'Sell an OTM call (e.g., $520 strike)',
            'Buy a further OTM call to cap upside risk (e.g., $530)',
            'Collect net premium — max profit if SPY stays between $480–$520',
        ],
        pros: [
            'Profits from low volatility',
            'Defined risk and reward',
            'Four-leg hedge limits catastrophic loss',
        ],
        cons: [
            'Limited profit potential',
            'Requires active management',
            'Commissions on 4 legs',
        ],
    },
    4: {
        id: 4,
        name: 'Momentum Trading',
        level: 'Intermediate',
        category: 'Technical',
        description: 'Buy assets trending strongly upward and sell those trending down, riding price momentum rather than fighting it.',
        steps: [
            'Screen for stocks up 20%+ over the past 3–6 months',
            'Confirm trend with RSI > 60 and price above 50-day MA',
            'Enter on pullbacks to the 10-day or 20-day moving average',
            'Set a stop-loss 8% below entry to control downside',
            'Exit when RSI drops below 50 or price breaks moving average',
        ],
        pros: [
            'Works well in trending markets',
            'Clear entry/exit signals',
            'Can yield outsized returns quickly',
        ],
        cons: [
            'Sharp reversals trigger stop-losses often',
            'Underperforms in sideways markets',
            'Requires daily monitoring',
        ],
    },
    5: {
        id: 5,
        name: 'Pairs Trading',
        level: 'Advanced',
        category: 'Quantitative',
        description: 'A market-neutral strategy that exploits temporary divergences between two historically correlated assets by going long one and short the other.',
        steps: [
            'Identify two highly correlated stocks (e.g., Ford and GM)',
            'Calculate the historical spread between them',
            'Enter when spread widens beyond 2 standard deviations',
            'Long the underperformer, short the outperformer simultaneously',
            'Close both positions when spread reverts to the mean',
        ],
        pros: [
            'Market-neutral — works in any direction',
            'Statistical edge when correlation holds',
            'Hedged against broad market moves',
        ],
        cons: [
            'Correlation can permanently break',
            'Requires short-selling access',
            'Complex to monitor',
        ],
    },
    6: {
        id: 6,
        name: 'Protective Put',
        level: 'Beginner',
        category: 'Options',
        description: 'Buy a put option on a stock you own to insure against a significant decline — like portfolio insurance with a defined premium cost.',
        steps: [
            'Own shares of a stock you want to protect',
            'Buy a put option at or slightly below current price',
            'Choose expiration matching your risk horizon (60–90 days)',
            'Pay the premium as your "insurance cost"',
            'If stock falls below strike, the put gains in value to offset losses',
        ],
        pros: [
            'Hard floor on potential losses',
            'Keeps full upside participation',
            'Peace of mind during volatile periods',
        ],
        cons: [
            'Premium cost reduces overall return',
            'Time decay works against you',
            'Needs renewal as options expire',
        ],
    },
};

export function useStrategy(id: number | null) {
    const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/simulation/strategies/${id}`);
            setStrategy(response);
        } catch (error: any) {
            if (error instanceof ApiError && error.status === 401) {
                setStrategy(null);
            }
            else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);
    useEffect(() => { fetch(); }, [fetch]);

    return { strategy, loading, error, refetch: fetch }
}