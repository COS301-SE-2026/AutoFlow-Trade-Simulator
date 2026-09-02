import { NewsResponseSchema } from "@/lib/types/news";
import { timeStamp } from "console";

describe("News Schema", () => {
    it("validates a valid news item", () => {
        const rawInput    = {
            id: 1,
            timestamp: "2026-09-02T12:00:00Z",
            category: "Article",
            description: "Tesla announces quarterly delivery metrics.",
            source: "Financial Times",
            author: "Jane Doe",
            full_story: "Tesla has announced its quarterly delivery numbers...",
        };

        const parsed = NewsResponseSchema.shape.news_items.element.parse(rawInput);

        expect(parsed).toEqual({
            id: 1,
            timestamp: new Date("2026-09-02T12:00:00Z"),
            category: "Article",
            description: "Tesla announces quarterly delivery metrics.",
            source: "Financial Times",
            author: "Jane Doe",
            full_story: "Tesla has announced its quarterly delivery numbers...",
        });
        expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    it("accepts all valid enum inputs", () => {
        const categories = ["Rumor", "Sens", "Article", "Ruling"] as const;

        categories.forEach((category, index) => {
            const item = {
                id: index + 1,
                timestamp: "2026-09-02T12:00:00Z",
                category,
                description: "Market updates",
                full_story: "Full article contents..."
            };

            expect(() => 
                NewsResponseSchema.shape.news_items.element.parse(item)
            ).not.toThrow();
        });
    });

    it("handles optional and null source and author fields", () => {
        const itemWithNulls = {
            id: 2,
            timestamp: new Date("2026-09-02T12:00:00Z"),
            category: "Sens",
            description: "Trading Halt Notice",
            source: null,
            author: null,
            full_story: "Trading has been halted pending company release.",
        };

        const itemWithoutOptionals = {
            id: 3,
            timestamp: new Date("2026-09-02T12:00:00Z"),
            category: "Ruling",
            description: "Regulatory fine imposed",
            full_story: "Regulatory authorities ruled against the entity...",
        };

        expect(NewsResponseSchema.shape.news_items.element.parse(itemWithNulls)).toEqual(itemWithNulls);
        expect(NewsResponseSchema.shape.news_items.element.parse(itemWithoutOptionals)).toEqual(
            {
                ...itemWithoutOptionals, 
                source: undefined, 
                author: undefined
            }
        );
    });

    it("coerces ISO date strings and Unix timestamps into Date objects", () => {
        const isoStringInput = {
            id: 10,
            timestamp: "2026-09-02T10:00:00.000Z",
            category: "Rumor",
            description: "Rumor on acquisition",
            full_story: "Acquisition talk surfaces across retail forums.",
        };

        const echoInput = {
            id: 11,
            timestamp: 1788350400000,
            category: "Article",
            description: "Market roundup",
            full_story: "Markets surged following positive earnings reports.",
        };

        const parsedIso = NewsResponseSchema.shape.news_items.element.parse(isoStringInput);
        const parsedEpoch = NewsResponseSchema.shape.news_items.element.parse(echoInput);

        expect(parsedIso.timestamp).toBeInstanceOf(Date);
        expect(parsedEpoch.timestamp).toBeInstanceOf(Date);
    });

    it('reject invalid categories, non-int ids, and invalid dates', () => {
        const invalidCategory = {
            id: 1,
            timestamp: "2026-09-02T12:00:00Z",
            category: "OpEd",
            description: "Opinion piece",
            full_story: "Text..."
        };

        const floatId = {
            id: 1.5,
            timestamp: "2026-09-02T12:00:00Z",
            category: "Article",
            description: "Description",
            full_story: "Text..."
        };

        const invalidDate = {
            id: 2,
            timestamp: "not-a-valid-date",
            category: "Article",
            description: "Description",
            full_story: "Text..."
        };

        expect(() =>
            NewsResponseSchema.shape.news_items.element.parse(invalidCategory)
        ).toThrow();
        expect(() => 
            NewsResponseSchema.shape.news_items.element.parse(floatId)
        ).toThrow();
        expect(() => 
            NewsResponseSchema.shape.news_items.element.parse(invalidDate)
        ).toThrow();
    });

    it("validates a response containing an array of news items", () => {
        const mockResponse = {
             news_items: [
          {
            id: 1,
            timestamp: "2026-09-02T12:00:00Z",
            category: "Article",
            description: "First story",
            full_story: "Story body 1",
          },
          {
            id: 2,
            timestamp: "2026-09-02T13:00:00Z",
            category: "Ruling",
            description: "Second story",
            source: "SEC",
            full_story: "Story body 2",
          }
        ]
        };

        const parsed = NewsResponseSchema.parse(mockResponse);

        expect(parsed.news_items).toHaveLength(2);
        expect(parsed.news_items[0].category).toBe("Article");
        expect(parsed.news_items[1].source).toBe("SEC");
    });

    it("validates an empty news_items array", () => {
        const mockEmptyResponse = { news_items: [] };
        expect(NewsResponseSchema.parse(mockEmptyResponse)).toEqual({ news_items: [] }); 
    });

    it("rejects non-array or missing news_items payload", () => {
        expect(() => NewsResponseSchema.parse({ news_items: "not an array" })).toThrow();
        expect(() => NewsResponseSchema.parse({})).toThrow();
    });
});