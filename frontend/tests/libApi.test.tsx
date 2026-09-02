import { apiClient, getBackendHealth, ApiError } from "@/lib/api";

describe("API Client and Respective Utilities", () => {
    const orignialFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = orignialFetch;
    });

    describe("ApiError", () => {
            it("should correctly set properties and name", () => {
            const error = new ApiError("Bad Request", 400, { detail: "Invalid input" });
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe("ApiError");
            expect(error.status).toBe(400);
            expect(error.data).toEqual({ detail: "Invalid input" });
        });
    });

    describe("getBackendHealth", () => {
        it("should return health status when response is ok", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: "healthy" })
            });

            const result = await getBackendHealth();
            expect(result).toEqual({ status: "healthy" });
            expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/health", { cache: "no-store" });
        });

        it("should return null when response is not ok", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false
            });

            const result = await getBackendHealth();
            expect(result).toBeNull();
        });

        it("should return null when fetch throws an error", async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

            const result = await getBackendHealth();
            expect(result).toBeNull();
        });
    });

    describe("apiClient", () => {
        it("should make sucessful request and return json data", async () => {
            const mockData = { success: true };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            }); 

            const result = await apiClient("/test-endpoint");
            expect(result).toEqual(mockData);
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8000/test-endpoint",
                expect.objectContaining({
                    headers: expect.objectContaining({
                        "Content-Type": "application/json"
                    })
                })
            );
        });

        it("should attach Authorization header if token exists in sessionStorage", async () => {
            sessionStorage.setItem("token", "my-jwt-token");
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            await apiClient("/protected");
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8000/protected",
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer my-jwt-token"
                    })
                })
            );
        });

        it("should stringify body if provided", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            await apiClient("/data", { method: "POST", body: { name: "test" } } );
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8000/data",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ name: "test" })
                })
            );
        });

        it("should throw ApiError when response is not ok", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ message: "Bad Request details" })
            });

            await expect(apiClient("/bad")).rejects.toThrow(ApiError);
        });
    });
});