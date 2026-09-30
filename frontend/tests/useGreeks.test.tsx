import { renderHook, act } from "@testing-library/react";
import { useGreeks, CalculateGreeksParams, GreekValues } from "@/hooks/useGreeks";
import { apiClient, ApiError } from "@/lib/api";

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn(),
    ApiError: class APIError extends Error{
        status: number;
        constructor(message: string, status: number) {
            super(message);
            this.status = status;
        }
    }
}));

describe("useGreeks Hook", () => {
    const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

    const validParams: CalculateGreeksParams = {
        current_price: 100,
        strike_price: 105,
        time_to_expire: 0.5,
        interest_rate: 0.05,
        sigma: 0.2,
        option_type: 'call'
    };

    const mockGreeksResponse: GreekValues = {
        delta: 0.45,
        gamma: 0.03,
        theta: -0.02,
        vega: 0.15,
        rho: 0.08
    };

    beforeEach(() =>{
        jest.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const {result} = renderHook(() => useGreeks());

        expect(result.current.greeks).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should successfully calculate greeks and update the state', async () => {
        mockApiClient.mockResolvedValueOnce(mockGreeksResponse);

        const { result } = renderHook(() => useGreeks());

        let response: GreekValues | undefined;

        await act(async () => {
            response = await result.current.calculateGreeks(validParams);
        });

        expect(mockApiClient).toHaveBeenCalledTimes(1);
        expect(mockApiClient).toHaveBeenCalledWith('/greeks/calculate', {
            method: 'POST',
            body: validParams
        });

        expect(response).toEqual(mockGreeksResponse);
        expect(result.current.greeks).toEqual(mockGreeksResponse);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('Should not make an API call on negative input parameters', async () => {
        const { result } = renderHook(() => useGreeks());

        const invalidParams: CalculateGreeksParams[] = [
            {...validParams, current_price: 0},
            {...validParams, strike_price: -10},
            {...validParams, time_to_expire: 0}
        ];

        for (const params of invalidParams) {
            await act(async () => {
                const res = await result.current.calculateGreeks(params);
                expect(res).toBeUndefined();
            });
        }

        expect(mockApiClient).not.toHaveBeenCalled();
        expect(result.current.greeks).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('should handle general API errors correctly', async () => {
        const errorMessage = 'Internal Server Error';
        mockApiClient.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useGreeks());

        await act(async () => {
            await result.current.calculateGreeks(validParams);
        });

        expect(result.current.greeks).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should clear greeks on 401 without setting an error state', async () => {
        const unauthError = new ApiError('Unauthorized', 401);
        mockApiClient.mockRejectedValueOnce(unauthError);

        const { result } = renderHook(() => useGreeks());

        await act(async () => {
            await result.current.calculateGreeks(validParams);
        });

        expect(result.current.greeks).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('Should set an error state on a non-401 erorr', async () => {
        const badRequest = new ApiError('Bad Request', 400);
        mockApiClient.mockRejectedValueOnce(badRequest);

        const { result } = renderHook(() => useGreeks());

        await act(async () => {
            await result.current.calculateGreeks(validParams);
        });

        expect(result.current.greeks).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Bad Request');
    });
});