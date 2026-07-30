import { renderHook, waitFor } from '@testing-library/react';
import { useStrategy, StrategyDetail } from '@/hooks/useStrategy';
import { apiClient, ApiError } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mockStrategy = {
    id: 1,
    name: 'strategy name',
    level: 'strategy level',
    category: 'strategy category',
    description: 'strategy description',

    steps: ['step 1', 'step 2', 'step 3'],
    pros: ['pros 1', 'pros 2', 'pros 3'],
    cons: ['cons 1', 'cons 2', 'cons 3'],
}

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useStrategy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useStrategy(mockStrategy.id));

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.strategy).toEqual(null);
    });

    it('returns details of strategy', async () => {
        mockApiClient.mockResolvedValue({ strategy: mockStrategy });

        const { result } = renderHook(() => useStrategy(mockStrategy.id));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        })

        expect(result.current.error).toBeNull();
        expect(result.current.strategy).toEqual({ strategy: mockStrategy });
        expect(mockApiClient).toHaveBeenCalledWith(`/simulation/strategies/${mockStrategy.id}`);
    });

})