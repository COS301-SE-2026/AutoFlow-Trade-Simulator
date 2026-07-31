import { act, renderHook, waitFor } from '@testing-library/react';
import { useReports, } from '@/hooks/useReports';
import { apiClient, } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class ApiError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    }
}))

const mockreport = {
    id: 1,
    report_id: 1,
    ticker: 'AAPL',
    open_price: '150.00',
    close_price: '175.00',
    pct_change: 1,
    period_high: '180.00',
    period_low: '145.00'
};

const mockreports = [mockreport];

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('useReports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('initially returns loading state', async () => {
        mockApiClient.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useReports());

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.reports).toEqual([]);
    });

    it('returns details of reports', async () => {
        mockApiClient.mockResolvedValue(mockreports);

        const { result } = renderHook(() => useReports());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        })

        expect(result.current.error).toBeNull();
        expect(result.current.reports).toEqual(mockreports);
        expect(mockApiClient).toHaveBeenCalledWith(`/reports/`);
    });

    it('can create a report', async () => {
        mockApiClient.mockResolvedValueOnce(mockreports).mockResolvedValueOnce(mockreport);

        const { result } = renderHook(() => useReports());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.createReport('2026-01-01');
        });

        expect(mockApiClient).toHaveBeenCalledWith(`/reports/`, {
            method: "POST",
            body: { period: '2026-01-01' }
        });

        expect(result.current.error).toBeNull();
        expect(result.current.reports).toHaveLength(2);
        expect(result.current.reports[1]).toEqual(mockreport);
    });

})