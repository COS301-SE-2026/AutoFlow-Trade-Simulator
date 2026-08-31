export interface GreekValues {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}

export type OptionType = 'call' | 'put';

const DIRECTION_ERROR = "option_type must be 'call' or 'put'";

function normal_pdf(value: number): number {
    return Math.exp(-0.5 * value ** 2) / Math.sqrt(2 * Math.PI);
}

function erf(x: number): number {
    // theres no built in error function inside javascript
    // Abramowitz and Stegun formula 
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * absX);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return sign * y;
}

function normal_cdf(value: number): number {
    return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

function calc_d1(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number): number {
    return (Math.log(current_price / strike_price) + (interest_rate + 0.5 * sigma ** 2) * time_to_expire) / (sigma * Math.sqrt(time_to_expire));
}

function calc_d2(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number): number {
    return calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma) - sigma * Math.sqrt(time_to_expire);
}

function delta(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number, option_type: OptionType = 'call'): number {
    const d1 = calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma);
    if (option_type === 'call') return normal_cdf(d1);
    if (option_type === 'put') return normal_cdf(d1) - 1;
    throw new Error(DIRECTION_ERROR);
}

function gamma(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number): number {
    const d1 = calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma);
    return normal_pdf(d1) / (current_price * sigma * Math.sqrt(time_to_expire));
}

function theta(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number, option_type: OptionType = 'call'): number {
    const d1 = calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma);
    const d2 = calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma);
    const term1 = -(current_price * normal_pdf(d1) * sigma) / (2 * Math.sqrt(time_to_expire));

    if (option_type === 'call') {
        const term2 = interest_rate * strike_price * Math.exp(-interest_rate * time_to_expire) * normal_cdf(d2);
        return term1 - term2;
    }
    if (option_type === 'put') {
        const term2 = interest_rate * strike_price * Math.exp(-interest_rate * time_to_expire) * normal_cdf(-d2);
        return term1 + term2;
    }
    throw new Error(DIRECTION_ERROR);
}

function vega(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number): number {
    const d1 = calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma);
    return current_price * normal_pdf(d1) * Math.sqrt(time_to_expire);
}

function rho(current_price: number, strike_price: number, time_to_expire: number, interest_rate: number, sigma: number, option_type: OptionType = 'call'): number {
    const d2 = calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma);
    if (option_type === 'call') {
        return strike_price * time_to_expire * Math.exp(-interest_rate * time_to_expire) * normal_cdf(d2);
    }
    if (option_type === 'put') {
        return -strike_price * time_to_expire * Math.exp(-interest_rate * time_to_expire) * normal_cdf(-d2);
    }
    throw new Error(DIRECTION_ERROR);
}

const TRADING_DAYS_PER_YEAR = 252;
const MIN_SIGMA = 0.01;

export function calc_realized_volatility(prices: number[], window: number = 20, trading_days_per_year: number = TRADING_DAYS_PER_YEAR): number {
    const valid_prices = prices.filter((p) => p > 0);
    const windowed_prices = valid_prices.slice(-(window + 1));

    if (windowed_prices.length < 3) {
        return MIN_SIGMA;
    }

    const log_returns: number[] = [];
    for (let i = 1; i < windowed_prices.length; i++) {
        log_returns.push(Math.log(windowed_prices[i] / windowed_prices[i - 1]));
    }

    const mean_return = log_returns.reduce((sum, r) => sum + r, 0) / log_returns.length;
    const variance = log_returns.reduce((sum, r) => sum + (r - mean_return) ** 2, 0) / (log_returns.length - 1);
    const daily_sigma = Math.sqrt(variance);

    const annualized_sigma = daily_sigma * Math.sqrt(trading_days_per_year);

    return Math.max(annualized_sigma, MIN_SIGMA);
}

export interface CalcGreeksParams {
    current_price: number;
    strike_price: number;
    time_to_expire: number;
    interest_rate: number;
    sigma: number;
    option_type?: OptionType;
}

export function calc_greeks({
    current_price,
    strike_price,
    time_to_expire,
    interest_rate,
    sigma,
    option_type = 'call',
}: CalcGreeksParams): GreekValues {
    return {
        delta: delta(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type),
        gamma: gamma(current_price, strike_price, time_to_expire, interest_rate, sigma),
        theta: theta(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type),
        vega: vega(current_price, strike_price, time_to_expire, interest_rate, sigma),
        rho: rho(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type),
    };
}
