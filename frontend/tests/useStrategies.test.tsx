import { renderHook, waitFor } from '@testing-library/react';
import { useStrategies,  } from '@/hooks/useStrategies';
import { apiClient,  } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mockStrategies = [
    {
        id: 1,
        name: `strategy name`,
        level: `Beginner`,
        category: `strategy category`,
        description: `strategy description`,
    },
    {
        id: 2,
        name: `strategy name`,
        level: `Intermediate`,
        category: `strategy category`,
        description: `strategy description`,
    },
];

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useStrategies', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useStrategies());

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.strategies).toEqual([]);
    });

    it('returns a list of strategies', async () => {
        mockApiClient.mockResolvedValue({ strategies: mockStrategies });

        const { result } = renderHook(() => useStrategies());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBeNull();
        expect(result.current.strategies).toEqual(mockStrategies);
        expect(mockApiClient).toHaveBeenCalledWith('/simulation/strategies');
    });

})