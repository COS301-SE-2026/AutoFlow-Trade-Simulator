
const STRATEGY_GUIDES: Record<string, string[]> = {
    'mean reversion': [
        'Buy when the price dips below its recent average — that is your edge.',
        'Sell when the price rallies above its recent average — do not get greedy.',
        'Do not chase momentum. If price is rising, wait for the pullback.',
        'Close your positions before the end. Mean reversion is not buy-and-hold.',
    ],
};

export function getPuzzleGuide(strategyName: string): string[] | null {
    const n = strategyName.toLowerCase();
    const key = Object.keys(STRATEGY_GUIDES).find(k => n.includes(k));
    return key ? STRATEGY_GUIDES[key] : null;
}