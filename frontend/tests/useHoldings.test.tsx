import { renderHook, waitFor } from '@testing-library/react';
import { useHoldings, } from '@/hooks/useHoldings';
import { apiClient, } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mockHoldings = [{
    asset_id: 1,
    ticker: 'AAPL',
    net_quantity: 10,
    average_cost: 150,

    current_price: 175,
    unrealised_pnl: 250
}]

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useHoldings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useHoldings(1));

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.holdings).toEqual([]);
    });

    it('returns details of holdings', async () => {
        mockApiClient.mockResolvedValueOnce({
            holdings: mockHoldings,
            loading: false,
            error: null
        }).mockResolvedValueOnce({
            current_price: 175,
        });

        const { result } = renderHook(() => useHoldings(1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        })

        expect(result.current.error).toBeNull();
        expect(result.current.holdings).toEqual(mockHoldings);
        expect(mockApiClient).toHaveBeenCalledWith(`/portfolio/accounts/${1}/holdings`);
    });
})