import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions, Transactions } from '@/hooks/useTransactions';
import { apiClient, ApiError } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mocktransactions = [{
    account_id: 1,
    account_currency_code: 'string',
    asset_ticker: 'string',
    asset_id: 1,
    direction: 'string',
    quantity: 1,
    price_at_execution: 1,
    executed_at: 'string'
}]

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useTransactions(mocktransactions[0].account_id));

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.transactions).toEqual([]);
    });

    it('returns details of transactions', async () => {
        mockApiClient.mockResolvedValue(mocktransactions);

        const { result } = renderHook(() => useTransactions(mocktransactions[0].account_id));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        })

        expect(result.current.error).toBeNull();
        expect(result.current.transactions).toEqual(mocktransactions);
        expect(mockApiClient).toHaveBeenCalledWith(`/portfolio/accounts/${mocktransactions[0].account_id}/transactions`);
    });

})