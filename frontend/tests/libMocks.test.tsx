import { getMockPrices } from "@/lib/mock";

describe("getMockPrices", () => {
    it("should return an array with the default count of 4 prices", () => {
        const prices = getMockPrices();
        expect(prices).toHaveLength(4);
        expect(prices.every((p => typeof p === "number"))).toBe(true);
    });

    it("should respect the specified count parameter", () => {
        const price = getMockPrices(3, 2);
        expect(price).toHaveLength(2);
    });

    it("should be deterministic for a give seed and count", () => {
        const run1 = getMockPrices(42, 5);
        const run2 = getMockPrices(42, 5);
        expect(run1).toEqual(run2);
    });

    it("should produce different results for different seeds", () => {
        const run1 = getMockPrices(1, 4);
        const run2 = getMockPrices(2, 4);
        expect(run1).not.toEqual(run2);
    });

    it("should round prices to at most 2 decimal places", () => {
        const price = getMockPrices(10, 10);
        price.forEach((price) => {
            const decimals = price.toString().split(".")[1]?.length || 0;
            expect(decimals).toBeLessThanOrEqual(2);
        });
    });
});