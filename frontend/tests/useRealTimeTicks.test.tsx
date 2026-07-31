import { renderHook, waitFor } from '@testing-library/react';
import { useRealTimeTicks, } from '@/hooks/useRealTimeTicks';
import { apiClient, } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mockrealTimeTicks = [{
    timestamp: 'string',
    price: 1,
    volume: 1,
}]

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useRealTimeTicks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useRealTimeTicks('AAPL'));

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.realTimeTicks).toEqual([]);
    });

    it('returns details of realTimeTicks', async () => {
        mockApiClient.mockResolvedValue({
            points: mockrealTimeTicks,
        });

        const { result } = renderHook(() => useRealTimeTicks('AAPL'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        })

        expect(result.current.error).toBeNull();
        expect(result.current.realTimeTicks).toEqual(mockrealTimeTicks);
        expect(mockApiClient).toHaveBeenCalledWith(`/real_time/points/${'AAPL'}`);
    });

})