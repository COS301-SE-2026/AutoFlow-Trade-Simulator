export const ZAR_TO_CURRENCY_RATES: Record<string, number> = {
    ZAR: 1,
    USD: 0.0610,
    EUR: 0.0536,
    GBP: 0.0460,
    JPY: 0.1047,
    CNY: 0.4078,
    AUD: 0.0870,
    CAD: 0.0861,
    CHF: 0.0506,
    SGD: 0.0781,
    SEK: 0.6067,
    KRW: 0.0120,
    NOK: 0.5800,
    NZD: 0.1074,
    INR: 0.1703,
    MXN: 0.9204,
    TWD: 0.5141,
    BRL: 0.3166,
    DKK: 0.4015,
};


export function convertCurrency(
    amount: number,
    from: string,
    to: string
): number | null {
    const fromRate = ZAR_TO_CURRENCY_RATES[from.toUpperCase()];
    const toRate = ZAR_TO_CURRENCY_RATES[to.toUpperCase()];
    if (fromRate === undefined || toRate === undefined) return null;
    if (fromRate === 0) return null;
    return amount * (toRate / fromRate);
}