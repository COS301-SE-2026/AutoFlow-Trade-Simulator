import {
    OHLCVSchema,
    OHLCVBarSchema,
    SimCreateResponseSchema,
    AssetSummarySchema,
    AssetPricesResponseSchema,
    RealTimeTickSchema,
    RealTimeDataResponseSchema,
    ChartBarSchema,
    ChartBarsResponseSchema,
    RealTimeSymbolsResponseSchema
} from "@/lib/types/assets";

describe("Asset and Simulation Schemas", () => {
    describe("OHLCVSchema", () => {
        it('validates correct OHLCV data', () => {
            const validData = {
                timestamp: "2026-09-02T12:00:00Z",
                symbol: "AAPL",
                interval: "1d",
                open: 150.5,
                high: 155.0,
                low: 149.0,
                close: 152.3,
                volume: 1000000,
            };
            expect(OHLCVSchema.parse(validData)).toEqual(validData);
        });

        it('rejects negative prices or negative volume', () => {
            const invalidPayload = {
                timestamp: "2026-09-02T12:00:00Z",
                symbol: "AAPL",
                interval: "1d",
                open: -10,
                high: 0,
                low: -5,
                close: -1,
                volume: -100,
            };
            expect(() => OHLCVSchema.parse(invalidPayload)).toThrow();
        });
    });

    describe("OHLCVBarSchema", () => {
        it("validates string-based bar data", () => {
            const validData = {
                timestamp: "2026-09-02T12:00:00Z",
                open: "150.5",
                high: "155.0",
                low: "149.0",
                close: "152.3",
                volume: "1000000",
            };
            expect(OHLCVBarSchema.parse(validData)).toEqual(validData);
        });
    });

    describe("SimCreateResponseSchema", () => {
        it("validates simulation response structure", () => {
            const validData = {
                simulation_id: 101,
                status: "COMPLETED",
                positions: { AAPL: "100", GOOGL: "50"},
                nav: "250000.00",
                bars: {
                    AAPL: [
                        {
                            timestamp: "2026-09-02T12:00:00Z",
                            open: "150.50",
                            high: "155.00",
                            low: "149.00",
                            close: "152.30",
                            volume: "1000000",
                        }
                    ]
                }
            };
            expect(SimCreateResponseSchema.parse(validData)).toEqual(validData);
        });
    });

    describe("AssetSummarySchema", () => {
        it('validates asset summary with optional open_price', () => {
            const validWithOptional = {
                ticker: "TSLA",
                current_price: 200.0,
                daily_high: 210.0,
                daily_low: 195.00,
                open_price: 198.00,
                timestamp: "2026-09-02T12:00:00Z"
            };
            const validWithoutOptional = {
                ticker: "TSLA",
                current_price: 200.0,
                daily_high: 210.0,
                daily_low: 195.00,
                timestamp: "2026-09-02T12:00:00Z"
            };

            expect(AssetSummarySchema.parse(validWithOptional)).toEqual(validWithOptional);
            expect(AssetSummarySchema.parse(validWithoutOptional)).toEqual(validWithoutOptional);
        });
    });

    describe("AssetPricesResponseSchema", () => {
        it("validates array of OHLCV items (stock data)", () => {
            const validData = [
                {
                    timestamp: "2026-09-02T12:00:00Z",
                    symbol: "AAPL",
                    interval: "1d",
                    open: 150.5,
                    high: 155.0,
                    low: 149.0,
                    close: 152.3,
                    volume: 1000000,
                }
            ];
            expect(AssetPricesResponseSchema.parse(validData)).toEqual(validData);
        });
    });

    describe("RealTimeTickSchema and RealTimeDataResponse", () => {
        it("coerces string values to numbers for real-time tick data", () => {
            const input = {
                timestamp: "2026-09-02T12:00:00Z",
                price: "150.25",
                volume: "500"
            };
            
            const parsed = RealTimeTickSchema.parse(input);
            expect(parsed).toEqual({
                timestamp: "2026-09-02T12:00:00Z",
                price: 150.25,
                volume: 500
            });
        });

        it('validates RealTimeDataResponseSchema', () => {
            const input = {
                points: [
                    { timestamp: "2026-09-02T12:00:00Z", price: 150.25, volume: 500 }
                ]
            };
            expect(RealTimeDataResponseSchema.parse(input)).toEqual(input);
        });
    });

    describe("ChartBarSchema and ChartBarsResponseSchema", () => {
        it("applies defaults for null/missing values", () => {
            const input  = { time: "2026-09-02" };
            const parsed = ChartBarSchema.parse(input);

            expect(parsed).toEqual({
                time: "2026-09-02",
                open: null,
                high: null,
                low: null,
                close: null,
                volume: 0
            });
        });

        it("validates array of charts bars", () => {
            const input = [
                {
                    time: "2026-09-02",
                    open: 100,
                    high: 105,
                    low: 99,
                    close: 102,
                    volume: 1000
                }
            ];
            expect(ChartBarsResponseSchema.parse(input)).toEqual(input);
        });
    });

    describe("RealTimeSymbolsResponseSchema", () => {
        it("validates symbols array and non-negative count", () => {
            const input = { symbols: ["AAPL", "GOOGL"], count: 2 };
            expect(RealTimeSymbolsResponseSchema.parse(input)).toEqual(input); 
        });
    });
});