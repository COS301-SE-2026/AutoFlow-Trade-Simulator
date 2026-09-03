import { calc_greeks, calc_realized_volatility, CalcGreeksParams } from "@/lib/greeks";

describe("Financial and options calculations", () => {
    describe("calc_realized_volatility", () => {
        it("should return MIN_SIGMA when fewer than 3 valid prices are provided", () => {
            const result = calc_realized_volatility([100, 101]);
            expect(result).toBe(0.01);
        });

        it("should filter out non-positive prices and handle small arrays", () => {
            const result = calc_realized_volatility([0, -5, 100, 102]);
            expect(result).toBe(0.01);
        });

        it("should correctly compute annualized volatility for valid price series", () => {
            const prices = [100, 101, 100.5, 102, 101.5, 103];
            const volatility = calc_realized_volatility(prices, 5);
            expect(volatility).toBeGreaterThan(0.01);
            expect(typeof volatility).toBe("number");
        });
    })

    describe("calc_greeks", () => {
        const params: CalcGreeksParams = {
            current_price: 100,
            strike_price: 100,
            time_to_expire: 1.0,
            interest_rate: 0.05,
            sigma: 0.2
        };

        it("should calculate call option greeks correctly", () => {
            const greeks = calc_greeks({ ...params, option_type: "call"});

            expect(greeks.delta).toBeGreaterThan(0.5);
            expect(greeks.delta).toBeLessThan(1.0);
            expect(greeks.gamma).toBeGreaterThan(0);
            expect(greeks.theta).toBeLessThan(0);
            expect(greeks.vega).toBeGreaterThan(0);
            expect(greeks.rho).toBeGreaterThan(0);
        });

        it("should calculate put option greeks correctly", () => {
            const greeks = calc_greeks({...params, option_type: "put"});

            expect(greeks.delta).toBeGreaterThan(-1.0);
            expect(greeks.delta).toBeLessThan(0);
            expect(greeks.gamma).toBeGreaterThan(0);
            expect(greeks.vega).toBeGreaterThan(0);
            expect(greeks.rho).toBeLessThan(0);
        });

        it("should throw an error for invalid option types", () => {
            expect(() => {
                calc_greeks({ ...params, option_type: "invalid" as any});
            }).toThrow("option_type must be 'call' or 'put'");
        });

        it("should default to  call option if option_type is omitted", () => {
            const defaultGreeks = calc_greeks(params);
            const explicitCallGreeks = calc_greeks({ ...params, option_type: "call" });

            expect(defaultGreeks).toEqual(explicitCallGreeks);
        });
    });
});