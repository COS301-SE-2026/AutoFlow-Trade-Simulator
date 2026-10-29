export interface TutorialStep {
    title: string;
    instruction: string;
    elementId: string;
    hint?: string;
    needsClick?: boolean;
}

export interface TutorialDef {
    title: string;
    scenario: string;
    steps: TutorialStep[];
}

export type StrategyTutorialKey = keyof typeof STRATEGY_TUTORIALS;

export const STRATEGY_TUTORIALS: Record<string, TutorialDef> = {
    dca: {
        title: "Dollar Cost Averaging Strategy Tutorial",
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
    buy_and_hold: {
        title: "Buy and Hold Strategy Tutorial",
        scenario:
            "You've decided to invest into TSLA and hold. No timing the bottom, no selling on dips, no chasing rallies. You buy once and let time in the market do the work.",
        steps: [
            {
                title: "Press Play",
                instruction: "Start the replay. Each tick is one trading day of JSE stock data.",
                elementId: "tut-play",
                hint: "Click the Play button",
            },
            {
                title: "Watch the Price",
                instruction: "Buy and hold begins with a single decision: get in. You're not trying to pick the perfect entry - the whole premise is that you won't out-time the market.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Size Your Position",
                instruction: "Unlike Dollar Cost Averaging, you commit your whole position at once. Enter 10 shares for this lump sum",
                elementId: "tut-qty",
                hint: "Change the quantity to continue",
            },
            {
                title: "Place Your Purchase",
                instruction: "Click Buy. This is your one entry - there is no second tranche, no averaging in later.",
                elementId: "tut-buy",
                needsClick: true,
            },
            {
                title: "See Your Position",
                instruction: "Cash drops, shares rise. From here on, you're a holder, not a trader.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Resist the Urge",
                instruction: "Skip ahead. The price will move both ways - that's noise. Buy and Hold means doing nothing until your horizon ends.",
                elementId: "tut-skip",
                hint: "Click Skip Forward",
            },
            {
                title: "Wrap Up",
                instruction: "That's Buy and Hold. One purchase, then patience through the noise. Compounding handles the rest.",
                elementId: "tut-finish",
                needsClick: true,
            },
        ],
    },
    momentum: {
        title: "Momentum Trading",
        scenario: "A stock is in a clear uptrend. You want to ride the momentum, then exit when the trend shows signs of reversing.",
        steps: [
            {
                title: "Press Play",
                instruction: "Start the replay. Watch for a sustained directional move - that's momentum.",
                elementId: "tut-play",
                hint: "Click the Play button",
            },
            {
                title: "Spot the Trend",
                instruction: "Momentum traders look for sustained directional moves - higher highs and higher lows in an uptrend. Don't chase a single candle. Wait for the trend to confirm itself.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Size the Entry",
                instruction: "Enter 10 shares. Position sizing matters - enough on the table to matter, not so much that one reversal wipes you out.",
                elementId: "tut-qty",
                hint: "Change the quantity to continue",
            },
            {
                title: "Ride the Trend",
                instruction: "Click Buy. You're entering in the direction of the trend - not against it. Moment traders never fight the tape.",
                elementId: "tut-buy",
                hint: "Click the Buy button",
            },
            {
                title: "Let It Run",
                instruction: "Skip forward. Momentum doesn't pay in a day. You hold while the trend holds - no scalping, no panic-selling on every decline.",
                elementId: "tut-skip",
                hint: "Click Skip Forward",
            },
            {
                title: "Exit on Reversal",
                instruction: "Sell your position. The trend is fading - holding any longer is hope, not strategy. Cut the trade the moment momentum is gone.",
                elementId: "tut-sell",
                hint: "Click the Sell button",
            },
            {
                title: "Wrap Up",
                instruction: "That's momentum trading. Enter with the trend, hold it while it runs, exit when it reverses. Discipline is the edge.",
                elementId: "tut-finish",
                needsClick: true,
            },
        ],
    },
    mean_reversion: {
        title: "Mean Reversion",
        scenario: "A stock has jumped sharply above its recent average. Mean-reversion traders bet that price will snap back toward the average — not that it will keep running.",
        steps: [
            {
                title: "Press Play",
                instruction: "Start the replay. Watch how price drifts away from its recent average — that deviation is what mean reversion trades.",
                elementId: "tut-play",
                hint: "Click the Play button",
            },
            {
                title: "Spot the Stretch",
                instruction: "Price has pushed well above its recent average. In a ranging market, extremes like this tend to pull back. Traders measure the stretch with a z-score or Bollinger Bands — anything well outside the normal range is a candidate.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Size the Entry",
                instruction: "Enter 10 shares. In mean reversion you size smaller than a trend trader would — the setup fails hard when the market is trending, so the position must be survivable.",
                elementId: "tut-qty",
                hint: "Change the quantity to continue",
            },
            {
                title: "Fade the Extreme",
                instruction: "Click Buy. You're betting the price falls back toward the mean, so you enter against the recent move. This is the opposite of momentum — you're the contrarian in the room.",
                elementId: "tut-buy",
                hint: "Click the Buy button",
            },
            {
                title: "Let the Snapback Play Out",
                instruction: "Skip forward. The trade needs time for price to drift back. Don't bail on the first wiggle — the thesis is the return to the mean, not a quick scalp.",
                elementId: "tut-skip",
                hint: "Click Skip Forward",
            },
            {
                title: "Exit at the Mean",
                instruction: "Sell your position. Price has returned toward the average — that's the target. Take the profit. Holding for more turns a mean-reversion trade into a trend bet you didn't plan for.",
                elementId: "tut-sell",
                hint: "Click the Sell button",
            },
            {
                title: "Wrap Up",
                instruction: "That's mean reversion. Enter when price is stretched, exit when it returns. The strategy has a high win rate but rare large losses — the discipline is cutting the losers before the deviation gets bigger, not holding and hoping.",
                elementId: "tut-finish",
                needsClick: true,
            },
        ],
    },
    covered_call: {
        title: "Covered Call",
        scenario: "You own 100 shares of a stock and think it will stay flat or rise slowly. Selling a call against your shares earns premium income — you get paid to cap your upside.",
        steps: [
            {
                title: "Press Play",
                instruction: "Start the replay. You're going to hold a stock position and layer a call option on top of it. Watch how the price moves before you commit.",
                elementId: "tut-play",
                hint: "Click the Play button",
            },
            {
                title: "Own the Shares",
                instruction: "A covered call needs shares underneath it — that's what 'covered' means. Buy 100 shares first. 100 shares = 1 option contract, so you can sell exactly one call against this position.",
                elementId: "tut-buy",
                hint: "Buy 100 shares to cover the position",
            },
            {
                title: "Pick the Strike",
                instruction: "Sell a call with a strike above the current price — out-of-the-money. You're betting the stock won't rise past that level before expiry. The closer the strike, the more premium you collect but the less room the stock has to move.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Sell the Call",
                instruction: "Sell one call option. The premium lands in your account immediately. That's the whole point of a covered call — you get paid today for agreeing to cap your gains later.",
                elementId: "tut-sell",
                hint: "Sell one call option against your shares",
            },
            {
                title: "Collect the Premium",
                instruction: "Skip forward toward expiry. If the stock stays below the strike, the call expires worthless and you keep the premium. You also keep your shares. That's the ideal outcome — you got paid for doing nothing.",
                elementId: "tut-skip",
                hint: "Click Skip Forward",
            },
            {
                title: "Handle Assignment",
                instruction: "If the stock rose above the strike, the call gets exercised and your shares are called away at the strike price. You still keep the premium, and you still made a profit — it's just capped. That's the trade-off you accepted on step 3.",
                elementId: "tut-chart",
                needsClick: true,
            },
            {
                title: "Wrap Up",
                instruction: "That's a covered call. You own shares, you sell calls against them, you collect premium. You win if the stock stays flat or rises a little. You underperform if it soars — but you get paid every time it doesn't. It's income, not a home run.",
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

export function getStrategyTutorialKey(
    name: string | null | undefined,
): StrategyTutorialKey {
    const n = (name ?? '').toLowerCase();
    if (n.includes('buy') && n.includes('hold')) return 'buy_and_hold';
    if (n.includes('momentum')) return 'momentum';
    if (n.includes('mean reversion')) return 'mean_reversion';
    if (n.includes('covered call')) return 'covered_call';
    return 'dca';
}