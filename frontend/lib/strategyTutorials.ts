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
