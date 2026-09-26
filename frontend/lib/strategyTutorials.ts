export interface TutorialStep {
    title: string;
    instruction: string;
    elementId: string;
    hint?: string;
    needsClick?: boolean;
}

export interface TutorialDef {
    scenario: string;
    steps: TutorialStep[];
}

export const STRATEGY_TUTORIALS: Record<string, TutorialDef> = {
    dca: {
        scenario: "You have R2,000/month to invest and want to build a long-term AAPL position without trying to time the market.",
    steps: [
        { 
            title: "Press Play",
            instruction: "Start the replay. Each tick is one trading day of SHN.",
            elementId: "tut-play",
            hint: "Click the Play button",
        },
        {
            title: "Watch the Price", 
            instruction: "Enter the fixed rand amount you will invest every period. R2,000/month deployed consistently beats attempting to time dips - the math is on your side.",
            elementId: "tut-chart",
            needsClick: true,
        },
        {
            title: "Choose Quantity", 
            instruction: "DCA uses a fixed rand amount each period. Because price changes, share count varies. Enter 10 shares for this purchase.",
            elementId: "tut-qty",
            hint: "Change the quantity to continue",
        },
        {
            title: "Place Your Purchase", 
            instruction: "Click Buy. This is your scheduled purchase - same time, same amount, every period.",
            elementId: "tut-buy",
            hint: "Click the Buy button",
        },
        {
            title: "See Your Position", 
            instruction: "Your cash drops, your shares rise. This is what disciplined accumulation looks like.",
            elementId: "tut-chart",
            needsClick: true,
        },
        {
            title: "Advance Time", 
            instruction: "Skip forward to your next buy window and repeat the process.",
            elementId: "tut-skip",
            hint: "Click Skip Forward",
        },
        {
            title: "Wrap Up", 
            instruction: "That's DCA. Consistent purchases, no market timing, compounding over time.",
            elementId: "tut-finish",
            needsClick: true,
        },
    ],
},
}

export interface MockBar {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export const MOCK_AAPL_BARS: MockBar[] = [
    { timestamp: '2023-01-03T00:00:00.000Z', open: 177.80, high: 179.20, low: 177.50, close: 178.50, volume: 54_300_000 },
    { timestamp: '2023-01-04T00:00:00.000Z', open: 178.60, high: 180.10, low: 178.30, close: 179.20, volume: 51_200_000 },
    { timestamp: '2023-01-05T00:00:00.000Z', open: 179.10, high: 179.40, low: 177.30, close: 177.85, volume: 62_400_000 },
    { timestamp: '2023-01-06T00:00:00.000Z', open: 178.00, high: 180.55, low: 177.80, close: 180.10, volume: 58_100_000 },
    { timestamp: '2023-01-09T00:00:00.000Z', open: 180.30, high: 181.80, low: 180.10, close: 181.35, volume: 49_700_000 },
    { timestamp: '2023-01-10T00:00:00.000Z', open: 181.20, high: 181.50, low: 179.40, close: 179.90, volume: 55_900_000 },
    { timestamp: '2023-01-11T00:00:00.000Z', open: 180.10, high: 182.70, low: 179.95, close: 182.40, volume: 60_300_000 },
    { timestamp: '2023-01-12T00:00:00.000Z', open: 182.60, high: 183.45, low: 182.10, close: 183.15, volume: 47_800_000 },
    { timestamp: '2023-01-13T00:00:00.000Z', open: 183.00, high: 183.30, low: 181.40, close: 181.75, volume: 53_100_000 },
    { timestamp: '2023-01-17T00:00:00.000Z', open: 182.00, high: 184.55, low: 181.85, close: 184.20, volume: 57_600_000 },
    { timestamp: '2023-01-18T00:00:00.000Z', open: 184.40, high: 185.95, low: 184.10, close: 185.60, volume: 52_900_000 },
    { timestamp: '2023-01-19T00:00:00.000Z', open: 185.50, high: 185.80, low: 183.55, close: 183.90, volume: 61_200_000 },
    { timestamp: '2023-01-20T00:00:00.000Z', open: 184.10, high: 186.80, low: 183.95, close: 186.45, volume: 59_400_000 },
    { timestamp: '2023-01-23T00:00:00.000Z', open: 186.60, high: 187.50, low: 186.20, close: 187.20, volume: 48_500_000 },
    { timestamp: '2023-01-24T00:00:00.000Z', open: 187.10, high: 187.40, low: 185.40, close: 185.80, volume: 56_700_000 },
    { timestamp: '2023-01-25T00:00:00.000Z', open: 186.00, high: 188.65, low: 185.90, close: 188.30, volume: 54_100_000 },
    { timestamp: '2023-01-26T00:00:00.000Z', open: 188.50, high: 189.85, low: 188.15, close: 189.55, volume: 50_800_000 },
    { timestamp: '2023-01-27T00:00:00.000Z', open: 189.40, high: 189.70, low: 187.55, close: 187.95, volume: 63_200_000 },
    { timestamp: '2023-01-30T00:00:00.000Z', open: 188.20, high: 190.55, low: 188.05, close: 190.20, volume: 57_900_000 },
    { timestamp: '2023-01-31T00:00:00.000Z', open: 190.40, high: 192.10, low: 190.15, close: 191.85, volume: 55_500_000 },
];
