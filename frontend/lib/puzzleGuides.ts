const STRATEGY_GUIDES: Record<string, string[]> = {
    'buy and hold': [
        'Enter a meaningful position early and hold it for the entire puzzle.',
        'Ignore daily volatility — drawdowns are noise, not exit signals.',
        'Never sell on dips. The whole edge is patience through the storm.',
        'Do not add to the position. Buy and Hold means one entry, then discipline.',
    ],
    'dollar-cost': [
        'Buy a fixed rand amount at regular intervals — say every 5 trading days.',
        'Keep the cash amount consistent, not the share count. That is the whole mechanism.',
        'Ignore the price direction. Commit to the schedule whether it rises or falls.',
        'Do not sell. DCA is a pure accumulation strategy.',
    ],
    'dollar cost': [  // same rules, handles names without a hyphen
        'Buy a fixed rand amount at regular intervals — say every 5 trading days.',
        'Keep the cash amount consistent, not the share count. That is the whole mechanism.',
        'Ignore the price direction. Commit to the schedule whether it rises or falls.',
        'Do not sell. DCA is a pure accumulation strategy.',
    ],
    dca: [  // alias in case the display name is abbreviated
        'Buy a fixed rand amount at regular intervals — say every 5 trading days.',
        'Keep the cash amount consistent, not the share count. That is the whole mechanism.',
        'Ignore the price direction. Commit to the schedule whether it rises or falls.',
        'Do not sell. DCA is a pure accumulation strategy.',
    ],
    momentum: [
        'Wait for a confirmed uptrend before entering — higher highs and higher lows.',
        'Enter in the direction of the trend. Never fight the tape.',
        'Hold while the trend holds. Cut the moment structure breaks — do not hold losers.',
        'Let winners run. Small pullbacks are noise; a break of structure is your exit.',
    ],
    'mean reversion': [
        'Buy when the price dips below its recent average — that is your edge.',
        'Sell when the price rallies above its recent average — do not get greedy.',
        'Do not chase momentum. If price is rising, wait for the pullback.',
        'Close your positions before the end. Mean reversion is not buy-and-hold.',
    ],
    'profit taking': [
        'Enter a meaningful position early in the puzzle.',
        'Sell a fixed fraction (e.g. 25%) at regular intervals, not all at once.',
        'Keep at least 30% of your position invested at the end — do not fully exit.',
        'Harvest gains as they come. Do not wait for the perfect top.',
    ],
};

export function getPuzzleGuide(strategyName: string): string[] | null {
    const n = (strategyName ?? '').toLowerCase();

    // Exact match first (so 'dca' doesn't lose to 'dollar-cost' if both exist)
    if (STRATEGY_GUIDES[n]) return STRATEGY_GUIDES[n];

    // Then longest-key substring match (so 'profit taking' wins over 'dca')
    const key = Object.keys(STRATEGY_GUIDES)
        .sort((a, b) => b.length - a.length)
        .find((k) => n.includes(k));

    return key ? STRATEGY_GUIDES[key] : null;
}