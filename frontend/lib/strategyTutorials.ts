export interface TutorialStep {
    title: string;
    instruction: string;
    elementId: string;
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
            title: "Select Your Asset",
            instruction: "Choose the stock or ETF you want to accumulate over time. For DCA, pick a broad-market ETF or blue-chip you are comfortable holding through volatility.",
            elementId: "asset",
        },
        {
            title: "Set the Monthly Amount", 
            instruction: "Enter the fixed rand amount you will invest every period. R2,000/month deployed consistently beats attempting to time dips - the math is on your side.",
            elementId: "amount",
        },
        {
            title: "Choose Frequency", 
            instruction: "Enter the fixed rand amount you will invest every period. R2,000/month deployed consistently beats attempting to time dips - the math is on your side.",
            elementId: "frequency",
        },
        {
            title: "Review the Plan", 
            instruction: "Enter the fixed rand amount you will invest every period. R2,000/month deployed consistently beats attempting to time dips - the math is on your side.",
            elementId: "summary",
        },
        {
            title: "Activate Recurring Buy", 
            instruction: "Submit the schedule.",
            elementId: "action",
        },
    ],
},
}
