import { renderHook, act, waitFor } from "@testing-library/react";
import { usePortfolioHistory, PortfolioHistoryPoint } from "@/hooks/usePortfolioHistory";
import { apiClient, ApiError } from "@/lib/api";

jest.mock('@/lib/api', () => ({
  apiClient: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
}));

describe('usePortfolioHistory Hook', () => {
  const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

  const mockHistoryData: PortfolioHistoryPoint[] = [
    { date: '2026-09-01', total_value: 10000.50 },
    { date: '2026-09-02', total_value: 10250.75},
    { date: '2026-09-03', total_value: 10100.0 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state and not fetch if accountId is null', async () => {
    const { result } = renderHook(() => usePortfolioHistory(null));

    expect(result.current.points).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient).not.toHaveBeenCalled();
  });

  it('should automatically fetch history on mount when accountId is provided', async () => {
    mockApiClient.mockResolvedValueOnce({ points: mockHistoryData });

    const { result } = renderHook(() => usePortfolioHistory(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    expect(mockApiClient).toHaveBeenCalledWith('/portfolio/accounts/1/history');
    expect(result.current.points).toEqual(mockHistoryData);
    expect(result.current.error).toBeNull();
  });

  it('should refetch history when accountId changes', async () => {
    mockApiClient.mockResolvedValueOnce({ points: mockHistoryData });

    const { result, rerender } = renderHook(
      ({ accountId }: { accountId: number | null }) => usePortfolioHistory(accountId),
      { initialProps: {accountId: 1 as number | null }}
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newMockData: PortfolioHistoryPoint[] = [
      { date: '2026-09-01', total_value: 5000.0 }
    ];
    mockApiClient.mockResolvedValueOnce({ points: newMockData });

    rerender({ accountId: 2});

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApiClient).toHaveBeenCalledTimes(2);
    expect(mockApiClient).toHaveBeenLastCalledWith('/portfolio/accounts/2/history');
    expect(result.current.points).toEqual(newMockData);
  });

  it('should clear points when accountId changes to null', async () => {
    mockApiClient.mockResolvedValueOnce({ points: mockHistoryData });

    const { result, rerender } = renderHook(
      ({ accountId }: { accountId: number | null }) => usePortfolioHistory(accountId),
      { initialProps: { accountId: 1 as number | null } }
    );

    await waitFor(() => expect(result.current.points).toEqual(mockHistoryData));

    rerender({ accountId: null});

    await waitFor(() => {
      expect(result.current.points).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle general API errors', async () => {
    const errorMessage = 'Failed to fetch portfolio history';
    mockApiClient.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => usePortfolioHistory(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.points).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should reset points and keep error null on a 401 error', async () => {
    const unauthError = new ApiError('Unauthorized', 401);
    mockApiClient.mockRejectedValueOnce(unauthError);

    const { result } = renderHook(() => usePortfolioHistory(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.points).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should allow manual refetch when calling refetch', async () => {
    mockApiClient.mockResolvedValueOnce({ points: mockHistoryData });

    const { result } = renderHook(() => usePortfolioHistory(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateData: PortfolioHistoryPoint[] = [
      ...mockHistoryData,
      { date: '2026-09-04', total_value: 10500.00 } 
    ];
    mockApiClient.mockResolvedValueOnce({ points: updateData });

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockApiClient).toHaveBeenCalledTimes(2);
    expect(result.current.points).toEqual(updateData);
  });
});