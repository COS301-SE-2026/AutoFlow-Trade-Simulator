import { renderHook, act, waitFor } from "@testing-library/react";
import { useTechTree } from "@/hooks/useTechTree";
import { apiClient } from "@/lib/api";
import { TechTreeResponseDTO } from "@/lib/types/techTree";

jest.mock("@/lib/api", () => ({
    apiClient: jest.fn()
}));

describe("useTechTree", () => {
    const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

    // I was playing civ and Im well aware this is meant for stock trading but I want the testing tech tree to be civ stuff
    // Now if you dont mind me to bad so sad go cry wont stop me.

    const mockTree: TechTreeResponseDTO = {
        experience_points: 1000,
        upgrades: ["Irrigation"],
        nodes: [
            {
                name: "Basic Farming",
                description: "Allows basic crops",
                cost: 100,
                prerequisites: [],
                unlocks: ["Irrigation"],
                unlocked: true,
                available: false
            },
            {
                name: "Irrigation",
                description: "Improves crop yield",
                cost: 250,
                prerequisites: ["Basic Farming"],
                unlocks: [],
                unlocked: false,
                available: true
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches tech tree automatically on mount", async () => {
        mockApiClient.mockResolvedValueOnce(mockTree);

        const { result } = renderHook(() => useTechTree());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockApiClient).toHaveBeenCalledTimes(1);
        expect(mockApiClient).toHaveBeenCalledWith("/tech_tree/tree");
        expect(result.current.tree).toEqual(mockTree);
        expect(result.current.error).toBeNull();
    });

    it("sets error when initial fetch fails", async () => {
        mockApiClient.mockRejectedValueOnce(new Error("Failed to load tree"));

        const { result } = renderHook(() => useTechTree());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.tree).toBeNull();
        expect(result.current.error).toBe("Failed to load tree");
    });

    it("allows manually refetching the tree using refetch", async () => {
        mockApiClient.mockResolvedValueOnce(mockTree);

        const { result } = renderHook(() => useTechTree());

        await waitFor(() => expect(result.current.loading).toBe(false));

        mockApiClient.mockResolvedValueOnce(mockTree);

        await act(async () => {
            await result.current.refetch();
        });

        expect(mockApiClient).toHaveBeenCalledTimes(2);
        expect(mockApiClient).toHaveBeenLastCalledWith("/tech_tree/tree");
    });

    describe("purchaseTech", () => {
        it("purchases tech successfully and refecthes tree", async () => {
            mockApiClient.mockResolvedValueOnce(mockTree);

            const { result } = renderHook(() => useTechTree());
            await waitFor(() => expect(result.current.loading).toBe(false));

            mockApiClient.mockResolvedValueOnce({
                experience_points: 750,
                upgrades: ["Irrigation"],
                purchased: "Irrigation"
            });

            mockApiClient.mockResolvedValueOnce(mockTree);

            await act(async () => {
                await result.current.purchaseTech("Irrigation");
            });

            expect(mockApiClient).toHaveBeenNthCalledWith(2, "/tech_tree/purchase", {
                method: "POST",
                body: { tech_name: "Irrigation" }
            });
            expect(mockApiClient).toHaveBeenNthCalledWith(3, "/tech_tree/tree");
            expect(result.current.error).toBeNull();
        });

        it("sets error if purchaseTech fails", async () => {
            mockApiClient.mockResolvedValueOnce(mockTree);

            const { result } = renderHook(() => useTechTree());
            await waitFor(() => expect(result.current.loading).toBe(false));

            mockApiClient.mockRejectedValueOnce(new Error("Insufficient currency"));
            
            await act(async () => {
                await result.current.purchaseTech("Irrigation");
            });

            expect(result.current.error).toBe("Insufficient currency");
            expect(result.current.loading).toBe(false);
        });
    });

    describe("isUnlocked", () => {
        it("returns boolean status on successful check", async () => {
            mockApiClient.mockResolvedValueOnce(mockTree);

            const { result } = renderHook(() => useTechTree());
            await waitFor(() => expect(result.current.loading).toBe(false));

            mockApiClient.mockResolvedValueOnce({
                tech_name: "Basic Farming",
                unlocked: true
            });

            let isUnlockedResult: boolean | undefined;

            await act(async () => {
                isUnlockedResult = await result.current.isUnlocked("Basic Farming");
            });

            expect(mockApiClient).toHaveBeenLastCalledWith(
                "/tech_tree/unlocked/Basic%20Farming"
            );
            expect(isUnlockedResult).toBe(true);
            expect(result.current.error).toBeNull();
        });

        it('sets error if isUnlocked fails', async () => {
            mockApiClient.mockResolvedValueOnce(mockTree);

            const { result } = renderHook(() => useTechTree());
            await waitFor(() => expect(result.current.loading).toBe(false));

            mockApiClient.mockRejectedValueOnce(new Error("Tech not found"));

            await act(async () => {
                await result.current.isUnlocked("Unknown Tech");
            });

            expect(result.current.error).toBe("Tech not found");
            expect(result.current.loading).toBe(false);
        });
    });
});