import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PriceProvider, usePrice } from '@/lib/hooks/priceContext';
import { fetchAssetPrices, fetchAssetSummary } from '@/lib/api/assets';

jest.mock('@/lib/api/assets', () => ({
    fetchAssetPrices: jest.fn(),
    fetchAssetSummary: jest.fn()
}));

const mockFetchAssetPrices = fetchAssetPrices as jest.Mock;
const mockFetchAssetSummary = fetchAssetSummary as jest.Mock;

describe('PriceContext and PriceProvider', () => {
    const wrapper = ( { children } : { children: React.ReactNode }) => (
        <PriceProvider>{children}</PriceProvider>
    );

    const samplePrices = [
        { timestamp: '2026-09-01T00:00:00Z', open: 100, high: 105, low: 99, close: 104, volume: 1000 },
    ];

    const sampleSummary = {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 220.5,
        marketCap: 700000000000,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws an error is usePrice is called outside of the PriceProvider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => renderHook(() => usePrice())).toThrow(
            'usePrice must be used within PriceProvider'
        );

        consoleSpy.mockRestore();
    });

    it('provides initial default state when ticker is null', () => {
        const { result } = renderHook(() => usePrice(), {wrapper});

        expect(result.current.ticker).toBeNull();
        expect(result.current.timeframe).toBe('1d');
        expect(result.current.prices).toBeNull();
        expect(result.current.summary).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('fetches prices and summary when a valid ticker is set', async () => {
        mockFetchAssetPrices.mockResolvedValueOnce(samplePrices);
        mockFetchAssetSummary.mockResolvedValueOnce(sampleSummary);

        const { result } = renderHook(() => usePrice(), { wrapper } );

        act(() => {
            result.current.setTicker('TSLA');
        });

        expect(result.current.ticker).toBe('TSLA');
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetchAssetPrices).toHaveBeenCalledWith('TSLA', '1d');
        expect(mockFetchAssetSummary).toHaveBeenCalledWith('TSLA');
        expect(result.current.prices).toEqual(samplePrices);
        expect(result.current.summary).toEqual(sampleSummary);
        expect(result.current.error).toBeNull();
    });

    it('updates prices when timeframe changes', async () => {
        mockFetchAssetPrices.mockResolvedValue(samplePrices);
        mockFetchAssetSummary.mockResolvedValue(sampleSummary);

        const { result } = renderHook(() => usePrice(), { wrapper });

        act(() => {
            result.current.setTicker('TSLA');
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.setTimeframe('1w');
        });

        await waitFor(() => {
            expect(mockFetchAssetPrices).toHaveBeenLastCalledWith('TSLA', '1w');
        });

        expect(result.current.timeframe).toBe('1w');
    });

    it('resets prices and summary when ticker is reset to null', async () => {
        mockFetchAssetPrices.mockResolvedValueOnce(samplePrices);
        mockFetchAssetSummary.mockResolvedValueOnce(sampleSummary);

        const { result } = renderHook(() => usePrice(), { wrapper } );

        act(() => {
            result.current.setTicker('TSLA');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.setTicker('');
        });

        expect(result.current.prices).toBeNull();
        expect(result.current.summary).toBeNull();
    });

    it('handles error instance if fetchAssetPrices fails', async () => {
        mockFetchAssetPrices.mockRejectedValueOnce(new Error('Network error on prices'));
        mockFetchAssetSummary.mockResolvedValueOnce(sampleSummary);

        const { result } = renderHook(() => usePrice(), { wrapper });

        act(() => {
            result.current.setTicker('AAPL');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.prices).toBeNull();
        expect(result.current.summary).toEqual(sampleSummary);
        expect(result.current.error).toBe('Network error on prices');
    });

    it('handles non-Error objects when fetchAssetPrices fails', async () => {
        mockFetchAssetPrices.mockRejectedValueOnce('String exception');
        mockFetchAssetSummary.mockResolvedValueOnce(sampleSummary);

        const { result } = renderHook(() => usePrice(), { wrapper } );

        act(() => {
            result.current.setTicker('AAPL');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.prices).toBeNull();
        expect(result.current.error).toBe('Failed to load prices');
    });

    it('handles error instance when fetchAssetSummary fails', async () => {
        mockFetchAssetPrices.mockResolvedValueOnce(samplePrices);
        mockFetchAssetSummary.mockRejectedValueOnce(new Error('Network error on summary'));

        const { result } = renderHook(() => usePrice(), { wrapper });

        act(() => {
            result.current.setTicker('AAPL');
        });

        await waitFor(() => {
           expect(result.current.isLoading).toBe(false); 
        });

        expect(result.current.prices).toEqual(samplePrices);
        expect(result.current.summary).toBeNull();
        expect(result.current.error).toBe('Network error on summary');
    });

    it('handles non-Error objects when fetchAssetSummary fails', async () => {
        mockFetchAssetPrices.mockResolvedValueOnce(samplePrices);
        mockFetchAssetSummary.mockRejectedValueOnce('String exception');

        const { result } = renderHook(() => usePrice(), { wrapper } );

        act(() => {
            result.current.setTicker('AAPL');
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.summary).toBeNull();
        expect(result.current.error).toBe('Failed to load summary');
    });
});