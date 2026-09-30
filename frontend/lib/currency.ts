export const ZAR_TO_CURRENCY_RATES: Record<string, number> = {
    ZAR: 1,
    USD: 0.0610,
    EUR: 0.0536,
    GBP: 0.0460,
    JPY: 9.57,
    CNY: 0.4094,
    AUD: 0.0869,
    CAD: 0.0864,
    CHF: 0.0507,
    SGD: 0.0780,
    SEK: 0.6070,
    KRW: 82.84,
    NOK: 0.5800,
    NZD: 0.1076,
    INR: 5.86,
    MXN: 1.0840,
    TWD: 1.9600,
    BRL: 0.3173,
    DKK: 0.4020,
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