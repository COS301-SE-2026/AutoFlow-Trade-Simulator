import { renderHook, waitFor, act } from '@testing-library/react';
import { useNews } from "@/hooks/useNews";
import { fetchNews } from "@/lib/api/news";

jest.mock("@/lib/api/news", () => ({
    fetchNews: jest.fn()
}));

describe("useNews Hook", () => {
    const mockFetchNews = fetchNews as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return empty items and not fetch if parameters are missing", () => {
        const { result } = renderHook(() => useNews("", null, null));

        expect(result.current.newsItems).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(mockFetchNews).not.toHaveBeenCalled();
    });

    it("should successfully fetch and map news items", async () => {
        const mockBackendResponse = {
            news_items: [
                {
                    id: 1,
                    timestamp: new Date("2026-01-01T00:00:00Z"),
                    category: "Rumor",
                    description: "Test description",
                    source: "Test Source",
                    author: "John Doe",
                    full_story: "Full story text",
                }
            ]
        };

       mockFetchNews.mockResolvedValueOnce(mockBackendResponse);

       const startDate = new Date("2026-01-01");
       const endDate = new Date("2026-01-02");

       const { result } = renderHook(() => useNews("AAPL", startDate, endDate));
       
       await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
       });

       expect(result.current.newsItems).toEqual([
            {
                id: "1",
                timestamp: mockBackendResponse.news_items[0].timestamp.toDateString(),
                category: "Rumor",
                description: "Test description",
                source: "Test Source",
                author: "John Doe",
                fullStory: "Full story text",
            }
       ]);

       expect(mockFetchNews).toHaveBeenCalledTimes(1);
    });

    it("should handle fetch errors gracefully by returning empty items and null error", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
        mockFetchNews.mockRejectedValueOnce(new Error("Network Error"));

        const startDate = new Date("2026-01-01");
        const endDate = new Date("2026-01-02");

        const { result } = renderHook(() => useNews("AAPL", startDate, endDate));
        
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.newsItems).toEqual([]);
        expect(result.current.error).toBeNull();
        consoleError.mockRestore();
    });

    it("should trigger a refetch when refetch is called", async () => {
        mockFetchNews.mockResolvedValue({ news_items: [] });
        
        const startDate = new Date("2026-01-01");
        const endDate = new Date("2026-01-02");

        const { result } = renderHook(() => useNews("AAPL", startDate, endDate));

        await waitFor(() => (
            expect(result.current.isLoading).toBe(false)
        ));

        expect(mockFetchNews).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.refetch();
        });

        await waitFor(() => {
            expect(mockFetchNews).toHaveBeenCalledTimes(2);
        });
    });
});