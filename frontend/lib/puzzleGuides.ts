
const STRATEGY_GUIDES: Record<string, string[]> = {
    'dollar-cost averaging': [
        'Invest a fixed rand amount at regular invervals - regardless of the price.',
        'Do not try to time the market, consistency is the edge.',
        'Hold through any dip. Do not panic sell into weakness.',
        'Aim for at least 4 - 5 purchases spread evenly across the period.'
    ],
};

export function getPuzzleGuide(strategyName: string): string | null {
    const n = strategyName.toLowerCase();
    const key = Object.keys(STRATEGY_GUIDES).find(k => n.includes(k));
    return key ? STRATEGY_GUIDES[key] : null;
}